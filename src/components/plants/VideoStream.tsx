import { LiveDotIcon, PlayIcon } from "@/components/icons";
import { Card, IconBadge, Pill } from "@/components/ui";

export function VideoStream({ plantName }: { plantName: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full bg-grey-900">
        {/* Decorative gradient placeholder for the live stream */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,hsl(150_42%_40%/0.45),transparent_55%),radial-gradient(circle_at_75%_80%,hsl(150_62%_11%/0.65),transparent_60%)]"
        />

        <Pill
          tone="dark"
          size="md"
          uppercase
          className="absolute left-4 top-4"
        >
          <LiveDotIcon className="h-2 w-2 animate-pulse text-green-400" />
          Live
        </Pill>

        {/* Centered play icon (purely decorative for now) */}
        <div className="absolute inset-0 grid place-items-center">
          <IconBadge tone="inverse" size="xl">
            <PlayIcon className="h-7 w-7" aria-hidden />
          </IconBadge>
        </div>

        {/* Caption overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink/80 to-transparent px-4 pb-4 pt-12 text-ink-inverse">
          <div className="text-sm font-bold">{plantName} · Cam 01</div>
          <div className="text-xs text-grey-300">1080p · 30fps</div>
        </div>
      </div>
    </Card>
  );
}
