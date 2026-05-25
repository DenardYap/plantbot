"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";
import type { ChatMessageDTO, HistoryWindow } from "./types";

// Sensor data lands every 30s on the Pi side. Mirror that cadence here.
const LIVE_REFETCH_MS = 30_000;
// Chat is realtime-ish; keep this short. The server-side responder is
// throttled to one reply every 5s so a 2s poll captures fresh assistant
// turns within a couple of frames of them landing in the DB.
const CHAT_POLL_MS = 2_000;
const CHAT_PAGE_SIZE = 30;

export function usePlantDetail(slug: string) {
  return useQuery({
    queryKey: ["plant", slug],
    queryFn: () => api.plant(slug),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useReadings(slug: string, window: HistoryWindow) {
  return useQuery({
    queryKey: ["readings", slug, window],
    queryFn: () => api.readings(slug, window),
    refetchInterval: LIVE_REFETCH_MS,
  });
}

// ---------------------------------------------------------------------------
// Chat — paginated history with live polling for new messages.
//
// The "live" page is owned by TanStack Query and refetched every couple of
// seconds. The "older" pages are loaded on demand via a mutation; we hold
// the accumulated older messages in component state because each page is
// keyed by a different `beforeId`, which would explode the cache key space.
// ---------------------------------------------------------------------------

export type UseChatMessagesResult = {
  messages: ChatMessageDTO[];
  isInitialLoading: boolean;
  isError: boolean;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  loadOlder: () => void;
};

export function useChatMessages(slug: string): UseChatMessagesResult {
  const live = useQuery({
    queryKey: ["chat-messages", slug],
    queryFn: () => api.messagesLatest(slug, CHAT_PAGE_SIZE),
    refetchInterval: CHAT_POLL_MS,
  });

  const [olderMessages, setOlderMessages] = useState<ChatMessageDTO[]>([]);
  const [olderHasMore, setOlderHasMore] = useState<boolean | null>(null);

  // The "next page" anchor is the oldest message we currently have.
  const oldestKnownId =
    olderMessages[0]?.id ?? live.data?.messages[0]?.id ?? null;

  const loadOlderMutation = useMutation({
    mutationFn: async () => {
      if (oldestKnownId === null) return null;
      return api.messagesBefore(slug, oldestKnownId, CHAT_PAGE_SIZE);
    },
    onSuccess: (page) => {
      if (!page) return;
      setOlderMessages((prev) => [...page.messages, ...prev]);
      setOlderHasMore(page.hasMore);
    },
  });

  const messages = useMemo(() => {
    // Dedup by id — defensive, since live polling and older loads use the
    // same id space and could in theory overlap on a race.
    const seen = new Set<number>();
    const out: ChatMessageDTO[] = [];
    for (const m of [...olderMessages, ...(live.data?.messages ?? [])]) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
    }
    return out;
  }, [olderMessages, live.data?.messages]);

  const hasOlder =
    olderHasMore !== null ? olderHasMore : live.data?.hasMore ?? false;

  return {
    messages,
    isInitialLoading: live.isLoading,
    isError: live.isError,
    hasOlder,
    isLoadingOlder: loadOlderMutation.isPending,
    loadOlder: () => loadOlderMutation.mutate(),
  };
}

export function useSendMessage(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ authorName, content }: { authorName: string; content: string }) =>
      api.postMessage(slug, authorName, content),
    onSuccess: () => {
      // Refetch the live page so the visitor sees their own bubble
      // immediately instead of waiting for the next poll tick.
      void queryClient.invalidateQueries({ queryKey: ["chat-messages", slug] });
    },
  });
}
