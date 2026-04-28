import { Card, IconBadge, SectionHeader } from "@/components/ui";
import { LeafIcon } from "@/components/icons";
import type { Plant } from "@/lib/plants";

export function PlantFacts({ plant }: { plant: Plant }) {
  return (
    <Card className="p-6">
      <SectionHeader
        eyebrow={`About ${plant.name}`}
        title="A few quick facts"
        lead={`${plant.species} · ${plant.commonName}`}
        className="mb-5"
      />

      <ul className="space-y-3">
        {plant.facts.map((fact, i) => (
          <li key={i} className="flex items-start gap-3">
            <IconBadge size="sm" className="mt-0.5">
              <LeafIcon className="h-3.5 w-3.5" />
            </IconBadge>
            <p className="text-sm leading-relaxed text-ink">{fact}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
