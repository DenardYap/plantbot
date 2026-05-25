import { CameraOffIcon } from "@/components/icons";
import { Card, Pill } from "@/components/ui";

export function OfflinePlaceholder({
  plantName,
  displayName,
  profileImageUrl,
}: {
  plantName: string;
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

        <div className="absolute inset-0 grid place-items-center px-6 text-center">
          <p className="text-2xl font-extrabold tracking-tight text-ink drop-shadow-[0_2px_12px_hsl(0_0%_100%/0.9)] sm:text-3xl">
            {label} is not live right now
          </p>
        </div>
      </div>
    </Card>
  );
}
