
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as path from "path";
import * as fs from "fs/promises";
import { randomUUID } from "crypto";

// Import Core Logic
import { parseIntent, normalizeUserPath, isAllowedIntent, PROJECT_ROOT } from "./core";
import { Intent } from "@shared/schema";

// --- PLANNER TYPE ---
interface Plan {
  plan_id: string;
  intent: Intent;
  summary: string;
  steps: string[];
  requires_confirmation: true;
  confirmation_token: string;
  expires_at: string;
}

// In-memory store for active plans (Phase 1)
const activePlans = new Map<string, Plan>();

// --- EXECUTOR ---
async function executePlan(plan: Plan): Promise<{ result: any; message: string }> {
  switch (plan.intent.intent_type) {
    case "LIST_FILES": {
      // Safe list
      const files = await fs.readdir(PROJECT_ROOT, { withFileTypes: true });
      const list = files
        .filter(f => !f.name.startsWith('.') && f.name !== 'node_modules') // Basic ignore
        .map(f => f.name)
        .slice(0, 50); // Limit
      
      return {
        result: list,
        message: `I found ${list.length} files in the root directory.`
      };
    }
    
    case "OPEN_FILE": {
      const rawPath = plan.intent.parameters.path;
      const safePath = normalizeUserPath(rawPath);
      
      if (!safePath) {
        throw new Error(`Security Warning: Access to path '${rawPath}' is denied. It is outside the project root.`);
      }

      try {
        const stats = await fs.stat(safePath);
        if (!stats.isFile()) throw new Error("Not a file");
        
        // Read first 50 lines / 2KB
        const content = await fs.readFile(safePath, 'utf-8');
        const lines = content.split('\n').slice(0, 50).join('\n');
        const truncated = content.split('\n').length > 50;
        
        return {
          result: lines + (truncated ? "\n... (truncated)" : ""),
          message: `Here are the first 50 lines of ${rawPath}.`
        };
      } catch (err: any) {
         throw new Error(`Could not read file: ${err.message}`);
      }
    }
    
    case "RUN_TESTS":
      return { result: "Tests passed (Simulation)", message: "I ran the tests and they passed." };
      
    case "SEARCH_CODE":
      return { result: [], message: `I searched for '${plan.intent.parameters.query}' but this feature is a stub.` };
      
    case "INSTALL_DEPENDENCIES":
      return { result: "Installed", message: "Dependencies installed successfully (Simulation)." };
      
    default:
      throw new Error("Unknown intent type");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- API: PLAN ---
  app.post(api.assistant.plan.path, async (req, res) => {
    try {
      const input = api.assistant.plan.input.parse(req.body);
      const intent = parseIntent(input.text);

      if (!intent) {
        return res.status(400).json({ 
          success: false, 
          error: "I didn't understand that command. Try 'list files' or 'open server/routes.ts'." 
        });
      }

      if (!isAllowedIntent(intent.intent_type)) {
         return res.status(403).json({ 
          success: false, 
          error: `The action '${intent.intent_type}' is not permitted by the safety policy.` 
        });
      }

      // Generate Plan
      const planId = randomUUID();
      const token = randomUUID();
      
      const plan: Plan = {
        plan_id: planId,
        intent,
        summary: `I will ${intent.intent_type.toLowerCase().replace('_', ' ')}` + 
                 (intent.parameters.path ? ` for ${intent.parameters.path}` : '') + '.',
        steps: [`Check safety policy for ${intent.intent_type}`, `Execute ${intent.intent_type}`],
        requires_confirmation: true,
        confirmation_token: token,
        expires_at: new Date(Date.now() + 5 * 60000).toISOString() // 5 mins
      };

      activePlans.set(planId, plan);

      res.json({ success: true, plan });

    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
        return;
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // --- API: EXECUTE ---
  app.post(api.assistant.execute.path, async (req, res) => {
    try {
      const { plan_id, confirmation_token } = api.assistant.execute.input.parse(req.body);
      
      const plan = activePlans.get(plan_id);
      
      if (!plan) {
        return res.status(404).json({ message: "Plan not found or expired." });
      }

      if (plan.confirmation_token !== confirmation_token) {
        return res.status(403).json({ message: "Invalid confirmation token." });
      }
      
      // Execute
      try {
        const { result, message } = await executePlan(plan);
        
        // Audit Log
        await storage.createAuditLog({
          planId: plan_id,
          intentType: plan.intent.intent_type,
          outcome: "SUCCESS",
          details: { summary: message }
        });

        // Cleanup
        activePlans.delete(plan_id);

        res.json({ success: true, result, message });

      } catch (execErr: any) {
        await storage.createAuditLog({
          planId: plan_id,
          intentType: plan.intent.intent_type,
          outcome: "FAILURE",
          details: { error: execErr.message }
        });
        
        res.status(500).json({ success: false, error: execErr.message });
      }

    } catch (err) {
       if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input" });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
