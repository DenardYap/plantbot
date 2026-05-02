// Pure helpers, safe to import from both server and client.
// Centralized so the chat agent, the stat tiles, and the page header
// all describe the plant's health the same way.

import { match, P } from "ts-pattern";

export type Status = "ok" | "warn" | "danger" | "unknown";

export type MetricCheck = {
  status: Status;
  message: string;
};

// --- Per-metric thresholds ---
// Tuned for Pachira aquatica (Money Tree) growing indoors.

export function checkTemperature(c: number | null): MetricCheck {
  return match(c)
    .with(null, () => ({ status: "unknown" as const, message: "Temperature sensor offline." }))
    .with(P.number.lt(10), (v) => ({
      status: "danger" as const,
      message: `Way too cold (${v.toFixed(1)}°C). Move me somewhere warmer ASAP.`,
    }))
    .with(P.number.lt(15), (v) => ({
      status: "warn" as const,
      message: `Chilly (${v.toFixed(1)}°C). I prefer 18–27°C.`,
    }))
    .with(P.number.gt(32), (v) => ({
      status: "danger" as const,
      message: `Overheating (${v.toFixed(1)}°C). Get me out of direct sun.`,
    }))
    .with(P.number.gt(28), (v) => ({
      status: "warn" as const,
      message: `On the warm side (${v.toFixed(1)}°C). Could use better airflow.`,
    }))
    .otherwise((v) => ({
      status: "ok" as const,
      message: `Temperature is comfortable (${v.toFixed(1)}°C).`,
    }));
}

export function checkHumidity(pct: number | null): MetricCheck {
  return match(pct)
    .with(null, () => ({ status: "unknown" as const, message: "Humidity sensor offline." }))
    .with(P.number.lt(25), (v) => ({
      status: "danger" as const,
      message: `Air is bone dry (${v.toFixed(0)}%). My leaves are going to crisp.`,
    }))
    .with(P.number.lt(40), (v) => ({
      status: "warn" as const,
      message: `Humidity is low (${v.toFixed(0)}%). 50–70% would be nicer.`,
    }))
    .with(P.number.gt(85), (v) => ({
      status: "warn" as const,
      message: `Quite humid (${v.toFixed(0)}%). Watch for fungal growth.`,
    }))
    .otherwise((v) => ({
      status: "ok" as const,
      message: `Humidity is good (${v.toFixed(0)}%).`,
    }));
}

export function checkSoilMoisture(pct: number | null): MetricCheck {
  return match(pct)
    .with(null, () => ({ status: "unknown" as const, message: "Soil sensor offline." }))
    .with(P.number.lt(20), (v) => ({
      status: "danger" as const,
      message: `Soil is parched (${v.toFixed(0)}%). Please water me soon.`,
    }))
    .with(P.number.lt(35), (v) => ({
      status: "warn" as const,
      message: `Soil is getting dry (${v.toFixed(0)}%). Time to water in a day or two.`,
    }))
    .with(P.number.gt(80), (v) => ({
      status: "warn" as const,
      message: `Soil is very wet (${v.toFixed(0)}%). Hold off on watering.`,
    }))
    .otherwise((v) => ({
      status: "ok" as const,
      message: `Soil moisture is good (${v.toFixed(0)}%).`,
    }));
}

const STATUS_RANK: Record<Status, number> = {
  unknown: 0,
  ok: 1,
  warn: 2,
  danger: 3,
};

export function worstStatus(...statuses: Status[]): Status {
  return statuses.reduce((acc, s) =>
    STATUS_RANK[s] > STATUS_RANK[acc] ? s : acc,
  "unknown" as Status);
}

export type HealthSummary = {
  overall: Status;
  /** 0–100 score for UI components that need a single number. */
  score: number;
  temperature: MetricCheck;
  humidity: MetricCheck;
  soil: MetricCheck;
  headline: string;
};

export function summarizeHealth(input: {
  temperatureC: number | null;
  humidityPct: number | null;
  soilMoisturePct: number | null;
}): HealthSummary {
  const temperature = checkTemperature(input.temperatureC);
  const humidity = checkHumidity(input.humidityPct);
  const soil = checkSoilMoisture(input.soilMoisturePct);
  const overall = worstStatus(temperature.status, humidity.status, soil.status);

  // Cheap scalar score — averages each metric's "ok-ness". Useful for the
  // happiness pill without inventing a fake metric.
  const toScore = (s: Status) =>
    match(s)
      .with("ok", () => 100)
      .with("warn", () => 65)
      .with("danger", () => 25)
      .with("unknown", () => 50)
      .exhaustive();
  const score = Math.round(
    (toScore(temperature.status) +
      toScore(humidity.status) +
      toScore(soil.status)) /
      3,
  );

  const headline = match(overall)
    .with("ok", () => "Thriving — every sensor is in the happy zone.")
    .with("warn", () => "Doing OK — one or two things could be better.")
    .with("danger", () => "Needs attention — at least one sensor is in trouble.")
    .with("unknown", () => "Sensors are quiet — can't tell how I'm feeling.")
    .exhaustive();

  return { overall, score, temperature, humidity, soil, headline };
}
