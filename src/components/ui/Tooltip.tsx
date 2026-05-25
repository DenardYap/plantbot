import type { ReactNode } from "react";
import { match } from "ts-pattern";

type Side = "top" | "bottom";

/**
 * Lightweight, CSS-only tooltip. Wraps a single trigger and shows a
 * styled label on hover or keyboard focus — no JS state, no portal.
 *
 * Why not a portal? For nav-level badges the trigger is always inside
 * the viewport and never overflows a clipped container, so absolute
 * positioning is enough. If we later need tooltips inside scrollable
 * cards or near overflow:hidden boundaries, swap the implementation
 * for a portal-based one without changing the call sites.
 *
 * Accessibility:
 *  - The label is rendered as text inside `role="tooltip"`, linked to
 *    the trigger via aria-describedby.
 *  - It appears on `focus-within` too, so keyboard users get the same
 *    affordance as mouse users (Norman: discoverability via signifiers).
 */
export function Tooltip({
  label,
  side = "bottom",
  align = "center",
  id,
  children,
  className = "",
}: {
  label: ReactNode;
  side?: Side;
  /** Horizontal alignment of the tooltip relative to its trigger. */
  align?: "start" | "center" | "end";
  /** id for aria-describedby. The trigger must opt in to using this. */
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  const sideCls = match(side)
    .with("bottom", () => "top-full mt-2")
    .with("top", () => "bottom-full mb-2")
    .exhaustive();

  const alignCls = match(align)
    .with("start", () => "left-0")
    .with("center", () => "left-1/2 -translate-x-1/2")
    .with("end", () => "right-0")
    .exhaustive();

  const arrowCls = match(side)
    .with(
      "bottom",
      () => "-top-1 border-b-ink border-r-ink border-l-transparent border-t-transparent",
    )
    .with(
      "top",
      () => "-bottom-1 border-t-ink border-l-ink border-r-transparent border-b-transparent",
    )
    .exhaustive();

  const arrowAlignCls = match(align)
    .with("start", () => "left-4")
    .with("center", () => "left-1/2 -translate-x-1/2")
    .with("end", () => "right-4")
    .exhaustive();

  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        id={id}
        className={[
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-sm bg-ink px-2.5 py-1.5 text-xs font-bold text-ink-inverse shadow-[0_8px_24px_-12px_hsl(150_20%_15%/0.35)]",
          "opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100 group-focus-within:opacity-100",
          sideCls,
          alignCls,
        ].join(" ")}
      >
        {label}
        <span
          aria-hidden
          className={[
            "absolute h-2 w-2 rotate-45 border",
            arrowCls,
            arrowAlignCls,
          ].join(" ")}
        />
      </span>
    </span>
  );
}
