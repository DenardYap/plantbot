// Thin typed fetch wrappers — keep `fetch` out of components per the
// data-fetching rule. Each function returns parsed JSON or throws.

import type {
  ChatMessage,
  ChatResponse,
  HistoryWindow,
  PlantDetailResponse,
  ReadingsResponse,
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

  chat: (slug: string, messages: ChatMessage[]) =>
    jsonFetch<ChatResponse>(`/api/chat`, {
      method: "POST",
      body: JSON.stringify({ slug, messages }),
    }),
};
