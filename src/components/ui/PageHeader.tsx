import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

/**
 * Standard page-level header: brand eyebrow → h1 → lead paragraph.
 * Centers width caps on the header so long-form pages stay readable
 * regardless of the surrounding PageContainer width.
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  align = "left",
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  const isCenter = align === "center";
  return (
    <header
      className={[
        isCenter ? "mx-auto max-w-xl text-center" : "max-w-2xl",
        className,
      ].join(" ")}
    >
      {eyebrow && (
        <Eyebrow tone="brand" size="sm">
          {eyebrow}
        </Eyebrow>
      )}
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        {title}
      </h1>
      {lead && (
        <p className="mt-4 text-lg text-ink-muted">{lead}</p>
      )}
    </header>
  );
}
