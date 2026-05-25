"use client";
import { match } from "ts-pattern";
import { CameraIcon } from "@/components/icons";
import { Card, Pill } from "@/components/ui";
import { useHlsPlayer } from "./useHlsPlayer";
import { OfflinePlaceholder } from "./OfflinePlaceholder";

export function LiveStream({
  src,
  plantName,
  displayName,
  profileImageUrl,
}: {
  src: string;
  plantName: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
}) {
  const { videoRef, status } = useHlsPlayer(src);

  if (status === "error") {
    return (
      <OfflinePlaceholder
        plantName={plantName}
        displayName={displayName}
        profileImageUrl={profileImageUrl}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full bg-surface-sunken">
        {/* The <video> element is always mounted so hls.js can attach to it,
            but hidden until the first fragment arrives. */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          playsInline
          style={{ display: status === "live" ? "block" : "none" }}
        />

        {match(status)
          .with("connecting", () => (
            <>
              {/* Keep the profile photo visible while buffering so the panel
                  never looks empty — same treatment as the offline state. */}
              {profileImageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profileImageUrl}
                    alt={`${plantName} profile photo`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div aria-hidden className="absolute inset-0 bg-surface/60" />
                </>
              ) : (
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,hsl(150_22%_60%/0.18),transparent_55%),radial-gradient(circle_at_75%_80%,hsl(150_22%_30%/0.22),transparent_60%)]"
                />
              )}
              <Pill
                tone="dark"
                size="md"
                uppercase
                className="absolute left-4 top-4"
              >
                <span
                  className="h-2 w-2 animate-pulse rounded-full bg-current"
                  aria-hidden
                />
                Connecting…
              </Pill>
            </>
          ))
          .with("live", () => (
            <Pill
              tone="success"
              size="md"
              uppercase
              className="absolute left-4 top-4"
            >
              <CameraIcon className="h-3 w-3" aria-hidden />
              Live
            </Pill>
          ))
          .exhaustive()}
      </div>
    </Card>
  );
}
