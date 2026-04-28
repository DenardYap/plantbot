import type { ReactNode } from "react";

type Tone = "brand" | "dark";
type Size = "sm" | "md";

const toneCls: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  // Dark-overlay pill used on top of media (camera feeds, card hero art)
  dark: "bg-ink/80 text-ink-inverse backdrop-blur",
};

const sizeCls: Record<Size, string> = {
  sm: "px-2.5 py-1",
  md: "px-3 py-1.5",
};

/**
 * Compact chip for status, tags, and live-on-media badges.
 * Uppercase is opt-in — not every pill is a status code.
 */
export function Pill({
  children,
  tone = "brand",
  size = "sm",
  uppercase = false,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
  uppercase?: boolean;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full text-xs font-extrabold",
        sizeCls[size],
        toneCls[tone],
        uppercase && "uppercase tracking-wide",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
