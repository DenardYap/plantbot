"use client";
import { match } from "ts-pattern";
import { CameraIcon, LoaderIcon } from "@/components/icons";
import { Card, Pill } from "@/components/ui";
import { HERO_ROW_HEIGHT_LG_CLASS } from "../layout";
import { useHlsPlayer } from "./useHlsPlayer";
import { OfflinePlaceholder } from "./OfflinePlaceholder";
import { useStreamStatus } from "../useStreamStatus";

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
  // Independent liveness check on the playlist itself. hls.js will happily
  // keep painting buffered frames after the encoder dies (the file is still
  // reachable, it just isn't growing), so we can't rely on player events
  // alone to swap in the offline placeholder.
  const streamStatus = useStreamStatus(src);
  // Detach hls.js the moment the playlist check confirms offline —
  // passing null tears down the player and clears the buffer.
  const { videoRef, status } = useHlsPlayer(
    streamStatus === "offline" ? null : src,
  );

  if (streamStatus === "offline" || status === "error") {
    return (
      <OfflinePlaceholder
        plantName={plantName}
        displayName={displayName}
        profileImageUrl={profileImageUrl}
      />
    );
  }

  return (
    <Card className={`overflow-hidden ${HERO_ROW_HEIGHT_LG_CLASS}`}>
      <div
        className={`relative aspect-video w-full bg-surface-sunken lg:aspect-auto ${HERO_ROW_HEIGHT_LG_CLASS}`}
      >
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
                <LoaderIcon
                  className="h-3 w-3 animate-spin"
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
