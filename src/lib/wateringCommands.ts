import "server-only";
import { query } from "./db";

// ---------------------------------------------------------------------------
// Schema (auto-applied on first call)
//
// The Raspberry Pi watches this table: any row with status = 'pending' tells
// it to fire the pump for the linked plant. After watering, the Pi flips the
// row to 'completed' (or 'failed') and stamps `executed_at` (and `error`
// on failure).
//
// This schema MUST match the one the Pi/migration script already created on
// the Render Postgres instance — column names, types, and defaults.
// ---------------------------------------------------------------------------

let schemaPromise: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    // CREATE TABLE IF NOT EXISTS is a no-op when the canonical table already
    // exists (which it does in production). Kept here so a fresh dev DB
    // bootstraps to the same shape without needing a manual migration.
    //
    // NOTE: status uses the Pi's vocabulary — `done`, not `completed` — so
    // fresh installs match what the hardware actually writes back. The
    // production table predates this CHECK and has no constraint at all,
    // which is fine: this is purely belt-and-braces for new environments.
    await query(
      `CREATE TABLE IF NOT EXISTS watering_commands (
         id            SERIAL      PRIMARY KEY,
         plant_id      INTEGER     NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
         duration_ms   INTEGER     NOT NULL DEFAULT 150,
         status        TEXT        NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'done', 'failed', 'skipped')),
         source        TEXT        NOT NULL DEFAULT 'agent',
         requested_by  TEXT,
         created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
         executed_at   TIMESTAMPTZ,
         error         TEXT
       )`,
    );
    // The Pi's hot-path poll is "oldest pending row", and a partial index
    // on (created_at) WHERE status = 'pending' is already the canonical one
    // (named idx_watering_pending). Recreate it idempotently for fresh DBs.
    await query(
      `CREATE INDEX IF NOT EXISTS idx_watering_pending
         ON watering_commands (created_at)
       WHERE status = 'pending'`,
    );
    // Backfill: who requested this watering? Nullable — older rows and any
    // pump triggered outside the chat (e.g. `manual-test` source) won't have
    // a name attached.
    await query(
      `ALTER TABLE watering_commands
        ADD COLUMN IF NOT EXISTS requested_by TEXT`,
    );
  })().catch((err) => {
    schemaPromise = null;
    throw err;
  });
  return schemaPromise;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WateringCommandStatus = "pending" | "done" | "failed" | "skipped";

export type WateringCommand = {
  id: number;
  plantId: number;
  durationMs: number;
  status: WateringCommandStatus;
  source: string;
  /** Display name of the visitor that triggered the watering, if known. */
  requestedBy: string | null;
  createdAt: string;
  executedAt: string | null;
  error: string | null;
};

type WateringCommandRow = {
  id: number;
  plant_id: number;
  duration_ms: number;
  status: WateringCommandStatus;
  source: string;
  requested_by: string | null;
  created_at: Date;
  executed_at: Date | null;
  error: string | null;
};

function rowToCommand(row: WateringCommandRow): WateringCommand {
  return {
    id: row.id,
    plantId: row.plant_id,
    durationMs: row.duration_ms,
    status: row.status,
    source: row.source,
    requestedBy: row.requested_by,
    createdAt: row.created_at.toISOString(),
    executedAt: row.executed_at?.toISOString() ?? null,
    error: row.error,
  };
}

const COMMAND_COLS = `id, plant_id, duration_ms, status, source, requested_by, created_at, executed_at, error`;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the oldest still-pending watering command for the plant, if any.
 * Used by the chat agent to avoid queuing a second command on top of one
 * the Pi hasn't fulfilled yet (which would over-water).
 */
export async function getPendingWateringCommand(
  plantId: number,
): Promise<WateringCommand | null> {
  await ensureSchema();
  const rows = await query<WateringCommandRow>(
    `SELECT ${COMMAND_COLS}
       FROM watering_commands
      WHERE plant_id = $1 AND status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1`,
    [plantId],
  );
  return rows[0] ? rowToCommand(rows[0]) : null;
}

