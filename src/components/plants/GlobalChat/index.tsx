"use client";

import { useEffect, useMemo, useRef } from "react";
import { Card, Eyebrow, Pill } from "@/components/ui";
import { useChatMessages, useSendMessage } from "@/lib/api/hooks";
import { useDropletsStore } from "@/stores/useDropletsStore";
import { useEnsureVisitor, useVisitorStore } from "@/stores/useVisitorStore";
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
  useEnsureVisitor();
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

  // -- Droplet bookkeeping -------------------------------------------------
  //
  // Droplets are spent client-side: when an *assistant* message appears
  // confirming a `water_plant` tool call with status="watered" (the Pi
  // actually fired the pump), and the user turn it was replying to was
  // authored by the current visitor, we burn one droplet from the local
  // store. We track the highest message id we've already reacted to in a
  // ref so the same assistant message never decrements twice (the live
  // poll re-fetches the same rows every 2s).
  //
  // We deliberately do NOT decrement on status="queued" — that's
  // optimistic and can be invalidated by the Pi (e.g. cooldown skip), so
  // charging on "queued" lets visitors lose droplets to waterings that
  // physically never happened.
  //
  // The "first batch" (chat history fetched on mount) is ignored — those
  // watering events happened before this session started and were already
  // accounted for in localStorage at the time.
  const lastReactedIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (rowMessages.length === 0 || !visitorName) return;
    const maxId = rowMessages[rowMessages.length - 1].id;
    if (lastReactedIdRef.current === null) {
      lastReactedIdRef.current = maxId;
      return;
    }
    const cutoff = lastReactedIdRef.current;
    for (let i = 0; i < rowMessages.length; i++) {
      const msg = rowMessages[i];
      if (msg.id <= cutoff) continue;
      if (msg.role !== "assistant") continue;
      const watered = msg.toolCalls?.some(
        (tc) => tc.name === "water_plant" && tc.status === "watered",
      );
      if (!watered) continue;
      // Find the user turn this assistant message replied to (most recent
      // preceding user message).
      let triggerAuthor: string | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (rowMessages[j].role === "user") {
          triggerAuthor = rowMessages[j].authorName;
          break;
        }
      }
      if (triggerAuthor === visitorName) {
        useDropletsStore.getState().useDroplet();
      }
    }
    lastReactedIdRef.current = maxId;
  }, [rowMessages, visitorName]);

  const handleSend = async (text: string) => {
    if (!visitorName) return;
    // Snapshot droplet state at send time so the agent sees an authoritative
    // flag for THIS message. Refill first in case the tab crossed midnight.
    const droplets = useDropletsStore.getState();
    droplets.refillIfNewDay();
    const wateringAllowed = useDropletsStore.getState().count > 0;
    try {
      await sendMessage.mutateAsync({
        authorName: visitorName,
        content: text,
        wateringAllowed,
      });
      scrollToBottom();
    } catch {
      // The mutation's `isError` state already surfaces the failure; we
      // don't pop a toast yet. Visitor can retry by typing again.
    }
  };

  return (
    <Card
      className={`flex h-[440px] max-h-[70vh] flex-col sm:h-[560px] sm:max-h-[80vh] ${HERO_ROW_HEIGHT_LG_CLASS} lg:max-h-none`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <Eyebrow>Chat with the plant</Eyebrow>
          <div className="truncate text-sm font-extrabold text-ink sm:text-base">
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
        className="flex-1 space-y-4 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4"
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
