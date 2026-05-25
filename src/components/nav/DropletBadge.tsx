"use client";

import { useEffect } from "react";
import { DropletIcon } from "@/components/icons";
import { Tooltip } from "@/components/ui";
import { DAILY_DROPLETS, useDropletsStore } from "@/stores/useDropletsStore";

const TOOLTIP_ID = "droplet-badge-tooltip";

/**
 * Top-right indicator showing how many "watering droplets" the user has
 * left today. The count refills once per local calendar day (see
 * `useDropletsStore`).
 *
 * Knowledge-in-the-world (Norman): the count + icon make the watering
 * budget visible at all times, so a user is never surprised when a
 * `water_plant` request fails because they're out.
 */
export function DropletBadge() {
  const count = useDropletsStore((s) => s.count);
  const hydrated = useDropletsStore((s) => s.hydrated);
  const refillIfNewDay = useDropletsStore((s) => s.refillIfNewDay);

  // The persist middleware already runs a refill on rehydrate, but we
  // also re-check when the tab regains focus — a user who left the tab
  // open across midnight should see today's allowance without reloading.
  useEffect(() => {
    if (!hydrated) return;
    refillIfNewDay();
    const onFocus = () => refillIfNewDay();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [hydrated, refillIfNewDay]);

  const empty = hydrated && count <= 0;
  const display = hydrated ? count : DAILY_DROPLETS;

  const tooltipLabel = empty
    ? "You're out of droplets. Refills tomorrow."
    : `Watering droplets — ${DAILY_DROPLETS} per day. Refills tomorrow.`;

  return (
    <Tooltip label={tooltipLabel} side="bottom" align="end" id={TOOLTIP_ID}>
      <span
        tabIndex={0}
        role="status"
        aria-label={`Watering droplets remaining today: ${display} of ${DAILY_DROPLETS}`}
        aria-describedby={TOOLTIP_ID}
        className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-2 text-sm font-bold text-ink-muted shadow-[0_1px_0_hsl(150_10%_90%),_0_8px_24px_-12px_hsl(150_20%_15%/0.15)] sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-base"
      >
        <DropletIcon
          className={[
            "h-4 w-4 sm:h-[18px] sm:w-[18px]",
            empty
              ? "fill-grey-300 text-ink-subtle"
              : "fill-water text-water",
          ].join(" ")}
          aria-hidden
        />
        <span className="tabular-nums text-ink">{display}</span>
        {/* "/ N" suffix hidden on the smallest screens — the daily allowance
            is still conveyed via the tooltip + aria-label. */}
        <span className="hidden text-ink-subtle sm:inline">
          / {DAILY_DROPLETS}
        </span>
      </span>
    </Tooltip>
  );
}
