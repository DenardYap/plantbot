import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Eyebrow } from "@/components/ui";
import { VideoStream } from "@/components/plants/VideoStream";
import { GlobalChat } from "@/components/plants/GlobalChat";
import { AgentActivity } from "@/components/plants/AgentActivity";
import { PlantFacts } from "@/components/plants/PlantFacts";
import { PlantStatsChart } from "@/components/plants/PlantStatsChart";
import { StatTile } from "@/components/plants/StatTile";
import {
  DropletIcon,
  SparkleIcon,
  ThermometerIcon,
  LeafIcon,
} from "@/components/icons";
import { getPlant, plants } from "@/lib/plants";
import { SITE } from "@/lib/site";

export async function generateStaticParams() {
  return plants.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plant = getPlant(slug);
  if (!plant) return { title: "Plant not found" };

  const title = `${plant.name} — ${plant.commonName}`;
  const description = `Chat live with ${plant.name} (${plant.species}). Watch the camera, read the sensors, and watch the agent care for this plant in real time.`;

  return {
    title,
    description,
    alternates: { canonical: `/plants/${plant.slug}` },
    openGraph: {
      title: `${plant.name} · PlantBot`,
      description,
      url: `${SITE.url}/plants/${plant.slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${plant.name} · PlantBot`,
      description,
    },
  };
}

export default async function PlantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plant = getPlant(slug);
  if (!plant) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Plants",
        item: `${SITE.url}/plants`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: plant.name,
        item: `${SITE.url}/plants/${plant.slug}`,
      },
    ],
  };

  return (
    <PageContainer>
      <Breadcrumbs
        items={[
          { label: "Plants", href: "/plants" },
          { label: plant.name },
        ]}
      />

      <header className="mb-8 mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow tone="brand" size="sm">
            {plant.commonName}
          </Eyebrow>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            {plant.name}
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-muted">
            {plant.personality}
          </p>
        </div>
      </header>

      {/* Row 1: live video + global chat */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <VideoStream plantName={plant.name} />
        </div>
        <div className="lg:col-span-5">
          <GlobalChat plantName={plant.name} />
        </div>
      </section>

      {/* Row 2: the plant + stat tiles */}
      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AgentActivity plant={plant} />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-5">
          <StatTile
            label="Happiness"
            value={plant.happiness}
            unit="%"
            icon={<SparkleIcon className="h-4 w-4" />}
          />
          <StatTile
            label="Humidity"
            value={plant.humidity}
            unit="%"
            icon={<DropletIcon className="h-4 w-4" />}
          />
          <StatTile
            label="Temperature"
            value={plant.temperature}
            unit="°C"
            icon={<ThermometerIcon className="h-4 w-4" />}
          />
          <StatTile
            label="Soil moisture"
            value={plant.soilMoisture}
            unit="%"
            icon={<LeafIcon className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* Row 3: facts */}
      <section className="mt-6">
        <PlantFacts plant={plant} />
      </section>

      {/* Row 4: stats over time */}
      <section className="mt-6">
        <PlantStatsChart plant={plant} />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </PageContainer>
  );
}
