import { getDb } from "./db";
import { auditLogs, type InsertAuditLog, type AuditLog } from "@shared/schema";

export interface IStorage {
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const db = getDb();
    if (!db) {
      console.warn(`[warn] Audit log skipped (no database): ${log.intentType} ${log.outcome}`);
      return {
        id: -1,
        planId: log.planId,
        intentType: log.intentType,
        outcome: log.outcome,
        timestamp: new Date(),
        details: log.details ?? null,
      };
    }
    const [entry] = await db.insert(auditLogs).values(log).returning();
    return entry;
  }
}

export const storage = new DatabaseStorage();
