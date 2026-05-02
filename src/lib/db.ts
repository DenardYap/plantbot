import "server-only";
import { Pool } from "pg";

// Single shared pool. Hot-reload safe: stash on globalThis so dev rebuilds
// don't leak connections (Postgres has tight conn limits on Render free tier).
const globalForPg = globalThis as unknown as { __pgPool?: Pool };

export const pool: Pool =
  globalForPg.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Render Postgres requires SSL.
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") globalForPg.__pgPool = pool;

export async function query<T = unknown>(
  text: string,
  params?: readonly unknown[],
): Promise<T[]> {
  const res = await pool.query(text, params as unknown[]);
  return res.rows as T[];
}
