// Shared client-safe types for the live API.
// Mirror the JSON shape of the route handlers in src/app/api/*.

export type PlantDTO = {
  id: number;
  slug: string;
  name: string;
  nickname: string | null;
  commonName: string;
  species: string;
  personality: string;
  facts: string[];
  profileImageUrl: string | null;
  createdAt: string;
};

export type SensorReadingDTO = {
  recordedAt: string;
  temperatureC: number | null;
  humidityPct: number | null;
  soilMoisturePct: number | null;
  soilVoltage: number | null;
};

export type LatestReadingDTO = SensorReadingDTO & { ageMs: number };

export type CurrentReadings = {
  temperatureC: number | null;
  humidityPct: number | null;
  soilMoisturePct: number | null;
};

import type { Status } from "../health";

export type HealthSummaryDTO = {
  overall: Status;
  score: number;
  temperature: { status: Status; message: string };
  humidity: { status: Status; message: string };
  soil: { status: Status; message: string };
  headline: string;
};

export type PlantDetailResponse = {
  plant: PlantDTO;
  latest: LatestReadingDTO | null;
  current: CurrentReadings;
  health: HealthSummaryDTO;
};

export type HistoryWindow = "5m" | "6h" | "7d" | "90d";

export type ReadingsResponse = {
  window: HistoryWindow;
  windows: HistoryWindow[];
  readings: SensorReadingDTO[];
};

// ---------------------------------------------------------------------------
// Chat — persistent, paginated, multi-visitor.
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant";

export type ChatMessageDTO = {
  id: number;
  role: ChatRole;
  authorName: string;
  content: string;
  toolCalls: { name: string }[] | null;
  createdAt: string;
};

/** Response shape for both the "newest page" and "older page" GETs. */
export type MessagesPageResponse = {
  messages: ChatMessageDTO[];
  hasMore: boolean;
  oldestId: number | null;
};

/** Response shape for `?since=<id>` incremental polling. */
export type MessagesSinceResponse = {
  messages: ChatMessageDTO[];
  hasMore: false;
  oldestId: null;
};

export type PostMessageResponse = {
  message: ChatMessageDTO;
};