export type EnqueueWateringCommandArgs = {
  plantId: number;
  /** Pump duration in ms. Falls back to the column default (150) when omitted. */
  durationMs?: number;
  /** Origin of the command — defaults to 'agent' (the chat agent). */
  source?: string;
  /** Display name of the visitor that triggered the watering. */
  requestedBy?: string | null;
};

/**
 * Insert a new pending watering command. The Raspberry Pi picks this up on
 * its next poll and physically dispenses water.
 */
export async function enqueueWateringCommand(
  args: EnqueueWateringCommandArgs,
): Promise<WateringCommand> {
  await ensureSchema();
  // Build the column list dynamically so we let Postgres apply the canonical
  // defaults (duration_ms=150, source='agent') unless the caller overrides.
  const cols: string[] = ["plant_id"];
  const params: unknown[] = [args.plantId];
  if (args.durationMs !== undefined) {
    cols.push("duration_ms");
    params.push(args.durationMs);
  }
  if (args.source !== undefined) {
    cols.push("source");
    params.push(args.source);
  }
  if (args.requestedBy != null && args.requestedBy.length > 0) {
    cols.push("requested_by");
    params.push(args.requestedBy);
  }
  const placeholders = params.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await query<WateringCommandRow>(
    `INSERT INTO watering_commands (${cols.join(", ")})
     VALUES (${placeholders})
     RETURNING ${COMMAND_COLS}`,
    params,
  );
  if (!rows[0]) throw new Error("Failed to enqueue watering command");
  return rowToCommand(rows[0]);
}

/** Single-row lookup by id — used to poll for status transitions. */
export async function getWateringCommandById(
  id: number,
): Promise<WateringCommand | null> {
  await ensureSchema();
  const rows = await query<WateringCommandRow>(
    `SELECT ${COMMAND_COLS}
       FROM watering_commands
      WHERE id = $1
      LIMIT 1`,
    [id],
  );
  return rows[0] ? rowToCommand(rows[0]) : null;
}

export type WaitForWateringResultOptions = {
  /** Total time we'll wait for the Pi to flip status before giving up. */
  timeoutMs?: number;
  /** Polling cadence. Cheap to keep tight — the row is on the hot path. */
  intervalMs?: number;
};

/**
 * Block until the Pi flips the row out of `pending` (`done` / `skipped` /
 * `failed`), or `timeoutMs` elapses. Returns the latest known row
 * regardless — callers should branch on `status` to decide what to tell
 * the visitor. Returns `null` only if the row was deleted (shouldn't
 * happen — there's no DELETE in the app).
 *
 * Why this exists: the Pi has its own pump cooldown that can reject a
 * just-inserted command in ~400ms. Returning "queued" optimistically
 * would charge the visitor a droplet for a watering that physically
 * never happens.
 */
export async function waitForWateringResult(
  id: number,
  { timeoutMs = 3_000, intervalMs = 200 }: WaitForWateringResultOptions = {},
): Promise<WateringCommand | null> {
  const deadline = Date.now() + timeoutMs;
  let latest: WateringCommand | null = null;
  while (Date.now() < deadline) {
    latest = await getWateringCommandById(id);
    if (!latest) return null;
    if (latest.status !== "pending") return latest;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  // One final read after the loop in case the Pi flipped during the
  // last sleep window.
  return (await getWateringCommandById(id)) ?? latest;
}

/**
 * Latest watering commands for the plant, newest first. Used by the
 * watering-history UI and any future "pump audit" tooling. `limit` is
 * clamped server-side to keep the response small.
 */
export async function listRecentWateringCommands(
  plantId: number,
  limit: number = 20,
): Promise<WateringCommand[]> {
  await ensureSchema();
  const safeLimit = Math.max(1, Math.min(100, limit));
  const rows = await query<WateringCommandRow>(
    `SELECT ${COMMAND_COLS}
       FROM watering_commands
      WHERE plant_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT $2`,
    [plantId, safeLimit],
  );
  return rows.map(rowToCommand);
}
