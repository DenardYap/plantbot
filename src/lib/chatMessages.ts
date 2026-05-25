import "server-only";
import { query } from "./db";

// ---------------------------------------------------------------------------
// Schema (auto-applied on first call)
//
// We keep migrations zero-effort by ensuring the table + indexes exist
// lazily. The promise is cached so concurrent requests share one round-trip
// and we don't hammer the DB with CREATE statements.
// ---------------------------------------------------------------------------

let schemaPromise: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (schemaPromise) return schemaPromise;
  schemaPromise = (async () => {
    await query(
      `CREATE TABLE IF NOT EXISTS chat_messages (
         id           BIGSERIAL PRIMARY KEY,
         plant_id     INTEGER     NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
         role         TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
         author_name  TEXT        NOT NULL,
         content      TEXT        NOT NULL,
         tool_calls   JSONB,
         created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
       )`,
    );
    // Latest-N lookups and "older than X" pagination both filter by plant
    // and order by id. One composite index covers both.
    await query(
      `CREATE INDEX IF NOT EXISTS chat_messages_plant_id_id_idx
         ON chat_messages (plant_id, id DESC)`,
    );
  })().catch((err) => {
    // Reset so a later request can retry rather than being permanently
    // stuck behind a poisoned promise.
    schemaPromise = null;
    throw err;
  });
  return schemaPromise;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant";

export type StoredToolCall = { name: string };

export type ChatMessageRecord = {
  id: number;
  plantId: number;
  role: ChatRole;
  authorName: string;
  content: string;
  toolCalls: StoredToolCall[] | null;
  createdAt: string;
};

type ChatMessageRow = {
  id: string;
  plant_id: number;
  role: ChatRole;
  author_name: string;
  content: string;
  tool_calls: StoredToolCall[] | null;
  created_at: Date;
};

function rowToRecord(row: ChatMessageRow): ChatMessageRecord {
  return {
    id: Number(row.id),
    plantId: row.plant_id,
    role: row.role,
    authorName: row.author_name,
    content: row.content,
    toolCalls: row.tool_calls,
    createdAt: row.created_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export type ListMessagesArgs = {
  plantId: number;
  /** Page size (clamped server-side). */
  limit?: number;
  /** Return messages strictly older than this id. Omit for newest page. */
  beforeId?: number;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Returns up to `limit` messages for the plant, ordered oldest → newest
 * inside the page. `hasMore` indicates there are still older messages
 * available beyond the page.
 */
export async function listMessages({
  plantId,
  limit = DEFAULT_LIMIT,
  beforeId,
}: ListMessagesArgs): Promise<{
  messages: ChatMessageRecord[];
  hasMore: boolean;
  oldestId: number | null;
}> {
  await ensureSchema();
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, limit));
  // Fetch one extra row so we can answer "has more" without a separate count.
  const rows = await query<ChatMessageRow>(
    beforeId !== undefined
      ? `SELECT id, plant_id, role, author_name, content, tool_calls, created_at
           FROM chat_messages
          WHERE plant_id = $1 AND id < $2
          ORDER BY id DESC
          LIMIT $3`
      : `SELECT id, plant_id, role, author_name, content, tool_calls, created_at
           FROM chat_messages
          WHERE plant_id = $1
          ORDER BY id DESC
          LIMIT $2`,
    beforeId !== undefined ? [plantId, beforeId, safeLimit + 1] : [plantId, safeLimit + 1],
  );

  const hasMore = rows.length > safeLimit;
  const trimmed = hasMore ? rows.slice(0, safeLimit) : rows;
  // Caller wants chronological order — reverse the DESC result.
  const messages = trimmed.map(rowToRecord).reverse();
  return {
    messages,
    hasMore,
    oldestId: messages[0]?.id ?? null,
  };
}

/**
 * Messages strictly newer than `sinceId`, ordered oldest → newest. Used by
 * the chat poller so each refetch is a tiny incremental query.
 */
export async function listMessagesSince(
  plantId: number,
  sinceId: number,
  limit: number = MAX_LIMIT,
): Promise<ChatMessageRecord[]> {
  await ensureSchema();
  const safeLimit = Math.max(1, Math.min(MAX_LIMIT, limit));
  const rows = await query<ChatMessageRow>(
    `SELECT id, plant_id, role, author_name, content, tool_calls, created_at
       FROM chat_messages
      WHERE plant_id = $1 AND id > $2
      ORDER BY id ASC
      LIMIT $3`,
    [plantId, sinceId, safeLimit],
  );
  return rows.map(rowToRecord);
}

export type InsertMessageArgs = {
  plantId: number;
  role: ChatRole;
  authorName: string;
  content: string;
  toolCalls?: StoredToolCall[] | null;
};

export async function insertMessage(
  args: InsertMessageArgs,
): Promise<ChatMessageRecord> {
  await ensureSchema();
  const rows = await query<ChatMessageRow>(
    `INSERT INTO chat_messages (plant_id, role, author_name, content, tool_calls)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, plant_id, role, author_name, content, tool_calls, created_at`,
    [
      args.plantId,
      args.role,
      args.authorName,
      args.content,
      args.toolCalls ? JSON.stringify(args.toolCalls) : null,
    ],
  );
  if (!rows[0]) throw new Error("Failed to insert chat message");
  return rowToRecord(rows[0]);
}

/**
 * Has any user message landed since the most recent assistant reply
 * (or since the start of the conversation if there is none yet)?
 */
export async function hasUnansweredUserMessage(
  plantId: number,
): Promise<boolean> {
  await ensureSchema();
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM chat_messages
        WHERE plant_id = $1
          AND role = 'user'
          AND id > COALESCE(
            (SELECT MAX(id) FROM chat_messages
              WHERE plant_id = $1 AND role = 'assistant'),
            0
          )
     ) AS exists`,
    [plantId],
  );
  return Boolean(rows[0]?.exists);
}

/**
 * Returns the trailing N messages for the plant in chronological order.
 * Used to give the model recent conversational context without dragging
 * the entire history through every request.
 */
export async function getRecentMessages(
  plantId: number,
  limit: number,
): Promise<ChatMessageRecord[]> {
  const { messages } = await listMessages({ plantId, limit });
  return messages;
}
