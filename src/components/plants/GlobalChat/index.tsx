"use client";

import { useEffect, useMemo } from "react";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { useChatMessages, useSendMessage } from "@/lib/api/hooks";
import { useVisitorStore } from "@/stores/useVisitorStore";
import { HERO_ROW_HEIGHT_LG_CLASS } from "../layout";
import { ChatInputForm } from "./ChatInputForm";
import { ChatMessageRow } from "./ChatMessageRow";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { useAutoScroll } from "./useAutoScroll";
import type { RowMessage } from "./types";

export function GlobalChat({
  slug,
  plantName,
  plantProfileImageUrl = null,
}: {
  slug: string;
  plantName: string;
  plantProfileImageUrl?: string | null;
}) {
  const visitorName = useVisitorStore((s) => s.name);
  const visitorHydrated = useVisitorStore((s) => s.hydrated);

  const {
    messages,
    isInitialLoading,
    isError,
    hasOlder,
    isLoadingOlder,
    loadOlder,
  } = useChatMessages(slug);

  const sendMessage = useSendMessage(slug);

  // Decorate each wire message with its UI kind so children can render
  // without re-deriving it. Avoids passing the visitor name to every row.
  const rowMessages: RowMessage[] = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        kind:
          m.role === "assistant"
            ? "plant"
            : visitorName && m.authorName === visitorName
              ? "you"
              : "other-visitor",
      })),
    [messages, visitorName],
  );

  // The plant is "thinking" whenever the most recent message in the room
  // is a user turn — i.e. someone is waiting for a reply. The indicator
  // clears as soon as the responder's assistant message lands (the next
  // 2s poll). If the responder is wedged, the visitor can still send.
  const lastMessage = rowMessages[rowMessages.length - 1];
  const isThinking = lastMessage?.role === "user";

  const scrollKey = `${rowMessages.length}:${isThinking ? 1 : 0}`;
  const { ref: listRef, scrollToBottom } =
    useAutoScroll<HTMLOListElement>(scrollKey);

  // Initial mount: snap to bottom once the first page lands.
  useEffect(() => {
    if (!isInitialLoading && rowMessages.length > 0) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialLoading]);

  const handleSend = async (text: string) => {
    if (!visitorName) return;
    try {
      await sendMessage.mutateAsync({ authorName: visitorName, content: text });
      scrollToBottom();
    } catch {
      // The mutation's `isError` state already surfaces the failure; we
      // don't pop a toast yet. Visitor can retry by typing again.
    }
  };

  return (
    <Card
      className={`flex h-[560px] max-h-[80vh] flex-col ${HERO_ROW_HEIGHT_LG_CLASS} lg:max-h-none`}
    >
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="min-w-0">
          <Eyebrow>Chat with the plant</Eyebrow>
          <div className="truncate text-base font-extrabold text-ink">
            #{plantName.toLowerCase().replace(/\s+/g, "-")}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <Pill tone="brand">Live agent</Pill>
          <div className="mt-1 text-xs text-ink-subtle">
            {visitorHydrated && visitorName ? (
              <>you are <span className="font-extrabold text-ink-muted">{visitorName}</span></>
            ) : (
              "…"
            )}
          </div>
        </div>
      </header>

      <ol
        ref={listRef}
        className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
        aria-live="polite"
      >
        {hasOlder && (
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => loadOlder()}
              disabled={isLoadingOlder}
              className="rounded-full bg-surface-sunken px-4 py-1.5 text-xs font-extrabold text-ink-muted transition-colors hover:bg-grey-300 disabled:opacity-60"
            >
              {isLoadingOlder ? "Loading…" : "Load older messages"}
            </button>
          </li>
        )}

        {isInitialLoading && rowMessages.length === 0 && (
          <li className="text-center text-xs text-ink-subtle">
            Loading chat history…
          </li>
        )}

        {!isInitialLoading && rowMessages.length === 0 && (
          <li className="text-center text-xs text-ink-subtle">
            No messages yet. Say hi to {plantName} 🌱
          </li>
        )}

        {isError && rowMessages.length === 0 && (
          <li className="text-center text-xs text-danger">
            Couldn&apos;t load chat history. We&apos;ll keep retrying.
          </li>
        )}

        {rowMessages.map((m) => (
          <ChatMessageRow
            key={m.id}
            message={m}
            plantName={plantName}
            plantProfileImageUrl={plantProfileImageUrl}
          />
        ))}

        {isThinking && (
          <ThinkingIndicator
            plantName={plantName}
            plantProfileImageUrl={plantProfileImageUrl}
          />
        )}
      </ol>

      <ChatInputForm
        plantName={plantName}
        visitorName={visitorName}
        disabled={!visitorHydrated || !visitorName || sendMessage.isPending}
        onSend={handleSend}
      />
    </Card>
  );
}
