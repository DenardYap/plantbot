import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, IconBadge, PageHeader, TextLink } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guide",
  description:
    "Step-by-step guide to building your own PlantBot: wiring the Raspberry Pi, hooking up sensors and a pump, streaming video, and connecting an AI agent.",
  alternates: { canonical: "/guide" },
  openGraph: {
    title: "Guide · PlantBot",
    description:
      "Build your own plant-caring AI agent — Raspberry Pi, sensors, pump, camera, and an LLM with tools.",
    url: `${SITE.url}/guide`,
  },
};

type Step = {
  title: string;
  body: string;
  items?: string[];
};

const steps: Step[] = [
  {
    title: "Gather the hardware",
    body: "You need a Raspberry Pi, a camera, and a few cheap sensors plus a small water pump. Anything Pi 4 or newer works; a Pi Zero 2 W is fine if you keep the ML off-device.",
    items: [
      "Raspberry Pi 4 (2GB+) or Pi Zero 2 W",
      "Pi Camera Module or any USB webcam",
      "DHT22 (air temp + humidity)",
      "Capacitive soil moisture sensor",
      "5V peristaltic pump + relay module + silicone tubing",
    ],
  },
  {
    title: "Wire up the sensors and the pump",
    body: "Solder or breadboard the sensors to the Pi's GPIO. Keep the pump on its own 5V supply and switch it through a relay — don't try to drive it off the Pi directly.",
  },
  {
    title: "Stream the camera",
    body: "Use MediaMTX or Go2RTC on the Pi to expose a low-latency WebRTC stream. Hand the browser a signed URL and let it connect directly — keep the Pi off the critical media path.",
  },
  {
    title: "Expose sensor and pump control as HTTP tools",
    body: "Write a small FastAPI or Express service on the Pi with endpoints like GET /sensors, POST /water. Authenticate with a shared token. This is the surface the agent will call into.",
  },
  {
    title: "Wire up the agent",
    body: "Point an LLM (OpenAI, Anthropic, or local) at those endpoints as tools. Give it a system prompt that spells out its job: read the chat, decide when to act, and speak back sparingly.",
    items: [
      "Tool: readSensors({ plant })",
      "Tool: waterPlant({ plant, ml })",
      "Tool: sendChat({ plant, text })",
    ],
  },
  {
    title: "Connect the website",
    body: "This Next.js app talks to the Pi service over HTTPS (or a tunnel like Tailscale Funnel / Cloudflare Tunnel). Chat messages are posted to a shared channel; the agent listens and writes back.",
  },
  {
    title: "Log everything",
    body: "Every sensor read, every action, every message — store it. You'll want it for charts, for debugging the agent, and for the occasional 'what on earth did it just do?' moment.",
  },
];

export default function GuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Build your own PlantBot",
    description:
      "A step-by-step guide to building an AI agent that cares for real plants using a Raspberry Pi.",
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Guide"
        title="Build your own PlantBot."
        lead="Everything you need to get from a box of parts to a plant that texts you when it's thirsty."
        className="mb-10"
      />

      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Card className="p-6">
              <div className="flex items-start gap-5">
                <IconBadge
                  tone="ink"
                  size="lg"
                  className="text-lg font-extrabold"
                  aria-hidden
                >
                  {i + 1}
                </IconBadge>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold tracking-tight text-ink">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-base leading-relaxed text-ink-muted">
                    {step.body}
                  </p>
                  {step.items && (
                    <ul className="mt-4 space-y-1.5 text-sm text-ink">
                      {step.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-brand"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <footer className="mt-10 rounded-2xl border border-border bg-surface-sunken p-6 text-sm text-ink-muted">
        The full source is on{" "}
        <TextLink href={SITE.github.url} external>
          GitHub
        </TextLink>{" "}
        — PRs welcome.
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </PageContainer>
  );
}
