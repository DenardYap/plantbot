import type { HTMLAttributes, ReactNode } from "react";

type Tone = "brand" | "neutral" | "ink" | "inverse";
type Size = "sm" | "md" | "lg" | "xl";

const toneCls: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  neutral: "bg-grey-100 text-ink",
  ink: "bg-ink text-ink-inverse",
  inverse: "bg-ink-inverse/90 text-ink shadow-lg",
};

const sizeCls: Record<Size, string> = {
  sm: "h-6 w-6",
  md: "h-9 w-9",
  lg: "h-10 w-10",
  xl: "h-16 w-16",
};

/**
 * Circular icon container used as a visual anchor beside a label or title.
 * Tones map to the four roles we actually use: brand emphasis, neutral
 * surface, strong ink (for numbered steps), and inverse (for dark overlays).
 */
export function IconBadge({
  children,
  tone = "brand",
  size = "md",
  className = "",
  ...rest
}: {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "className" | "children">) {
  return (
    <span
      {...rest}
      className={[
        "grid shrink-0 place-items-center rounded-full",
        sizeCls[size],
        toneCls[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
