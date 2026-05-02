"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "./client";
import type { ChatMessage, HistoryWindow } from "./types";

// Sensor data lands every 30s on the Pi side. Mirror that cadence here.
const LIVE_REFETCH_MS = 30_000;

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

export function useChatMutation(slug: string) {
  return useMutation({
    mutationFn: (messages: ChatMessage[]) => api.chat(slug, messages),
  });
}
