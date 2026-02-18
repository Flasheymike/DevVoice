import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let _pool: InstanceType<typeof Pool> | null = null;
let _db: DbInstance | null = null;
let _initialized = false;

function initDb(): void {
  if (_initialized) return;
  _initialized = true;

  if (!process.env.DATABASE_URL) {
    console.warn(
      "[warn] DATABASE_URL is not set. Running without database — audit logging is disabled.",
    );
    return;
  }

  _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  _db = drizzle(_pool, { schema });
}

export function getDb(): DbInstance | null {
  initDb();
  return _db;
}

export function isDbAvailable(): boolean {
  initDb();
  return _db !== null;
}
