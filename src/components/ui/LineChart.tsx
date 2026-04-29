"use client";

import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Tone = "brand" | "accent" | "success" | "warning" | "danger" | "ink";
type Height = "xs" | "sm" | "md" | "lg";

const toneVar: Record<Tone, string> = {
  brand: "var(--color-brand)",
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  ink: "var(--color-ink)",
};

const heightCls: Record<Height, string> = {
  xs: "h-12", // 48px — micro sparkline
  sm: "h-16", // 64px — compact dashboard cell
  md: "h-24", // 96px — standard section chart
  lg: "h-36", // 144px — focal chart
};

/** Internal SVG viewBox; stretched to container via preserveAspectRatio="none". */
const VIEW_W = 300;
const VIEW_H = 100;
const PAD_Y = 10;

export type LineChartProps = {
  /** Y-values in chronological order (oldest → newest). */
  points: number[];
  /** Semantic color family for the line + area. */
  tone?: Tone;
  /** Fixed container height from the size scale. */
  height?: Height;
  /**
   * Fixed y-axis range `[min, max]`. Provide when an absolute scale matters
   * (0–100% humidity vs. 15–30°C shouldn't auto-normalize). Omit to fit-to-data.
   */
  domain?: [number, number];
  /** Soft tinted fill under the line. */
  showArea?: boolean;
  /** Dot on the most recent point (stays circular at any width). */
  showEndpoint?: boolean;
  /** Line thickness in px (non-scaling). */
  strokeWidth?: number;
  /** Y-axis gridlines + labels, and X-axis tick labels when `xLabels` is provided. */
  showAxes?: boolean;
  /** Evenly-spaced y ticks from min → max. Default 3 (min, mid, max). */
  yTickCount?: number;
  /** Formats y values for axis + tooltip. Default `Math.round`. */
  yFormat?: (v: number) => string;
  /**
   * One label per point (length should match `points`). Used both for the
   * x-axis tick labels (start / middle / end are shown) and for the hover
   * tooltip's contextual prefix.
   */
  xLabels?: string[];
  /** Enable hover crosshair + tooltip. */
  interactive?: boolean;
  /** Required screen-reader description of the chart. */
  ariaLabel: string;
  className?: string;
};

/**
 * Lightweight line chart / sparkline rendered as pure SVG.
 *
 * The chart stretches to fill its parent's width so the same primitive works
 * in a narrow stat tile and a wide dashboard card. Axes (y gridlines + end-to-end
 * x tick labels) and a hover tooltip with crosshair are opt-in.
 */
