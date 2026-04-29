"use client";

import { Card, Eyebrow, LineChart, SectionHeader } from "@/components/ui";
import type { LineChartProps } from "@/components/ui";
import type { Plant } from "@/lib/plants";

type Series = {
  key: string;
  label: string;
  unit: string;
  latest: number;
  points: number[];
  domain: [number, number];
  tone: NonNullable<LineChartProps["tone"]>;
};

const HOURS = 24;

/**
 * Deterministic pseudo-series so server- and client-renders match.
 * Each point jitters around `center` within ±`amplitude`.
 */
function mockSeries(seed: number, center: number, amplitude: number, n = HOURS) {
  const arr: number[] = [];
  let x = seed;
  for (let i = 0; i < n; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = x / 233280;
    arr.push(center + (r - 0.5) * 2 * amplitude);
  }
  return arr;
}

/** One label per point — oldest → newest. Drives both the x-axis and the hover tooltip. */
const TIME_LABELS = Array.from({ length: HOURS }, (_, i) => {
  const hoursAgo = HOURS - 1 - i;
  if (hoursAgo === 0) return "now";
  if (hoursAgo === 1) return "1h ago";
  return `${hoursAgo}h ago`;
});

export function PlantStatsChart({ plant }: { plant: Plant }) {
  const series: Series[] = [
    {
      key: "humidity",
      label: "Humidity",
      unit: "%",
      latest: plant.humidity,
      points: mockSeries(plant.humidity * 11, plant.humidity, 6),
      domain: [0, 100],
      tone: "brand",
    },
    {
      key: "temperature",
      label: "Temperature",
      unit: "°C",
      latest: plant.temperature,
      points: mockSeries(
        Math.round(plant.temperature * 17),
        plant.temperature,
        1.5,
      ),
      domain: [15, 30],
      tone: "accent",
    },
    {
      key: "soil",
      label: "Soil moisture",
      unit: "%",
      latest: plant.soilMoisture,
      points: mockSeries(plant.soilMoisture * 23, plant.soilMoisture, 8),
      domain: [0, 100],
      tone: "success",
    },
  ];

  return (
    <Card className="p-6">
      <SectionHeader
        eyebrow="Sensor history"
        title={`${plant.name} over the last 24 hours`}
        align="end"
        className="mb-6"
        right={
          <div className="text-xs font-bold text-ink-muted">
            Updated just now
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {series.map((s) => (
          <div key={s.key} className="rounded-xl bg-surface-sunken p-4">
            <div className="flex items-baseline justify-between">
              <Eyebrow>{s.label}</Eyebrow>
              <div className="text-base font-extrabold text-ink">
                {s.latest}
                <span className="ml-0.5 text-xs font-bold text-ink-muted">
                  {s.unit}
                </span>
              </div>
            </div>
            <LineChart
              points={s.points}
              domain={s.domain}
              tone={s.tone}
              height="md"
              showAxes
              interactive
              showEndpoint
              yFormat={(v) => `${Math.round(v)}${s.unit}`}
              xLabels={TIME_LABELS}
              ariaLabel={`${s.label} over the last 24 hours, latest ${s.latest}${s.unit}`}
              className="mt-3"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
