export const SITE = {
  name: "PlantBot",
  shortName: "PlantBot",
  description:
    "Chat with your houseplants. PlantBot is an AI agent wired to a Raspberry Pi that waters, measures, and livestreams real plants — and talks with you about them.",
  tagline: "An AI agent for your real, living plants.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000",
  author: "PlantBot",
  // Configure these via env vars once the repo is public.
  // Leaving as placeholders keeps the UI working without external calls.
  github: {
    repo: process.env.NEXT_PUBLIC_GITHUB_REPO || "DenardYap/plantbot",
    url:
      process.env.NEXT_PUBLIC_GITHUB_URL ||
      "https://github.com/DenardYap/plantbot",
    stars: Number(process.env.NEXT_PUBLIC_GITHUB_STARS || 0),
  },
} as const;
