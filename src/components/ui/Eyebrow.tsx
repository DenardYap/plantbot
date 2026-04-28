import type { ElementType, ReactNode } from "react";

type Tone = "subtle" | "brand" | "muted";
type Size = "xxs" | "xs" | "sm";

const toneCls: Record<Tone, string> = {
  subtle: "text-ink-subtle",
  brand: "text-brand",
  muted: "text-ink-muted",
};

const sizeCls: Record<Size, string> = {
  // 11px — used inside dense card metrics
  xxs: "text-[11px]",
  xs: "text-xs",
  sm: "text-sm",
};

/**
 * Small-caps "eyebrow" label. Used as a category marker above headings and
 * inside dense metrics. Consistent uppercase + bold + tracking across the
 * product lets us strip other decoration from the content below it.
 */
export function Eyebrow({
  children,
  as: Tag = "p",
  tone = "subtle",
  size = "xs",
  className = "",
}: {
  children: ReactNode;
  as?: ElementType;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  return (
    <Tag
      className={[
        "font-bold uppercase tracking-wide",
        sizeCls[size],
        toneCls[tone],
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}
