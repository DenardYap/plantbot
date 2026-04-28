import { Card, IconBadge, Pill, SectionHeader } from "@/components/ui";
import {
  DropletIcon,
  LeafIcon,
  SparkleIcon,
  ThermometerIcon,
} from "@/components/icons";
import type { Plant } from "@/lib/plants";

type Activity = {
  id: string;
  kind: "water" | "sense" | "think";
  title: string;
  detail: string;
  at: string;
};

function recentActivity(plant: Plant): Activity[] {
  return [
    {
      id: "a1",
      kind: "water",
      title: `Watered ${plant.name}`,
      detail: `Pumped 30ml — soil moisture now ${plant.soilMoisture}%`,
      at: "2 min ago",
    },
    {
      id: "a2",
      kind: "sense",
      title: "Read sensors",
      detail: `Humidity ${plant.humidity}% · Temp ${plant.temperature} °C`,
      at: "5 min ago",
    },
    {
      id: "a3",
      kind: "think",
      title: "Checked in with the chat",
      detail: "Replied to a question about sunlight",
      at: "11 min ago",
    },
  ];
}

const kindStyles: Record<
  Activity["kind"],
  { icon: React.ReactNode; tone: "brand" | "neutral" }
> = {
  water: {
    icon: <DropletIcon className="h-4 w-4" />,
    tone: "brand",
  },
  sense: {
    icon: <ThermometerIcon className="h-4 w-4" />,
    tone: "neutral",
  },
  think: {
    icon: <SparkleIcon className="h-4 w-4" />,
    tone: "neutral",
  },
};

export function AgentActivity({ plant }: { plant: Plant }) {
  const items = recentActivity(plant);

  return (
    <Card className="p-6">
      <SectionHeader
        eyebrow="Agent activity"
        title="What PlantBot is doing"
        align="center"
        className="mb-5"
        right={
          <Pill>
            <LeafIcon className="h-3.5 w-3.5" />
            Online
          </Pill>
        }
      />

      <ol className="space-y-4">
        {items.map((a) => (
          <li key={a.id} className="flex items-start gap-3">
            <IconBadge tone={kindStyles[a.kind].tone}>
              {kindStyles[a.kind].icon}
            </IconBadge>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-extrabold text-ink">
                  {a.title}
                </p>
                <span className="shrink-0 text-xs text-ink-subtle">
                  {a.at}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-ink-muted">{a.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
