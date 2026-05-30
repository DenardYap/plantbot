// Thin typed fetch wrappers — keep `fetch` out of components per the
// data-fetching rule. Each function returns parsed JSON or throws.

import type {
  HistoryWindow,
  MessagesPageResponse,
  MessagesSinceResponse,
  PlantDetailResponse,
  PostMessageResponse,
  ReadingsResponse,
  WateringsResponse,
} from "./types";

async function jsonFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.error ?? "";
    } catch {
      /* swallow JSON parse errors on non-JSON bodies */
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export const api = {
  plant: (slug: string) =>
    jsonFetch<PlantDetailResponse>(`/api/plants/${slug}`),

  readings: (slug: string, window: HistoryWindow) =>
    jsonFetch<ReadingsResponse>(
      `/api/plants/${slug}/readings?window=${window}`,
    ),

  /** Newest page of chat history (latest N messages, oldest → newest). */
  messagesLatest: (slug: string, limit = 30) =>
    jsonFetch<MessagesPageResponse>(
      `/api/plants/${slug}/messages?limit=${limit}`,
    ),

  /** Page of messages strictly older than `beforeId`. */
  messagesBefore: (slug: string, beforeId: number, limit = 30) =>
    jsonFetch<MessagesPageResponse>(
      `/api/plants/${slug}/messages?before=${beforeId}&limit=${limit}`,
    ),

  /** Incremental poll — only messages with id > sinceId. */
  messagesSince: (slug: string, sinceId: number) =>
    jsonFetch<MessagesSinceResponse>(
      `/api/plants/${slug}/messages?since=${sinceId}`,
    ),

  postMessage: (
    slug: string,
    authorName: string,
    content: string,
    wateringAllowed: boolean,
  ) =>
    jsonFetch<PostMessageResponse>(`/api/plants/${slug}/messages`, {
      method: "POST",
      body: JSON.stringify({ authorName, content, wateringAllowed }),
    }),

  /** Recent watering commands for a plant (newest first). */
  waterings: (slug: string, limit = 20) =>
    jsonFetch<WateringsResponse>(
      `/api/plants/${slug}/waterings?limit=${limit}`,
    ),
};
