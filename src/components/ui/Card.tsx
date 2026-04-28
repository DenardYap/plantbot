import type { ReactNode } from "react";

/**
 * Low-elevation surface used as the base for most grouped content.
 * Provides the rounded corners + soft layered shadow; padding and content
 * are intentionally left to the caller so the same Card works for
 * dense dashboards, media tiles, and long-form panels.
 */
export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "aside";
}) {
  return (
    <Tag
      className={[
        "rounded-2xl bg-surface",
        "shadow-[0_1px_0_hsl(150_10%_90%),_0_12px_32px_-16px_hsl(150_20%_15%/0.10)]",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}
