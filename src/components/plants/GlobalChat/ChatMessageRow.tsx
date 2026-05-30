import { match } from "ts-pattern";
import { ToolIcon } from "@/components/icons";
import { Pill } from "@/components/ui";
import type { RowMessage } from "./types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toolLabel(name: string, status?: string): string {
  return match(name)
    .with("check_temperature", () => "checked temperature")
    .with("check_humidity", () => "checked humidity")
    .with("check_soil_moisture", () => "checked soil moisture")
    .with("water_plant", () =>
      match(status)
        .with("watered", () => "watered the plant")
        .with("queued", () => "watering queued")
        .with("pump_skipped", () => "skipped — pump cooling down")
        .with("pump_failed", () => "skipped — pump error")
        .with("already_queued", () => "watering already queued")
        .with("soil_already_full", () => "skipped — soil already full")
        .with("soil_sensor_unavailable", () => "skipped — sensor offline")
        .with("out_of_droplets", () => "skipped — out of droplets")
        .otherwise(() => "tried to water"),
    )
    .otherwise(() => name);
}

export function ChatMessageRow({
  message,
  plantName,
  plantProfileImageUrl,
}: {
  message: RowMessage;
  plantName: string;
  plantProfileImageUrl: string | null;
}) {
  const align = message.kind === "you" ? "right" : "left";

  return (
    <li className={`flex gap-3 ${align === "right" ? "flex-row-reverse" : ""}`}>
      <Avatar
        kind={message.kind}
        authorName={message.authorName}
        plantName={plantName}
        plantProfileImageUrl={plantProfileImageUrl}
      />

      <div
        className={`flex min-w-0 flex-1 flex-col gap-1 ${
          align === "right" ? "items-end" : ""
        }`}
      >
        <div
          className={`flex items-baseline gap-2 ${
            align === "right" ? "flex-row-reverse" : ""
          }`}
        >
          <span
            className={[
              "text-sm font-extrabold",
              match(message.kind)
                .with("plant", () => "text-brand")
                .with("you", () => "text-ink")
                .with("other-visitor", () => "text-ink-muted")
                .exhaustive(),
            ].join(" ")}
          >
            {message.kind === "you"
              ? `${message.authorName} (you)`
              : message.authorName}
          </span>
          <span className="text-xs text-ink-subtle">
            {formatTime(message.createdAt)}
          </span>
        </div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <ul
            className={`flex flex-wrap gap-1.5 ${
              align === "right" ? "justify-end" : ""
            }`}
          >
            {message.toolCalls.map((tc, i) => (
              <li key={i}>
                <Pill tone="neutral" size="sm">
                  <ToolIcon className="h-3 w-3" aria-hidden />
                  {toolLabel(tc.name, tc.status)}
                </Pill>
              </li>
            ))}
          </ul>
        )}

        <p
          className={`whitespace-pre-wrap break-words text-sm text-ink ${
            align === "right" ? "text-right" : ""
          }`}
        >
          {message.content}
        </p>
      </div>
    </li>
  );
}

function Avatar({
  kind,
  authorName,
  plantName,
  plantProfileImageUrl,
}: {
  kind: RowMessage["kind"];
  authorName: string;
  plantName: string;
  plantProfileImageUrl: string | null;
}) {
  if (kind === "plant") {
    return (
      <div className="shrink-0 pt-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={plantProfileImageUrl ?? "/persona-2-terracotta.svg"}
          alt={`${plantName} avatar`}
          className="h-8 w-8 rounded-full bg-surface-sunken object-cover p-0.5"
        />
      </div>
    );
  }

  // Visitors (you + strangers) share the site logo at a smaller size. This
  // keeps the plant visually dominant — it's the one with personality — and
  // matches the Twitch-style chat reference where chatters all wear a
  // generic default avatar.
  return (
    <div className="shrink-0 pt-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icon.svg"
        alt={`${authorName} avatar`}
        className="h-6 w-6 rounded-full bg-surface-sunken p-0.5 ring-1 ring-border"
      />
    </div>
  );
}
