"use client";

import { match } from "ts-pattern";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  DropletIcon,
  LeafIcon,
  SparkleIcon,
  ThermometerIcon,
} from "@/components/icons";
import { StatTile } from "@/components/plants/StatTile";
import { usePlantDetail } from "@/lib/api/hooks";
import type { Status } from "@/lib/health";

function statusTone(s: Status): "success" | "warning" | "danger" | "neutral" {
  return match(s)
    .with("ok", () => "success" as const)
    .with("warn", () => "warning" as const)
    .with("danger", () => "danger" as const)
    .with("unknown", () => "neutral" as const)
    .exhaustive();
}

function StatusIcon({ s }: { s: Status }) {
  return match(s)
    .with("ok", () => <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden />)
    .with("warn", () => <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden />)
    .with("danger", () => <AlertTriangleIcon className="h-3.5 w-3.5" aria-hidden />)
    .with("unknown", () => null)
    .exhaustive();
}

const fmt = (v: number | null, digits = 0) =>
  v === null ? "—" : v.toFixed(digits);

export function StatTilesLive({
  slug,
  initialData,
}: {
  slug: string;
  initialData?: Parameters<typeof usePlantDetail>[0] extends never ? never : never;
}) {
  // initialData is intentionally ignored for now — RSC fetch + client refetch
  // is enough; we can pass a hydrated payload later if first paint feels slow.
  void initialData;
  const { data, isLoading, isError } = usePlantDetail(slug);

  const happiness = data?.health.score ?? null;
  const happinessStatus = data?.health.overall ?? "unknown";
  const tempStatus = data?.health.temperature.status ?? "unknown";
  const humStatus = data?.health.humidity.status ?? "unknown";
  const soilStatus = data?.health.soil.status ?? "unknown";
  const c = data?.current;

  const skeleton = isLoading && !data;

  return (
    <div className="grid grid-cols-2 gap-4">
      <StatTile
        label="Happiness"
        value={skeleton ? "—" : fmt(happiness)}
        unit={happiness === null ? undefined : "%"}
        icon={<SparkleIcon className="h-4 w-4" />}
        tone={statusTone(happinessStatus)}
        hint={data?.health.headline}
      />
      <StatTile
        label="Humidity"
        value={skeleton ? "—" : fmt(c?.humidityPct ?? null)}
        unit={c?.humidityPct === undefined || c?.humidityPct === null ? undefined : "%"}
        icon={<DropletIcon className="h-4 w-4" />}
        tone={statusTone(humStatus)}
        statusIcon={<StatusIcon s={humStatus} />}
      />
      <StatTile
        label="Temperature"
        value={skeleton ? "—" : fmt(c?.temperatureC ?? null, 1)}
        unit={c?.temperatureC === undefined || c?.temperatureC === null ? undefined : "°C"}
        icon={<ThermometerIcon className="h-4 w-4" />}
        tone={statusTone(tempStatus)}
        statusIcon={<StatusIcon s={tempStatus} />}
      />
      <StatTile
        label="Soil moisture"
        value={skeleton ? "—" : fmt(c?.soilMoisturePct ?? null)}
        unit={c?.soilMoisturePct === undefined || c?.soilMoisturePct === null ? undefined : "%"}
        icon={<LeafIcon className="h-4 w-4" />}
        tone={statusTone(soilStatus)}
        statusIcon={<StatusIcon s={soilStatus} />}
      />
      {isError && (
        <p className="col-span-2 text-xs font-bold text-danger">
          Couldn&apos;t reach the sensor API. Retrying…
        </p>
      )}
    </div>
  );
}
