import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PlantCard } from "@/components/plants/PlantCard";
import { StatTile } from "@/components/plants/StatTile";
import {
  DropletIcon,
  LeafIcon,
  SparkleIcon,
  ThermometerIcon,
} from "@/components/icons";
import {
  getLatestReadingWithField,
  listPlants,
} from "@/lib/plants";
import { summarizeHealth } from "@/lib/health";
import { SITE } from "@/lib/site";
import { match } from "ts-pattern";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Plants",
  description:
    "Live dashboard for the plants wired up to PlantBot. Real humidity, temperature, and soil-moisture data straight from a Raspberry Pi.",
  alternates: { canonical: "/plants" },
  openGraph: {
    title: "Plants · PlantBot",
    description:
      "Pick a plant to chat with. Real sensors, live data — powered by an AI agent on a Raspberry Pi.",
    url: `${SITE.url}/plants`,
  },
};

export default async function PlantsPage() {
  const plants = await listPlants();

  // Build a "current readings + health" snapshot per plant. There's only one
  // plant for now, so this stays small; if we add more, switch to a single
  // grouped query.
  const enriched = await Promise.all(
    plants.map(async (p) => {
      const [t, h, s] = await Promise.all([
        getLatestReadingWithField(p.id, "temperature_c"),
        getLatestReadingWithField(p.id, "humidity_pct"),
        getLatestReadingWithField(p.id, "soil_moisture_pct"),
      ]);
      const current = {
        temperatureC: t?.temperatureC ?? null,
        humidityPct: h?.humidityPct ?? null,
        soilMoisturePct: s?.soilMoisturePct ?? null,
      };
      return { plant: p, current, health: summarizeHealth(current) };
    }),
  );

  // Garden-wide aggregates. With a single plant, "averages" are just that
  // plant's values — but the structure is ready for more.
  const count = enriched.length;
  const avg = (key: "humidityPct" | "temperatureC" | "soilMoisturePct") => {
    const vals = enriched
      .map((e) => e.current[key])
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const avgHumidity = avg("humidityPct");
  const avgTemp = avg("temperatureC");
  const avgHappiness =
    enriched.length === 0
      ? null
      : Math.round(
          enriched.reduce((sum, e) => sum + e.health.score, 0) /
            enriched.length,
        );

  const fmt = (v: number | null, digits = 0) =>
    v === null ? "—" : v.toFixed(digits);

  return (
    <PageContainer>
      <section aria-labelledby="global-stats" className="mb-12">
        <h2 id="global-stats" className="sr-only">
          Garden-wide stats
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label="Plants online"
            value={count}
            icon={<LeafIcon className="h-4 w-4" />}
            hint={match(count)
              .with(0, () => "None connected yet")
              .with(1, () => "One plant currently wired up")
              .otherwise(() => "All sensors reporting")}
          />
          <StatTile
            label="Avg happiness"
            value={fmt(avgHappiness)}
            unit={avgHappiness === null ? undefined : "%"}
            icon={<SparkleIcon className="h-4 w-4" />}
          />
          <StatTile
            label="Avg humidity"
            value={fmt(avgHumidity)}
            unit={avgHumidity === null ? undefined : "%"}
            icon={<DropletIcon className="h-4 w-4" />}
          />
          <StatTile
            label="Avg temp"
            value={fmt(avgTemp, 1)}
            unit={avgTemp === null ? undefined : "°C"}
            icon={<ThermometerIcon className="h-4 w-4" />}
          />
        </div>
      </section>

      <section aria-labelledby="plant-grid">
        <div className="mb-5 flex items-end justify-between">
          <h2
            id="plant-grid"
            className="text-2xl font-extrabold tracking-tight text-ink"
          >
            The Garden
          </h2>
          <p className="text-sm text-ink-muted">
            {count} online &middot; more coming soon
          </p>
        </div>

        {enriched.length === 0 ? (
          <p className="rounded-xl bg-surface-sunken p-8 text-center text-sm font-bold text-ink-muted">
            No plants connected yet. Wire one up to your Raspberry Pi and
            it&apos;ll show up here.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enriched.map(({ plant, current, health }) => (
              <li key={plant.slug}>
                <PlantCard plant={plant} current={current} health={health} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
