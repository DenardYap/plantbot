// Tiny shared time helpers — pure, framework-agnostic, safe to import from
// either the server or client. Keeps formatting consistent across the app
// (sensor age, watering history, etc.) so users see the same vocabulary
// for "how long ago" everywhere.

/**
 * Human-friendly relative duration like "5s ago", "12m ago", "3h ago",
 * "2d ago". Always rounds to the nearest unit and never returns "0".
 */
export function relativeTime(ms: number): string {
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  return `${Math.round(ms / 86_400_000)}d ago`;
}

/**
 * Convenience wrapper: relative time from an ISO timestamp to "now".
 * Returns "—" for invalid inputs so call sites can drop it straight into
 * the UI without extra null-checks.
 */
export function relativeTimeFromISO(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  return relativeTime(Math.max(0, Date.now() - t));
}
