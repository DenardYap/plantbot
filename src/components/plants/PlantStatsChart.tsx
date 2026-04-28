import { Card, Eyebrow, SectionHeader } from "@/components/ui";
import type { Plant } from "@/lib/plants";

type Series = {
  key: string;
  label: string;
  unit: string;
  latest: number;
  points: number[];
  domain: [number, number];
};

/**
 * Deterministic pseudo-series so server- and client-renders match.
 * Each point jitters around `center` within ±`amplitude`.
 */
function mockSeries(seed: number, center: number, amplitude: number, n = 24) {
  const arr: number[] = [];
  let x = seed;
  for (let i = 0; i < n; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = x / 233280;
    arr.push(center + (r - 0.5) * 2 * amplitude);
  }
  return arr;
}

function pathFor(points: number[], width: number, height: number): string {
  if (points.length === 0) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const padY = 6;
  return points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - padY - ((p - min) / range) * (height - padY * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function PlantStatsChart({ plant }: { plant: Plant }) {
  const series: Series[] = [
    {
      key: "humidity",
      label: "Humidity",
      unit: "%",
      latest: plant.humidity,
      points: mockSeries(plant.humidity * 11, plant.humidity, 6),
      domain: [0, 100],
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
    },
    {
      key: "soil",
      label: "Soil moisture",
      unit: "%",
      latest: plant.soilMoisture,
      points: mockSeries(plant.soilMoisture * 23, plant.soilMoisture, 8),
      domain: [0, 100],
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
        {series.map((s) => {
          const w = 280;
          const h = 80;
          return (
            <div
              key={s.key}
              className="rounded-xl bg-surface-sunken p-4"
            >
              <div className="flex items-baseline justify-between">
                <Eyebrow>{s.label}</Eyebrow>
                <div className="text-base font-extrabold text-ink">
                  {s.latest}
                  <span className="ml-0.5 text-xs font-bold text-ink-muted">
                    {s.unit}
                  </span>
                </div>
              </div>
              <svg
                role="img"
                aria-label={`${s.label} over time`}
                viewBox={`0 0 ${w} ${h}`}
                className="mt-2 h-16 w-full"
              >
                <path
                  d={pathFor(s.points, w, h)}
                  fill="none"
                  stroke="var(--color-brand)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
