import type { ReactNode } from "react";
import { match } from "ts-pattern";
import { Card, Eyebrow, IconBadge } from "@/components/ui";

type Tone = "neutral" | "success" | "warning" | "danger";

const valueToneCls: Record<Tone, string> = {
  neutral: "text-ink",
  success: "text-ink",
  warning: "text-yellow-800",
  danger: "text-red-600",
};

const ringCls: Record<Tone, string> = {
  neutral: "",
  success: "ring-1 ring-inset ring-green-200",
  warning: "ring-1 ring-inset ring-yellow-300",
  danger: "ring-1 ring-inset ring-red-200",
};

export function StatTile({
  label,
  value,
  unit,
  icon,
  hint,
  tone = "neutral",
  statusIcon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  hint?: string;
  tone?: Tone;
  /** Small status indicator (e.g. check / warning) shown inline with the label. */
  statusIcon?: ReactNode;
}) {
  const badgeTone = match(tone)
    .with("success", () => "success" as const)
    .with("warning", () => "warning" as const)
    .with("danger", () => "danger" as const)
    .with("neutral", () => "brand" as const)
    .exhaustive();

  return (
    <Card className={["p-4 sm:p-5", ringCls[tone]].filter(Boolean).join(" ")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Eyebrow size="sm">{label}</Eyebrow>
          {statusIcon && (
            <span className="shrink-0 text-ink-muted">{statusIcon}</span>
          )}
        </div>
        {icon && (
          <span className="shrink-0">
            <IconBadge tone={badgeTone}>{icon}</IconBadge>
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={[
            "text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl",
            valueToneCls[tone],
          ].join(" ")}
        >
          {value}
        </span>
        {unit && (
          <span className="text-base font-bold text-ink-muted sm:text-lg">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </Card>
  );
}
