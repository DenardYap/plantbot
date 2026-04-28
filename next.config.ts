import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // In dev, Next.js compiles routes on demand and disposes them after a
  // short idle period — which causes a small pause the first time you click
  // into a route. Bumping these keeps more pages hot in memory so repeat
  // navigation feels instant.
  onDemandEntries: {
    // Keep a compiled page in memory for 1h before disposing it.
    maxInactiveAge: 60 * 60 * 1000,
    // Keep up to 50 pages buffered — we have ~6 total, so nothing evicts.
    pagesBufferLength: 50,
  },
};

export default nextConfig;
