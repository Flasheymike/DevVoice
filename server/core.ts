
import { Intent, IntentType, IntentTypeEnum } from "@shared/schema";
import * as path from "path";

// === 1. INTENTS & PARSER ===

export function parseIntent(text: string): Intent | null {
  const lower = text.toLowerCase().trim();

  // Phase 1 Rules
  if (lower.match(/^(list files|show files|ls)/)) {
    return {
      intent_type: "LIST_FILES",
      parameters: {},
      requires_confirmation: true,
      risk_level: "LOW"
    };
  }

  const openMatch = lower.match(/^(open|show|read)\s+(.+)/);
  if (openMatch) {
    return {
      intent_type: "OPEN_FILE",
      parameters: { path: openMatch[2].trim() },
      requires_confirmation: true,
      risk_level: "LOW"
    };
  }

  if (lower.match(/^(run tests|test)/)) {
    return {
      intent_type: "RUN_TESTS",
      parameters: {},
      requires_confirmation: true,
      risk_level: "MEDIUM"
    };
  }

  const searchMatch = lower.match(/^search\s+(.+)/);
  if (searchMatch) {
    return {
      intent_type: "SEARCH_CODE",
      parameters: { query: searchMatch[1].trim() },
      requires_confirmation: true,
      risk_level: "LOW"
    };
  }

  if (lower.match(/^(install dependencies|npm install)/)) {
    return {
      intent_type: "INSTALL_DEPENDENCIES",
      parameters: {},
      requires_confirmation: true,
      risk_level: "MEDIUM"
    };
  }

  return null;
}

// === 2. SAFETY & POLICY ===

export const PROJECT_ROOT = process.cwd();

export function normalizeUserPath(userPath: string, root: string = PROJECT_ROOT): string | null {
  // 1. Resolve absolute path
  const resolved = path.resolve(root, userPath);
  
  // 2. Enforce sandbox: must start with PROJECT_ROOT
  // On Replit, PROJECT_ROOT is often /home/runner/workspace
  // We need to ensure we're comparing the real paths
  const realRoot = root.endsWith("/") ? root : root + "/";
  const realResolved = resolved.endsWith("/") ? resolved : resolved + "/";

  if (!resolved.startsWith(root)) {
    return null;
  }
  
  return resolved;
}

export function isAllowedIntent(intentType: IntentType): boolean {
  const WHITELIST = new Set([
    "LIST_FILES",
    "OPEN_FILE",
    "RUN_TESTS",
    "SEARCH_CODE",
    "INSTALL_DEPENDENCIES"
  ]);
  return WHITELIST.has(intentType);
}
