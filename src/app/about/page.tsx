import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader, TextLink } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "PlantBot is a small experiment in agentic-fying inanimate objects — a Raspberry Pi wired to my houseplants, with Claude on top.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · PlantBot",
    description: "A small experiment in agentic-fying inanimate objects.",
    url: `${SITE.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="About"
        title="Giving my houseplants an agent."
        lead={
          <>
            {SITE.name} is a little experiment in agentic-fying inanimate
            objects. It&apos;s a Raspberry Pi hooked to my actual houseplants —
            sensors, pumps, a camera, the whole thing — then I give it Claude
            and tools so the plant agent can perform actions like telling you
            the moisture level of a plant, or watering it.
          </>
        }
        className="mx-auto mb-12"
      />

      <section aria-labelledby="how-it-works" className="mx-auto max-w-2xl">
        <h2
          id="how-it-works"
          className="text-2xl font-extrabold tracking-tight text-ink"
        >
          How the pieces fit together
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          A Raspberry Pi sits on the shelf next to the plants. It reads the
          moisture, humidity, and temperature sensors, drives a small pump for
          watering (coming soon), and constantly writes the data to my backend
          server. The camera streams the plants over HLS so you can actually
          watch them.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          This website is the front-end. It pulls sensor data and the video feed
          from the Pi, and forwards your chat messages to Claude. Claude has a
          handful of tools wired up — read a sensor, water a plant, write back
          to the chat — and decides on its own when to call them. When it waters
          a plant, an actual pump runs; a few seconds later the moisture reading
          jumps and you can see the soil get darker on camera.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          That&apos;s basically it. Building agent is very easy, and anyone can
          do it. There&apos;s no clever architecture, no orchestration framework
          — just a Pi, some cheap sensors, an LLM, and a bunch of glue code.
        </p>
      </section>

      <section aria-labelledby="why" className="mx-auto mt-10 max-w-2xl">
        <h2
          id="why"
          className="text-2xl font-extrabold tracking-tight text-ink"
        >
          Why
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          I wanted to see what it feels like when an agent can actually do
          things in the physical world, even tiny things. Most &ldquo;AI
          agents&rdquo; I&apos;d built before that point only moved bits around.
          Giving one a pump and a real plant that can die felt like a more
          honest test.
        </p>
      </section>

      <section aria-labelledby="source" className="mx-auto mt-10 max-w-2xl">
        <h2
          id="source"
          className="text-2xl font-extrabold tracking-tight text-ink"
        >
          Open source
        </h2>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          The code and the wiring are all on{" "}
          <TextLink href={SITE.github.url}>GitHub</TextLink>. If you want to
          build something similar, the <TextLink href="/guide">Guide</TextLink>{" "}
          walks through the hardware and the agent setup.
        </p>
      </section>
    </PageContainer>
  );
}
