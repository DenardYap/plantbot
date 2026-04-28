import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

type Align = "start" | "center" | "end";

const alignCls: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

/**
 * Header used at the top of a Card / dashboard section.
 * Combines an eyebrow, an h2 title, optional lead text, and an optional
 * right-aligned slot (for pills, meta, or small actions).
 *
 * Intentionally a flat structure: callers compose further wrapping and
 * spacing (e.g. `mb-5`, `border-b`) via `className`.
 */
export function SectionHeader({
  eyebrow,
  title,
  lead,
  right,
  align = "start",
  className = "",
  titleAs: TitleTag = "h2",
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  lead?: ReactNode;
  right?: ReactNode;
  align?: Align;
  className?: string;
  titleAs?: "h2" | "h3";
}) {
  return (
    <header
      className={[
        "flex justify-between gap-4",
        alignCls[align],
        className,
      ].join(" ")}
    >
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && (
          <TitleTag className="text-xl font-extrabold tracking-tight text-ink">
            {title}
          </TitleTag>
        )}
        {lead && (
          <p className="mt-1 text-sm text-ink-muted">{lead}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
