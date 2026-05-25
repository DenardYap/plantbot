import "server-only";
import { generateAgentReply } from "./chatAgent";
import {
  getRecentMessages,
  hasUnansweredUserMessage,
  insertMessage,
  type ChatMessageRecord,
} from "./chatMessages";
import { censor } from "./censor";
import { getPlantBySlug, type Plant } from "./plants";

/**
 * Collapse any run of consecutive user messages down to the FIRST one in
 * the run. Matches the product rule: "the first person to send during a
 * throttle window wins the reply". Assistant turns separate runs, so
 * back-and-forth threads are preserved — we only drop messages that
 * piled on after the one that triggered the responder.
 */
function collapseUnansweredUserMessages(
  history: ChatMessageRecord[],
): ChatMessageRecord[] {
  const out: ChatMessageRecord[] = [];
  let i = 0;
  while (i < history.length) {
    if (history[i].role === "user") {
      out.push(history[i]);
      let j = i + 1;
      while (j < history.length && history[j].role === "user") j++;
      i = j;
    } else {
      out.push(history[i]);
      i++;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// In-memory per-plant scheduler.
//
// Behavior (matches the product spec):
//   - Every user message is persisted immediately and shown on screen.
//   - The plant tries to reply at most once every 5 seconds.
//   - If multiple visitors message inside the same 5s window, only the
//     LATEST message gets answered — earlier ones simply roll past.
//
// State is per-process. That's fine for our single-instance Next.js
// deployment; if/when we scale out we'd move this to Postgres advisory
// locks or Redis. Stashed on globalThis so Next's dev hot-reload doesn't
// stack timers on top of each other.
// ---------------------------------------------------------------------------

const REPLY_INTERVAL_MS = 5_000;
const HISTORY_WINDOW = 30; // trailing messages handed to the model

// Limit message length so an extreme prompt can't blow past Claude's
// context window or the Render request budget.
const MAX_MESSAGE_CHARS = 1_000;

type ResponderState = {
  /** When the next reply is allowed to start (epoch ms). */
  nextRunAt: number;
  /** node Timeout handle if a delayed run is pending; null otherwise. */
  timer: ReturnType<typeof setTimeout> | null;
  /** True while a reply is actively being generated. */
  running: boolean;
};

type GlobalWithResponder = typeof globalThis & {
  __plantResponder?: Map<string, ResponderState>;
};

const g = globalThis as GlobalWithResponder;
const STATES: Map<string, ResponderState> =
  g.__plantResponder ?? (g.__plantResponder = new Map());

function getState(slug: string): ResponderState {
  let s = STATES.get(slug);
  if (!s) {
    s = { nextRunAt: 0, timer: null, running: false };
    STATES.set(slug, s);
  }
  return s;
}

/**
 * Sanitise + length-clamp a visitor message before it touches the DB.
 * Profanity is masked rather than rejected — we want every message to
 * appear on screen, just in a PG-13 form.
 */
export function sanitizeMessage(raw: string): string {
  const trimmed = raw.trim().slice(0, MAX_MESSAGE_CHARS);
  return censor(trimmed);
}

async function runReply(slug: string, plant: Plant): Promise<void> {
  const state = getState(slug);
  state.running = true;
  state.timer = null;

  try {
    // Latest history snapshot — the model only ever responds to the most
    // recent user message, even if several arrived during the wait.
    const rawHistory = await getRecentMessages(plant.id, HISTORY_WINDOW);
    const history = collapseUnansweredUserMessages(rawHistory);
    if (!history.some((m) => m.role === "user")) return; // nothing to answer

    const reply = await generateAgentReply({ plant, history });
    await insertMessage({
      plantId: plant.id,
      role: "assistant",
      authorName: plant.name,
      content: censor(reply.reply),
      toolCalls: reply.toolCalls.length > 0 ? reply.toolCalls : null,
    });
  } catch (err) {
    console.error(`[chatResponder] reply failed for ${slug}:`, err);
  } finally {
    state.nextRunAt = Date.now() + REPLY_INTERVAL_MS;
    state.running = false;

    // If new user messages came in while we were generating, immediately
    // schedule the next reply (still respecting the 5s floor).
    const hasMore = await hasUnansweredUserMessage(plant.id).catch(() => false);
    if (hasMore) scheduleReply(slug, plant);
  }
}

function scheduleReply(slug: string, plant: Plant): void {
  const state = getState(slug);
  if (state.timer || state.running) return;

  // Always wait at least the full reply interval before answering. This
  // is the coalesce window — any other messages that land during the
  // wait get rolled into the same "latest wins" reply when the timer
  // fires. Per spec: "Claude tries to respond on a 5 second interval max".
  const delay = Math.max(REPLY_INTERVAL_MS, state.nextRunAt - Date.now());
  state.timer = setTimeout(() => {
    void runReply(slug, plant);
  }, delay);
}

/**
 * Notify the responder that a new visitor message has landed. Idempotent:
 * if a reply is already queued or running, this is a no-op (we'll pick up
 * the latest message when the timer fires).
 */
export async function notifyNewMessage(slug: string): Promise<void> {
  const plant = await getPlantBySlug(slug);
  if (!plant) return;
  scheduleReply(slug, plant);
}