export function LineChart({
  points,
  tone = "brand",
  height = "sm",
  domain,
  showArea = true,
  showEndpoint = false,
  strokeWidth = 2,
  showAxes = false,
  yTickCount = 3,
  yFormat = (v) => `${Math.round(v)}`,
  xLabels,
  interactive = false,
  ariaLabel,
  className = "",
}: LineChartProps) {
  const color = toneVar[tone];
  const chartRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div
        role="img"
        aria-label={ariaLabel}
        className={[
          heightCls[height],
          "w-full rounded-sm bg-surface-sunken",
          className,
        ].join(" ")}
      />
    );
  }

  const [lo, hi] = domain ?? [Math.min(...points), Math.max(...points)];
  const range = hi - lo || 1;
  const stepX = VIEW_W / (points.length - 1);
  const xAt = (i: number) => i * stepX;
  const yAt = (p: number) =>
    VIEW_H - PAD_Y - ((p - lo) / range) * (VIEW_H - PAD_Y * 2);

  let linePath = "";
  for (let i = 0; i < points.length; i++) {
    linePath += `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(points[i]).toFixed(1)} `;
  }
  const areaPath = showArea
    ? `${linePath}L${VIEW_W.toFixed(1)},${VIEW_H} L0,${VIEW_H} Z`
    : null;

  const yTicks = showAxes
    ? Array.from(
        { length: yTickCount },
        (_, i) => lo + (i / (yTickCount - 1)) * range,
      )
    : [];

  // CSS % positions matching the SVG's chart area (so y-labels align with gridlines).
  const topPct = (PAD_Y / VIEW_H) * 100;
  const botPct = ((VIEW_H - PAD_Y) / VIEW_H) * 100;
  const rangePct = botPct - topPct;

  const pctX = (i: number) => (xAt(i) / VIEW_W) * 100;
  const pctY = (p: number) => (yAt(p) / VIEW_H) * 100;

  const handlePointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    setHoverIdx(Math.round(ratio * (points.length - 1)));
  };

  const lastIdx = points.length - 1;
  const showHover = interactive && hoverIdx !== null;
  const hoverLabel = showHover ? xLabels?.[hoverIdx!] : undefined;

  // Axis x labels: start, optional middle (only if ≥3 labels), end.
  const axisXLabels =
    showAxes && xLabels && xLabels.length >= 2
      ? xLabels.length > 2
        ? [
            xLabels[0],
            xLabels[Math.floor((xLabels.length - 1) / 2)],
            xLabels[xLabels.length - 1],
          ]
        : [xLabels[0], xLabels[xLabels.length - 1]]
      : null;

  return (
    <div className={className}>
      <div className="flex items-stretch">
        {showAxes && (
          <div
            aria-hidden
            className={`relative ${heightCls[height]} w-10 shrink-0 pr-2 text-xs font-bold text-ink-subtle`}
          >
            {yTicks.map((v, i) => (
              <span
                key={`y-${i}`}
                className="absolute right-2 -translate-y-1/2 tabular-nums"
                style={{ top: `${botPct - (i / (yTickCount - 1)) * rangePct}%` }}
              >
                {yFormat(v)}
              </span>
            ))}
          </div>
        )}

        <div
          ref={chartRef}
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHoverIdx(null)}
          className={[
            "relative flex-1",
            heightCls[height],
            interactive ? "cursor-crosshair touch-none" : "",
          ].join(" ")}
        >
          <svg
            role="img"
            aria-label={ariaLabel}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {showAxes &&
              yTicks.map((v, i) => (
                <line
                  key={`g-${i}`}
                  x1={0}
                  x2={VIEW_W}
                  y1={yAt(v)}
                  y2={yAt(v)}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  strokeDasharray="2 4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            {areaPath && (
              <path d={areaPath} fill={color} fillOpacity={0.14} stroke="none" />
            )}
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* endpoint dot hides during hover so the two markers don't overlap */}
          {showEndpoint && !showHover && (
            <span
              aria-hidden
              className="pointer-events-none absolute block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface"
              style={{
                left: `${pctX(lastIdx)}%`,
                top: `${pctY(points[lastIdx])}%`,
                backgroundColor: color,
              }}
            />
          )}

          {showHover && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 block w-px bg-border-strong"
                style={{ left: `${pctX(hoverIdx!)}%` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface"
                style={{
                  left: `${pctX(hoverIdx!)}%`,
                  top: `${pctY(points[hoverIdx!])}%`,
                  backgroundColor: color,
                }}
              />
              <div
                role="status"
                aria-live="polite"
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-bold text-ink-inverse shadow-[0_8px_24px_-12px_hsl(150_20%_15%/0.25)]"
                style={{
                  left: `clamp(0%, ${pctX(hoverIdx!)}%, 100%)`,
                  top: `${pctY(points[hoverIdx!])}%`,
                  marginTop: "-10px",
                }}
              >
                {hoverLabel && (
                  <span className="mr-1 text-ink-inverse/70">{hoverLabel}</span>
                )}
                <span className="tabular-nums">
                  {yFormat(points[hoverIdx!])}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {axisXLabels && (
        <div className="mt-1.5 flex justify-between pl-10 text-xs font-bold text-ink-subtle">
          {axisXLabels.map((l, i) => (
            <span key={`x-${i}`}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
