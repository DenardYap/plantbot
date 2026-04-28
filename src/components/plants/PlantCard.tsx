import Link from "next/link";
import { Card, Eyebrow, Pill } from "@/components/ui";
import type { Plant } from "@/lib/plants";
import {
  DropletIcon,
  ThermometerIcon,
  SparkleIcon,
  LiveDotIcon,
} from "@/components/icons";

function happinessLabel(score: number): string {
  if (score >= 90) return "Thriving";
  if (score >= 75) return "Happy";
  if (score >= 50) return "Doing OK";
  if (score >= 25) return "Struggling";
  return "Needs help";
}

export function PlantCard({ plant }: { plant: Plant }) {
  return (
    <Card as="article" className="group relative overflow-hidden">
      <Link
        href={`/plants/${plant.slug}`}
        className="block focus:outline-none"
        aria-label={`Open chat with ${plant.name}`}
      >
        {/* Placeholder for live camera preview */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-grey-200">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(150_42%_40%/0.30),transparent_60%),radial-gradient(circle_at_70%_80%,hsl(150_58%_17%/0.35),transparent_55%)]"
          />
          <Pill tone="dark" uppercase className="absolute left-3 top-3">
            <LiveDotIcon className="h-2 w-2 text-green-300 animate-pulse" />
            Live
          </Pill>
        </div>

        <div className="p-5">
          <div className="flex items-baseline justify-between gap-3">
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

          <dl className="mt-4 grid grid-cols-3 gap-2">
            <Metric
              icon={<SparkleIcon className="h-3.5 w-3.5" />}
              label={happinessLabel(plant.happiness)}
              value={`${plant.happiness}`}
              unit="%"
            />
            <Metric
              icon={<DropletIcon className="h-3.5 w-3.5" />}
              label="Humidity"
              value={`${plant.humidity}`}
              unit="%"
            />
            <Metric
              icon={<ThermometerIcon className="h-3.5 w-3.5" />}
              label="Temp"
              value={`${plant.temperature}`}
              unit="°C"
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
    <div className="rounded-xl bg-surface-sunken px-3 py-2.5">
      <Eyebrow as="dt" size="xxs" className="flex items-center gap-1">
        <span className="text-brand">{icon}</span>
        {label}
      </Eyebrow>
      <dd className="mt-0.5 text-base font-extrabold text-ink">
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
