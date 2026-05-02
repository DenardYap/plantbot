import type { MetadataRoute } from "next";
import { listPlants } from "@/lib/plants";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, priority: 1 },
    { url: `${SITE.url}/plants`, lastModified: now, priority: 0.9 },
    { url: `${SITE.url}/about`, lastModified: now, priority: 0.5 },
    { url: `${SITE.url}/guide`, lastModified: now, priority: 0.7 },
  ];

  // The plant list is now DB-backed. If the connection fails at sitemap-build
  // time, fall back to just the static routes — better than crashing the build.
  let plantRoutes: MetadataRoute.Sitemap = [];
  try {
    const plants = await listPlants();
    plantRoutes = plants.map((p) => ({
      url: `${SITE.url}/plants/${p.slug}`,
      lastModified: now,
      priority: 0.8,
    }));
  } catch (err) {
    console.warn("[sitemap] could not load plants, falling back:", err);
  }

  return [...staticRoutes, ...plantRoutes];
}
