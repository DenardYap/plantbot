import "server-only";
import { query } from "./db";

// --- Types ---

export type Plant = {
  id: number;
  slug: string; // derived from name
  name: string;
  nickname: string | null;
  commonName: string; // alias of nickname for display continuity
  species: string;
  personality: string;
  facts: string[];
  profileImageUrl: string | null;
  createdAt: string;
};

export type SensorReading = {
  recordedAt: string; // ISO
  temperatureC: number | null;
  humidityPct: number | null;
  soilMoisturePct: number | null;
  soilVoltage: number | null;
};

export type LatestReading = SensorReading & {
  /** ms since the most recent reading was recorded; useful for "X min ago" UI. */
  ageMs: number;
};

// --- Slug helpers ---

/** "Pachira Aquatica" -> "pachira-aquatica". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// --- Row mapping ---

type PlantRow = {
  id: number;
  name: string;
  nickname: string | null;
  species: string | null;
  personality: string | null;
  facts: string[] | null;
  profile_image_url: string | null;
  created_at: Date;
};

const FALLBACK_PERSONALITY =
  "Calm, low-drama, holds opinions but rarely shares them.";
const FALLBACK_FACTS = [
  "Like all plants, I run on light, water, and a little patience.",
  "Check my soil moisture before deciding whether I need a drink.",
];

function rowToPlant(row: PlantRow): Plant {
  const nickname = row.nickname?.trim() || null;
  return {
    id: row.id,
    slug: slugify(row.name),
    name: row.name,
    nickname,
    commonName: nickname ?? row.species ?? row.name,
    species: row.species ?? row.name,
    personality: row.personality?.trim() || FALLBACK_PERSONALITY,
    facts:
      row.facts && row.facts.length > 0 ? row.facts : FALLBACK_FACTS,
    profileImageUrl: row.profile_image_url,
    createdAt: row.created_at.toISOString(),
  };
}

// --- Plant queries ---

const PLANT_COLS = `id, name, nickname, species, personality, facts, profile_image_url, created_at`;

export async function listPlants(): Promise<Plant[]> {
  const rows = await query<PlantRow>(
    `SELECT ${PLANT_COLS} FROM plants ORDER BY id ASC`,
  );
  return rows.map(rowToPlant);
}

export async function getPlantBySlug(slug: string): Promise<Plant | null> {
  // We don't store slugs in the DB — derive on the way in. There is only one
  // plant for now, but this scales to a small N without trouble.
  const rows = await query<PlantRow>(
    `SELECT ${PLANT_COLS} FROM plants`,
  );
  return rows.map(rowToPlant).find((p) => p.slug === slug) ?? null;
}

export async function getPlantByName(name: string): Promise<Plant | null> {
  const rows = await query<PlantRow>(
    `SELECT ${PLANT_COLS} FROM plants WHERE name = $1`,
    [name],
  );
  return rows[0] ? rowToPlant(rows[0]) : null;
}

// --- Sensor reading queries ---

type ReadingRow = {
  recorded_at: Date;
  temperature_c: string | null;
  humidity_pct: string | null;
  soil_moisture_pct: string | null;
  soil_voltage: string | null;
};

// Postgres `numeric` comes back as a string from `pg`; coerce to number | null.
function num(v: string | null): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function rowToReading(row: ReadingRow): SensorReading {
  return {
    recordedAt: row.recorded_at.toISOString(),
    temperatureC: num(row.temperature_c),
    humidityPct: num(row.humidity_pct),
    soilMoisturePct: num(row.soil_moisture_pct),
    soilVoltage: num(row.soil_voltage),
  };
}

export async function getLatestReading(
  plantId: number,
): Promise<LatestReading | null> {
  const rows = await query<ReadingRow>(
    `SELECT recorded_at, temperature_c, humidity_pct, soil_moisture_pct, soil_voltage
       FROM sensor_readings
      WHERE plant_id = $1
      ORDER BY recorded_at DESC
      LIMIT 1`,
    [plantId],
  );
  if (!rows[0]) return null;
  const reading = rowToReading(rows[0]);
  return { ...reading, ageMs: Date.now() - new Date(reading.recordedAt).getTime() };
}

/**
 * Most-recent reading where the requested field is non-null. We need this
 * because the DHT22 sometimes fails a read, leaving temp/humidity null even
 * though soil moisture is fine. The "current" stat tile shouldn't show "—"
 * in those cases.
 */
export async function getLatestReadingWithField(
  plantId: number,
  field: "temperature_c" | "humidity_pct" | "soil_moisture_pct",
): Promise<SensorReading | null> {
  const rows = await query<ReadingRow>(
    `SELECT recorded_at, temperature_c, humidity_pct, soil_moisture_pct, soil_voltage
       FROM sensor_readings
      WHERE plant_id = $1 AND ${field} IS NOT NULL
      ORDER BY recorded_at DESC
      LIMIT 1`,
    [plantId],
  );
  return rows[0] ? rowToReading(rows[0]) : null;
}

// --- History (bucketed) ---

export type HistoryWindow = "5m" | "6h" | "7d" | "90d";

type WindowConfig = {
  /** Postgres interval string for `now() - interval $1`. */
  interval: string;
  /** date_trunc unit for bucketing — keeps the chart from drowning in points. */
  bucket: "second" | "minute" | "hour" | "day";
  /** Soft cap on points returned. */
  expectedPoints: number;
};

export const WINDOW_CONFIG: Record<HistoryWindow, WindowConfig> = {
  // ~5 min @ 30s cadence ≈ 10 raw points; bucket by second so we keep them all.
  "5m": { interval: "5 minutes", bucket: "second", expectedPoints: 10 },
  "6h": { interval: "6 hours", bucket: "minute", expectedPoints: 360 },
  "7d": { interval: "7 days", bucket: "hour", expectedPoints: 168 },
  "90d": { interval: "90 days", bucket: "day", expectedPoints: 90 },
};

export async function getReadingHistory(
  plantId: number,
  window: HistoryWindow,
): Promise<SensorReading[]> {
  const cfg = WINDOW_CONFIG[window];
  const rows = await query<ReadingRow>(
    `SELECT
        date_trunc('${cfg.bucket}', recorded_at) AS recorded_at,
        AVG(temperature_c)::numeric(5,2)     AS temperature_c,
        AVG(humidity_pct)::numeric(5,2)      AS humidity_pct,
        AVG(soil_moisture_pct)::numeric(5,2) AS soil_moisture_pct,
        AVG(soil_voltage)::numeric(6,4)      AS soil_voltage
       FROM sensor_readings
      WHERE plant_id = $1
        AND recorded_at >= now() - $2::interval
      GROUP BY 1
      ORDER BY 1 ASC`,
    [plantId, cfg.interval],
  );
  return rows.map(rowToReading);
}
