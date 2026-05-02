import { CameraOffIcon } from "@/components/icons";
import { Card, Pill } from "@/components/ui";

/**
 * Camera placeholder. The Raspberry Pi rig doesn't have a camera wired up
 * yet — the rest of the dashboard runs on real sensor data, so this panel
 * deliberately announces itself as offline. We show the plant's profile
 * photo behind a white scrim so the panel still feels like *this* plant
 * rather than an empty box.
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
  const label = displayName || plantName;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full bg-surface-sunken">
        {profileImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profileImageUrl}
              alt={`${plantName} profile photo`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* 20% white wash — just enough to lift the headline contrast
                without burying the plant behind a scrim. */}
            <div aria-hidden className="absolute inset-0 bg-surface/60" />
          </>
        ) : (
          // Default placeholder — soft brand wash, used when no photo exists.
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,hsl(150_22%_60%/0.18),transparent_55%),radial-gradient(circle_at_75%_80%,hsl(150_22%_30%/0.22),transparent_60%)]"
          />
        )}

        <Pill
          tone="neutral"
          size="md"
          uppercase
          className="absolute left-4 top-4"
        >
          <CameraOffIcon className="h-3 w-3" aria-hidden />
          Camera offline
        </Pill>

        {/* Centered headline — drop shadow gives the dark text its own depth
            layer so it never fights with whatever's behind it. */}
        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <p className="text-2xl font-extrabold tracking-tight text-ink drop-shadow-[0_2px_12px_hsl(0_0%_100%/0.9)] sm:text-3xl">
            {label} is not live right now
          </p>
        </div>
      </div>
    </Card>
  );
}
