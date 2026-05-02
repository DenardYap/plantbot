"use client";

import { useMemo, useState } from "react";
import { match } from "ts-pattern";
import { Card, Eyebrow, LineChart, Pill, SectionHeader } from "@/components/ui";
import type { LineChartProps } from "@/components/ui";
import { useReadings } from "@/lib/api/hooks";
import type { HistoryWindow, SensorReadingDTO } from "@/lib/api/types";
import { LiveDotIcon } from "@/components/icons";

const WINDOWS: { id: HistoryWindow; label: string; subLabel: string }[] = [
  { id: "5m", label: "Seconds", subLabel: "5 min" },
  { id: "6h", label: "Minutes", subLabel: "6 h" },
  { id: "7d", label: "Hours", subLabel: "7 d" },
  { id: "90d", label: "Days", subLabel: "90 d" },
];

type SeriesDef = {
  key: "humidity" | "temperature" | "soil";
  label: string;
  unit: string;
  domain: [number, number];
  tone: NonNullable<LineChartProps["tone"]>;
  pick: (r: SensorReadingDTO) => number | null;
};

const SERIES: SeriesDef[] = [
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    domain: [0, 100],
    tone: "brand",
    pick: (r) => r.humidityPct,
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    domain: [10, 35],
    tone: "accent",
    pick: (r) => r.temperatureC,
  },
  {
    key: "soil",
    label: "Soil moisture",
    unit: "%",
    domain: [0, 100],
    tone: "success",
    pick: (r) => r.soilMoisturePct,
  },
];

function formatTimeLabel(iso: string, window: HistoryWindow): string {
  const d = new Date(iso);
  return match(window)
    .with("5m", () =>
      d.toLocaleTimeString([], { minute: "2-digit", second: "2-digit" }),
    )
    .with("6h", () =>
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    )
    .with("7d", () =>
      d.toLocaleString([], {
        weekday: "short",
        hour: "2-digit",
      }),
    )
    .with("90d", () =>
      d.toLocaleDateString([], { month: "short", day: "numeric" }),
    )
    .exhaustive();
}

/**
 * Linearly interpolate over null gaps so a single failed DHT22 read doesn't
 * carve a hole into the chart. We intentionally do this client-side: the
 * DTO still carries nulls so the API stays honest.
 */
function fillNulls(values: (number | null)[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v !== null) {
      out.push(v);
      continue;
    }
    let prev: number | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (values[j] !== null) {
        prev = values[j] as number;
        break;
      }
    }
    let next: number | null = null;
    for (let j = i + 1; j < values.length; j++) {
      if (values[j] !== null) {
        next = values[j] as number;
        break;
      }
    }
    if (prev !== null && next !== null) out.push((prev + next) / 2);
    else if (prev !== null) out.push(prev);
    else if (next !== null) out.push(next);
    else out.push(0);
  }
  return out;
}

export function PlantStatsChart({
  slug,
  plantName,
}: {
  slug: string;
  plantName: string;
}) {
  const [window, setWindow] = useState<HistoryWindow>("6h");
  const { data, isLoading, isError } = useReadings(slug, window);

  const readings = useMemo(() => data?.readings ?? [], [data]);
  const hasData = readings.length >= 2;

  const xLabels = useMemo(
    () => readings.map((r) => formatTimeLabel(r.recordedAt, window)),
    [readings, window],
  );

  return (
    <Card className="p-6">
      <SectionHeader
        eyebrow="Sensor history"
        title={`${plantName} over time`}
        align="end"
        className="mb-5"
        right={
          <Pill tone="brand">
            <LiveDotIcon className="h-2 w-2 animate-pulse text-green-500" />
            Live · refreshes every 30s
          </Pill>
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {WINDOWS.map((w) => {
          const active = w.id === window;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setWindow(w.id)}
              aria-pressed={active}
              className={[
                "rounded-full px-3.5 py-1.5 text-xs font-extrabold transition",
                active
                  ? "bg-ink text-ink-inverse"
                  : "bg-surface-sunken text-ink-muted hover:bg-grey-300 hover:text-ink",
              ].join(" ")}
            >
              {w.label}
              <span
                className={[
                  "ml-1.5 text-[10px] font-bold",
                  active ? "text-ink-inverse/70" : "text-ink-subtle",
                ].join(" ")}
              >
                {w.subLabel}
              </span>
            </button>
          );
        })}
      </div>

      {isError && (
        <p className="mb-4 text-sm font-bold text-danger">
          Couldn&apos;t load history. Retrying…
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {SERIES.map((s) => {
          const raw = readings.map(s.pick);
          const points = hasData ? fillNulls(raw) : [];
          const latestRaw = [...raw].reverse().find((v) => v !== null) ?? null;
          const latestStr =
            latestRaw === null
              ? "—"
              : s.key === "temperature"
                ? latestRaw.toFixed(1)
                : Math.round(latestRaw).toString();

          return (
            <div key={s.key} className="rounded-xl bg-surface-sunken p-4">
              <div className="flex items-baseline justify-between">
                <Eyebrow>{s.label}</Eyebrow>
                <div className="text-base font-extrabold text-ink tabular-nums">
                  {latestStr}
                  <span className="ml-0.5 text-xs font-bold text-ink-muted">
                    {s.unit}
                  </span>
                </div>
              </div>
              {points.length >= 2 ? (
                <LineChart
                  points={points}
                  domain={s.domain}
                  tone={s.tone}
                  height="md"
                  showAxes
                  interactive
                  showEndpoint
                  yFormat={(v) =>
                    s.key === "temperature"
                      ? `${v.toFixed(1)}${s.unit}`
                      : `${Math.round(v)}${s.unit}`
                  }
                  xLabels={xLabels}
                  ariaLabel={`${s.label} chart, latest ${latestStr}${s.unit}`}
                  className="mt-3"
                />
              ) : (
                <div
                  role="img"
                  aria-label={`${s.label} chart — not enough data yet`}
                  className="mt-3 grid h-24 place-items-center rounded-sm bg-grey-200 text-xs font-bold text-ink-subtle"
                >
                  {isLoading ? "Loading…" : "Not enough data yet"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
