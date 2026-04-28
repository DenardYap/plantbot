import type { ReactNode } from "react";
import { Card, Eyebrow, IconBadge } from "@/components/ui";

export function StatTile({
  label,
  value,
  unit,
  icon,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <Eyebrow size="sm">{label}</Eyebrow>
        {icon && <IconBadge>{icon}</IconBadge>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-4xl font-extrabold tracking-tight text-ink">
          {value}
        </span>
        {unit && (
          <span className="text-lg font-bold text-ink-muted">{unit}</span>
        )}
      </div>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </Card>
  );
}
