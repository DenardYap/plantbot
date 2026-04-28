import type { MetadataRoute } from "next";
import { plants } from "@/lib/plants";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: now, priority: 1 },
    { url: `${SITE.url}/plants`, lastModified: now, priority: 0.9 },
    { url: `${SITE.url}/about`, lastModified: now, priority: 0.5 },
    { url: `${SITE.url}/guide`, lastModified: now, priority: 0.7 },
  ];

  const plantRoutes: MetadataRoute.Sitemap = plants.map((p) => ({
    url: `${SITE.url}/plants/${p.slug}`,
    lastModified: now,
    priority: 0.8,
  }));

  return [...staticRoutes, ...plantRoutes];
}
