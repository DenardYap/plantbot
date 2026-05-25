import "server-only";
import { Pool } from "pg";

// Single shared pool. Hot-reload safe: stash on globalThis so dev rebuilds
// don't leak connections (Postgres has tight conn limits on Render free tier).
const globalForPg = globalThis as unknown as { __pgPool?: Pool };

function getPool(): Pool {
  if (globalForPg.__pgPool) return globalForPg.__pgPool;

  // Without this guard, pg silently falls back to 127.0.0.1:5432, which
  // produces confusing ECONNREFUSED errors during builds on hosts with no DB.
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Refusing to connect to Postgres without an explicit connection string.",
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Render Postgres requires SSL.
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  if (process.env.NODE_ENV !== "production") globalForPg.__pgPool = pool;
  return pool;
}

export async function query<T = unknown>(
  text: string,
  params?: readonly unknown[],
): Promise<T[]> {
  const res = await getPool().query(text, params as unknown[]);
  return res.rows as T[];
}
