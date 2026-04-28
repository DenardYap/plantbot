export type Plant = {
  slug: string;
  name: string;
  species: string;
  commonName: string;
  personality: string;
  moodEmoji?: never; // intentionally none — we'll use icons, not emoji
  happiness: number; // 0–100
  humidity: number; // %
  temperature: number; // °C
  soilMoisture: number; // %
  lastWatered: string; // ISO
  facts: string[];
};

export const plants: Plant[] = [
  {
    slug: "basil",
    name: "Basil",
    species: "Ocimum basilicum",
    commonName: "Sweet basil",
    personality:
      "Dramatic, a little needy, writes poetry about sunlight at 4pm.",
    happiness: 82,
    humidity: 58,
    temperature: 23.4,
    soilMoisture: 46,
    lastWatered: "2026-04-26T08:15:00Z",
    facts: [
      "Basil is native to tropical Central Africa and Southeast Asia.",
      "Pinching the top leaves off encourages bushier growth.",
      "It thrives in 6+ hours of sunlight and soil around 24 °C.",
    ],
  },
  {
    slug: "pothos",
    name: "Pothos",
    species: "Epipremnum aureum",
    commonName: "Devil's ivy",
    personality: "Laid-back, unbothered, would survive a nuclear winter.",
    happiness: 94,
    humidity: 52,
    temperature: 22.1,
    soilMoisture: 38,
    lastWatered: "2026-04-24T19:40:00Z",
    facts: [
      "Pothos can survive in low light and irregular watering schedules.",
      "Its variegated leaves revert to solid green in dim conditions.",
      "Cuttings root easily in a glass of water within 1–2 weeks.",
    ],
  },
  {
    slug: "monstera",
    name: "Monstera",
    species: "Monstera deliciosa",
    commonName: "Swiss cheese plant",
    personality: "Confident, knows she's photogenic, wants fresh air.",
    happiness: 71,
    humidity: 64,
    temperature: 24.0,
    soilMoisture: 52,
    lastWatered: "2026-04-25T14:05:00Z",
    facts: [
      "The leaf fenestrations (holes) help it withstand tropical storms.",
      "Monstera produces edible fruit after ~10 years in ideal conditions.",
      "It prefers bright, indirect light and weekly watering.",
    ],
  },
];

export const getPlant = (slug: string) =>
  plants.find((p) => p.slug === slug) ?? null;

export const globalStats = () => {
  const count = plants.length;
  const avg = (key: keyof Plant) =>
    plants.reduce((sum, p) => sum + (p[key] as number), 0) / count;

  return {
    count,
    avgHappiness: Math.round(avg("happiness")),
    avgHumidity: Math.round(avg("humidity")),
    avgTemperature: Number(avg("temperature").toFixed(1)),
    avgSoilMoisture: Math.round(avg("soilMoisture")),
  };
};
