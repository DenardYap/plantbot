"use client";
import { match } from "ts-pattern";
import { CameraIcon, CameraOffIcon, LoaderIcon } from "@/components/icons";
import { Pill } from "@/components/ui";
import { useStreamStatus } from "./useStreamStatus";

export function StreamStatusBadge({
  streamUrl,
  className,
}: {
  streamUrl: string;
  className?: string;
}) {
  const status = useStreamStatus(streamUrl);

  return match(status)
    .with("loading", () => (
      <Pill tone="dark" size="sm" uppercase className={className}>
        <LoaderIcon className="h-3 w-3 animate-spin" aria-hidden />
        Checking…
      </Pill>
    ))
    .with("offline", () => (
      <Pill tone="neutral" size="sm" uppercase className={className}>
        <CameraOffIcon className="h-3 w-3" aria-hidden />
        Camera offline
      </Pill>
    ))
    .with("live", () => (
      <Pill tone="success" size="sm" uppercase className={className}>
        <CameraIcon className="h-3 w-3" aria-hidden />
        Live
      </Pill>
    ))
    .exhaustive();
}
