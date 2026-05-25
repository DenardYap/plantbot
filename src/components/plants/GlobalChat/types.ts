import type { ChatMessageDTO } from "@/lib/api/types";

/**
 * UI-only category for a chat row, derived from the wire role + the
 * current visitor's display name. We don't store this server-side — the
 * server doesn't know which visitor is "you".
 */
export type RowKind = "plant" | "you" | "other-visitor";

export type RowMessage = ChatMessageDTO & { kind: RowKind };
