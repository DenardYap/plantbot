import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, IconBadge, PageHeader, TextLink } from "@/components/ui";
import {
  DropletIcon,
  LeafIcon,
  SparkleIcon,
  ThermometerIcon,
} from "@/components/icons";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "PlantBot connects real houseplants to an AI agent running on a Raspberry Pi. It waters, measures, and livestreams them — and chats with you about what it sees.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · PlantBot",
    description:
      "An AI agent that takes real care of real plants — and chats with you while it does.",
    url: `${SITE.url}/about`,
  },
};

const pillars = [
  {
    icon: <LeafIcon className="h-5 w-5" />,
    title: "Real plants, real hardware",
    body: "Every plant on the site is a physical plant on my desk, hooked into a Raspberry Pi with moisture, humidity, and temperature sensors plus a camera.",
  },
  {
    icon: <SparkleIcon className="h-5 w-5" />,
    title: "An agent with tools",
    body: "The agent has tools it can call: read a sensor, water a plant, or write back to the chat. It decides when to use each one on its own.",
  },
  {
    icon: <DropletIcon className="h-5 w-5" />,
    title: "Watering, live",
    body: "When the agent waters a plant, a small pump actually runs. The soil moisture reading jumps a few seconds later — and you see it happen on camera.",
  },
  {
    icon: <ThermometerIcon className="h-5 w-5" />,
    title: "Everything is observable",
    body: "Sensor history, agent actions, and chat messages are all logged and plotted, so you can see exactly what the plant experienced and how the agent responded.",
  },
];

export default function AboutPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="About"
        title="An AI agent that cares for real plants."
        lead={
          <>
            {SITE.name} is a little experiment in embodied agents. Instead of
            giving a language model a virtual world, I wired it to a Raspberry
            Pi hooked to my actual houseplants — sensors, pumps, a camera, the
            whole thing.
          </>
        }
        className="mb-10"
      />

      <section aria-labelledby="pillars" className="mb-12">
        <h2 id="pillars" className="sr-only">
          What PlantBot is
        </h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pillars.map((p) => (
            <li key={p.title}>
              <Card className="h-full p-6">
                <IconBadge size="lg" className="mb-4">
                  {p.icon}
                </IconBadge>
                <h3 className="text-lg font-extrabold tracking-tight text-ink">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {p.body}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how-it-works" className="max-w-3xl">
        <h2
          id="how-it-works"
          className="text-2xl font-extrabold tracking-tight text-ink"
        >
          How the pieces fit together
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          A Raspberry Pi sits next to the plants, reading sensors and running a
          small web service. The website connects to that service over the
          internet, shows you the camera feed, and relays your chat to the
          agent. When the agent decides to act — say, to water a plant — it
          calls a tool that triggers a physical pump. The next sensor reading
          confirms it happened.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          If you want to build your own, the{" "}
          <TextLink href="/guide">Guide</TextLink> walks through it step by
          step.
        </p>
      </section>
    </PageContainer>
  );
}
