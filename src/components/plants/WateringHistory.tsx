"use client";

import { match } from "ts-pattern";
import { DropletIcon } from "@/components/icons";
import { Card, IconBadge, Pill, SectionHeader } from "@/components/ui";
import { useWaterings } from "@/lib/api/hooks";
import { relativeTimeFromISO } from "@/lib/time";
import type { WateringCommandDTO, WateringStatus } from "@/lib/api/types";

const HISTORY_LIMIT = 12;

function statusBadgeTone(
  status: WateringStatus,
): "success" | "warning" | "danger" {
  return match(status)
    .with("done", () => "success" as const)
    .with("pending", () => "warning" as const)
    .with("skipped", () => "warning" as const)
    .with("failed", () => "danger" as const)
    .exhaustive();
}

function statusLabel(status: WateringStatus): string | null {
  // We hide the badge for the most common state ("done") so the eye is
  // drawn to the rows that *aren't* in steady state — Refactoring UI's
  // "emphasize by de-emphasizing" rule.
  return match(status)
    .with("done", () => null)
    .with("pending", () => "watering…")
    .with("skipped", () => "skipped")
    .with("failed", () => "failed")
    .exhaustive();
}

/**
 * Map the `source` column to a human label when no `requestedBy` name was
 * recorded — e.g. for `manual-test` rows the gardener fired off the bench.
 */
function fallbackLabel(source: string): string {
  return match(source)
    .with("manual-test", () => "Manual test")
    .with("agent", () => "Plant agent")
    .otherwise((s) => s);
}

function displayName(c: WateringCommandDTO): string {
  if (c.requestedBy && c.requestedBy.length > 0) return c.requestedBy;
  return fallbackLabel(c.source);
}

/**
 * Pick the most informative timestamp for the row: when the pump actually
 * ran (executedAt) for completed waterings, otherwise when the command was
 * queued (createdAt).
 */
function rowTimestamp(c: WateringCommandDTO): string {
  return c.executedAt ?? c.createdAt;
}

export function WateringHistory({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useWaterings(slug);
  const waterings = data?.waterings ?? [];
  const visible = waterings.slice(0, HISTORY_LIMIT);
  const pendingCount = waterings.filter((w) => w.status === "pending").length;

  return (
    <Card className="flex h-full flex-col p-4 sm:p-6">
      <SectionHeader
        eyebrow="Watering log"
        title="Recent waterings"
        align="center"
        className="mb-5"
        right={
          pendingCount > 0 ? (
            <Pill tone="warning">
              {pendingCount} in progress
            </Pill>
          ) : null
        }
      />

      {/* Scrollable body — capped to the card height so the log never grows
          taller than the stat tiles sitting beside it on wide screens. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isError && visible.length === 0 && (
          <p className="text-sm text-danger">
            Couldn&apos;t load the watering log. We&apos;ll keep trying.
          </p>
        )}

        {!isError && isLoading && visible.length === 0 && (
          <p className="text-sm text-ink-subtle">Loading watering log…</p>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <p className="text-sm text-ink-muted">
            No one has watered me yet. Ask the plant for a drink in chat to be
            the first.
          </p>
        )}

        {visible.length > 0 && (
          <ol className="space-y-3">
            {visible.map((w) => (
              <li key={w.id} className="flex items-start gap-3">
                <IconBadge tone={statusBadgeTone(w.status)}>
                  <DropletIcon className="h-4 w-4" aria-hidden />
                </IconBadge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-extrabold text-ink">
                      {displayName(w)}
                    </p>
                    {statusLabel(w.status) && (
                      <Pill tone={statusBadgeTone(w.status)} size="sm">
                        {statusLabel(w.status)}
                      </Pill>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {relativeTimeFromISO(rowTimestamp(w))}
                    {(w.status === "failed" || w.status === "skipped") && w.error
                      ? ` · ${w.error}`
                      : null}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
