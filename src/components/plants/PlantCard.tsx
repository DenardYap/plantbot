"use client";
import Link from "next/link";
import { Card, Eyebrow, Pill } from "@/components/ui";
import {
  CameraOffIcon,
  DropletIcon,
  LeafIcon,
  PlantPotIcon,
  ThermometerIcon,
  SparkleIcon,
} from "@/components/icons";
import type {
  CurrentReadings,
  HealthSummaryDTO,
  PlantDTO,
} from "@/lib/api/types";
import { match } from "ts-pattern";
import { StreamStatusBadge } from "./StreamStatusBadge";
import { useStreamStatus } from "./useStreamStatus";

function happinessLabel(score: number): string {
  if (score >= 90) return "Thriving";
  if (score >= 75) return "Happy";
  if (score >= 50) return "Doing OK";
  if (score >= 25) return "Struggling";
  return "Needs help";
}

function pillTone(
  s: HealthSummaryDTO["overall"],
): "success" | "warning" | "danger" | "neutral" {
  return match(s)
    .with("ok", () => "success" as const)
    .with("warn", () => "warning" as const)
    .with("danger", () => "danger" as const)
    .with("unknown", () => "neutral" as const)
    .exhaustive();
}

const fmt = (v: number | null, digits = 0) =>
  v === null ? "—" : v.toFixed(digits);

export function PlantCard({
  plant,
  current,
  health,
}: {
  plant: PlantDTO;
  current: CurrentReadings;
  health: HealthSummaryDTO;
}) {
  const streamUrl = process.env.NEXT_PUBLIC_PLANT_STREAM_URL;
  // Real liveness, not just "is the URL configured". Both this and the
  // <StreamStatusBadge/> below subscribe to the same TanStack query, so
  // there's only one poll in flight per stream.
  const streamStatus = useStreamStatus(streamUrl);
  const showOfflineOverlay = streamStatus === "offline";

  return (
    <Card as="article" className="group relative overflow-hidden">
      <Link
        href={`/plants/${plant.slug}`}
        className="block focus:outline-none"
        aria-label={`Open ${plant.name}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-grey-200">
          {plant.profileImageUrl ? (
            <>
              {/* Plain <img> intentionally — the photo can live anywhere
                  (public/ for now, but could be S3/CDN later). Skipping
                  next/image avoids needing to pre-register every host. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={plant.profileImageUrl}
                alt={plant.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Scrim + "not live" copy whenever the camera isn't actually
                  streaming — whether because no stream URL is configured or
                  because the playlist has gone stale. When live, the photo
                  acts as a live thumbnail with no overlay. */}
              {showOfflineOverlay && (
                <>
                  <div aria-hidden className="absolute inset-0 bg-surface/60" />
                  <div className="absolute inset-0 grid place-items-center px-4 text-center">
                    <p className="text-base font-extrabold tracking-tight text-ink drop-shadow-[0_2px_8px_hsl(0_0%_100%/0.9)] sm:text-lg">
                      {plant.nickname ?? plant.name} is not live now
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            // Default placeholder — kept intentionally for plants without a
            // profile photo. Soft brand-tinted gradient + seedling icon.
            <>
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(150_42%_40%/0.30),transparent_60%),radial-gradient(circle_at_70%_80%,hsl(150_58%_17%/0.35),transparent_55%)]"
              />
              <div className="absolute inset-0 grid place-items-center text-brand">
                <PlantPotIcon className="h-20 w-20 opacity-50" aria-hidden />
              </div>
            </>
          )}
          {streamUrl ? (
            <StreamStatusBadge
              streamUrl={streamUrl}
              className="absolute left-3 top-3"
            />
          ) : (
            <Pill
              tone="neutral"
              size="sm"
              uppercase
              className="absolute left-3 top-3"
            >
              <CameraOffIcon className="h-3 w-3" aria-hidden />
              Camera offline
            </Pill>
          )}
          <Pill
            tone={pillTone(health.overall)}
            size="sm"
            uppercase
            className="absolute right-3 top-3"
          >
            <SparkleIcon className="h-3 w-3" aria-hidden />
            {happinessLabel(health.score)}
          </Pill>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h3 className="text-xl font-extrabold tracking-tight text-ink">
              {plant.name}
            </h3>
            <span className="text-sm font-bold text-ink-subtle">
              {plant.commonName}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
            {plant.personality}
          </p>

          <dl className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">
            <Metric
              icon={<DropletIcon className="h-3.5 w-3.5" />}
              label="Humidity"
              value={fmt(current.humidityPct)}
              unit="%"
            />
            <Metric
              icon={<ThermometerIcon className="h-3.5 w-3.5" />}
              label="Temp"
              value={fmt(current.temperatureC, 1)}
              unit="°C"
            />
            <Metric
              icon={<LeafIcon className="h-3.5 w-3.5" />}
              label="Soil"
              value={fmt(current.soilMoisturePct)}
              unit="%"
            />
          </dl>

          <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand group-hover:text-brand-hover">
            Chat with {plant.name}
            <span aria-hidden>→</span>
          </div>
        </div>
      </Link>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-sunken px-2.5 py-2.5 sm:px-3">
      <Eyebrow as="dt" size="xxs" className="flex items-center gap-1">
        <span className="text-brand">{icon}</span>
        {label}
      </Eyebrow>
      <dd className="mt-0.5 text-base font-extrabold text-ink tabular-nums">
        {value}
        {unit && (
          <span className="ml-0.5 text-xs font-bold text-ink-muted">
            {unit}
          </span>
        )}
      </dd>
    </div>
  );
}
