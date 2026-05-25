import { Card, Pill } from "@/components/ui";

/**
 * Placeholder card for plants that are announced but not yet wired up.
 *
 * Visually mirrors `PlantCard`'s outer shape so the grid stays rhythmic, but
 * intentionally strips everything interactive — no Link, no metrics, no CTA —
 * to make it unambiguous that there's nothing to chat with yet.
 */
export function ComingSoonPlantCard({
  name,
  species,
  imageUrl,
}: {
  name: string;
  species: string;
  imageUrl: string;
}) {
  return (
    <Card
      as="article"
      className="flex h-full flex-col overflow-hidden"
      aria-label={`${name} — coming soon`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-grey-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Heavier wash than active cards — signals "not live" before reading
            a single word, mirroring the muted treatment of the offline state. */}
        <div aria-hidden className="absolute inset-0 bg-surface/70" />
        <div className="absolute inset-0 grid place-items-center px-4 text-center">
          <p className="text-lg font-extrabold tracking-tight text-ink drop-shadow-[0_2px_8px_hsl(0_0%_100%/0.9)] sm:text-xl">
            Coming soon
          </p>
        </div>
        <Pill
          tone="neutral"
          size="sm"
          uppercase
          className="absolute left-3 top-3"
        >
          Not live yet
        </Pill>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl font-extrabold tracking-tight text-ink-muted">
            {name}
          </h3>
          <span className="text-sm font-bold text-ink-subtle">{species}</span>
        </div>
        <p className="mt-2 text-sm text-ink-subtle">
          Sensors aren&apos;t hooked up yet — check back soon.
        </p>
      </div>
    </Card>
  );
}
