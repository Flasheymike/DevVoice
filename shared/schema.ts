
import { pgTable, text, serial, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === INTENT TYPES ===
export const IntentTypeEnum = z.enum([
  "LIST_FILES",
  "OPEN_FILE",
  "RUN_TESTS",
  "SEARCH_CODE",
  "INSTALL_DEPENDENCIES"
]);
export type IntentType = z.infer<typeof IntentTypeEnum>;

export const RiskLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export type RiskLevel = z.infer<typeof RiskLevelEnum>;

// === INTENT SCHEMA ===
export const IntentSchema = z.object({
  intent_type: IntentTypeEnum,
  parameters: z.record(z.any()),
  requires_confirmation: z.boolean(),
  risk_level: RiskLevelEnum
});
export type Intent = z.infer<typeof IntentSchema>;

// === PLAN SCHEMA ===
export const PlanSchema = z.object({
  plan_id: z.string(),
  intent: IntentSchema,
  summary: z.string(),
  steps: z.array(z.string()),
  requires_confirmation: z.boolean(),
  confirmation_token: z.string(),
  expires_at: z.string(), // ISO string
});
export type Plan = z.infer<typeof PlanSchema>;

// === API REQUEST/RESPONSE SCHEMAS ===

// POST /api/plan
export const PlanRequestSchema = z.object({
  text: z.string()
});
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

export const PlanResponseSchema = z.union([
  z.object({ success: z.literal(true), plan: PlanSchema }),
  z.object({ success: z.literal(false), error: z.string() })
]);
export type PlanResponse = z.infer<typeof PlanResponseSchema>;

// POST /api/execute
export const ExecuteRequestSchema = z.object({
  plan_id: z.string(),
  confirmation_token: z.string()
});
export type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;

export const ExecuteResponseSchema = z.object({
  success: z.boolean(),
  result: z.any(),
  message: z.string().optional(),
  error: z.string().optional()
});
export type ExecuteResponse = z.infer<typeof ExecuteResponseSchema>;

// === DATABASE SCHEMA (Optional for Phase 1, but good for structure) ===
// We are using in-memory for Phase 1 as requested, but we can define an audit log table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  planId: text("plan_id").notNull(),
  intentType: text("intent_type").notNull(),
  outcome: text("outcome").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  details: jsonb("details"),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
