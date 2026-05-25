import { LiveStream } from "./LiveStream";
import { OfflinePlaceholder } from "./OfflinePlaceholder";

/**
 * Renders a live HLS stream when NEXT_PUBLIC_PLANT_STREAM_URL is set,
 * otherwise falls back to the offline placeholder. No call-site change is
 * needed — the parent page passes the same props regardless.
 */
export function VideoStream({
  plantName,
  displayName,
  profileImageUrl,
}: {
  plantName: string;
  /** Friendly name for the overlay copy — usually the plant's nickname. */
  displayName?: string | null;
  profileImageUrl?: string | null;
}) {
  const streamUrl = process.env.NEXT_PUBLIC_PLANT_STREAM_URL;

  if (streamUrl) {
    return (
      <LiveStream
        src={streamUrl}
        plantName={plantName}
        displayName={displayName}
        profileImageUrl={profileImageUrl}
      />
    );
  }

  return (
    <OfflinePlaceholder
      plantName={plantName}
      displayName={displayName}
      profileImageUrl={profileImageUrl}
    />
  );
}
