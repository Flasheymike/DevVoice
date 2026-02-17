
import { db } from "./db";
import { auditLogs, type InsertAuditLog, type AuditLog } from "@shared/schema";

export interface IStorage {
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [entry] = await db.insert(auditLogs).values(log).returning();
    return entry;
  }
}

export const storage = new DatabaseStorage();
