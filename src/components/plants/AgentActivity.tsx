"use client";

import { match } from "ts-pattern";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  DropletIcon,
  LeafIcon,
  ThermometerIcon,
} from "@/components/icons";
import { Card, IconBadge, Pill, SectionHeader } from "@/components/ui";
import { usePlantDetail } from "@/lib/api/hooks";
import type { Status } from "@/lib/health";

function relativeTime(ms: number): string {
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

function toneFor(s: Status): "success" | "warning" | "danger" | "neutral" {
  return match(s)
    .with("ok", () => "success" as const)
    .with("warn", () => "warning" as const)
    .with("danger", () => "danger" as const)
    .with("unknown", () => "neutral" as const)
    .exhaustive();
}

function pillTone(
  s: Status,
): "success" | "warning" | "danger" | "neutral" | "brand" {
  return match(s)
    .with("ok", () => "success" as const)
    .with("warn", () => "warning" as const)
    .with("danger", () => "danger" as const)
    .with("unknown", () => "neutral" as const)
    .exhaustive();
}

export function AgentActivity({ slug }: { slug: string }) {
  const { data, isLoading } = usePlantDetail(slug);

  const live = data?.latest;
  const health = data?.health;
  const ageMs = live?.ageMs ?? null;

  const items = [
    {
      id: "humidity",
      label: "Humidity",
      icon: <DropletIcon className="h-4 w-4" />,
      value: live?.humidityPct,
      unit: "%",
      check: health?.humidity,
    },
    {
      id: "temperature",
      label: "Temperature",
      icon: <ThermometerIcon className="h-4 w-4" />,
      value: live?.temperatureC,
      unit: "°C",
      check: health?.temperature,
    },
    {
      id: "soil",
      label: "Soil moisture",
      icon: <LeafIcon className="h-4 w-4" />,
      value: live?.soilMoisturePct,
      unit: "%",
      check: health?.soil,
    },
  ];

  return (
    <Card className="p-6">
      <SectionHeader
        eyebrow="Agent activity"
        title="What PlantBot just measured"
        align="center"
        className="mb-5"
        right={
          health ? (
            <Pill tone={pillTone(health.overall)}>
              {match(health.overall)
                .with("ok", () => (
                  <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden />
                ))
                .with("warn", () => (
                  <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden />
                ))
                .with("danger", () => (
                  <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden />
                ))
                .with("unknown", () => null)
                .exhaustive()}
              {match(health.overall)
                .with("ok", () => "Thriving")
                .with("warn", () => "Needs attention")
                .with("danger", () => "Help me")
                .with("unknown", () => "Sensors quiet")
                .exhaustive()}
            </Pill>
          ) : null
        }
      />

      {health && (
        <p className="mb-4 text-sm text-ink-muted">{health.headline}</p>
      )}

      <ol className="space-y-4">
        {items.map((item) => {
          const status = item.check?.status ?? "unknown";
          const valueStr =
            item.value === null || item.value === undefined
              ? "—"
              : item.id === "temperature"
                ? item.value.toFixed(1)
                : Math.round(item.value).toString();

          return (
            <li key={item.id} className="flex items-start gap-3">
              <IconBadge tone={toneFor(status)}>{item.icon}</IconBadge>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-extrabold text-ink">
                    {item.label}
                    <span className="ml-2 tabular-nums text-ink-muted">
                      {valueStr}
                      <span className="ml-0.5 text-xs">{item.unit}</span>
                    </span>
                  </p>
                  <span className="shrink-0 text-xs text-ink-subtle">
                    {ageMs !== null ? relativeTime(ageMs) : "—"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {item.check?.message ??
                    (isLoading ? "Reading sensor…" : "No data yet.")}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
