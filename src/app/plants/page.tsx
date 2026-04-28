import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui";
import { PlantCard } from "@/components/plants/PlantCard";
import { StatTile } from "@/components/plants/StatTile";
import {
  DropletIcon,
  LeafIcon,
  SparkleIcon,
  ThermometerIcon,
} from "@/components/icons";
import { plants, globalStats } from "@/lib/plants";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Plants",
  description:
    "Browse every plant wired up to PlantBot and chat with them in real time. Track humidity, temperature, and happiness across the whole garden.",
  alternates: { canonical: "/plants" },
  openGraph: {
    title: "Plants · PlantBot",
    description:
      "Pick a plant to chat with. Live camera, real sensors, real watering — powered by an AI agent on a Raspberry Pi.",
    url: `${SITE.url}/plants`,
  },
};

export default function PlantsPage() {
  const stats = globalStats();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="The garden"
        title="Pick a plant to chat with."
        lead="Each plant has its own live camera, sensor feed, and personality."
        className="mb-10"
      />

      <section aria-labelledby="global-stats" className="mb-12">
        <h2 id="global-stats" className="sr-only">
          Garden-wide stats
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile
            label="Plants"
            value={stats.count}
            icon={<LeafIcon className="h-4 w-4" />}
            hint="Currently online"
          />
          <StatTile
            label="Avg happiness"
            value={stats.avgHappiness}
            unit="%"
            icon={<SparkleIcon className="h-4 w-4" />}
          />
          <StatTile
            label="Avg humidity"
            value={stats.avgHumidity}
            unit="%"
            icon={<DropletIcon className="h-4 w-4" />}
          />
          <StatTile
            label="Avg temp"
            value={stats.avgTemperature}
            unit="°C"
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
            All plants
          </h2>
          <p className="text-sm text-ink-muted">
            {plants.length} online &middot; more coming soon
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => (
            <li key={plant.slug}>
              <PlantCard plant={plant} />
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}
