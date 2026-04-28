"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ROUTES_TO_PREWARM = ["/plants", "/about", "/guide"] as const;

/**
 * Dev-mode nav feels sluggish because Next.js compiles routes on first
 * visit. This component fires `router.prefetch()` for the main nav targets
 * shortly after the page is interactive, so by the time the user clicks
 * they're already compiled.
 *
 * In production this is a no-op (prefetch happens on viewport/hover already).
 */
export function RoutePrewarmer() {
  const router = useRouter();

  useEffect(() => {
    // Defer past the first paint so we don't compete with the current route.
    const id = window.setTimeout(() => {
      for (const route of ROUTES_TO_PREWARM) {
        router.prefetch(route);
      }
    }, 400);

    return () => window.clearTimeout(id);
  }, [router]);

  return null;
}
