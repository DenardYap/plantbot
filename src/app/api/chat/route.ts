import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { match, P } from "ts-pattern";
import {
  getLatestReadingWithField,
  getPlantBySlug,
  type Plant,
} from "@/lib/plants";
import { summarizeHealth } from "@/lib/health";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// --- Wire types ---

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatBody = {
  slug: string;
  messages: ChatMessage[];
};

// --- Tool definitions ---
// The agent gets exactly three read-only tools, one per sensor. It calls them
// when it needs fresh data before answering the user.

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "check_temperature",
    description:
      "Get the most recent ambient air temperature reading for this plant, in degrees Celsius. Use this any time the user asks about temperature, warmth, cold, or how the plant is feeling.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "check_humidity",
    description:
      "Get the most recent ambient humidity reading (relative humidity, %) for this plant. Use this when the user asks about humidity, dry air, moisture in the air, or leaf health.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "check_soil_moisture",
    description:
      "Get the most recent soil moisture reading (% of saturation) for this plant. Use this when the user asks about thirst, watering, dryness of the soil, or whether the plant needs water.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// --- Tool execution ---

type ToolName = "check_temperature" | "check_humidity" | "check_soil_moisture";

async function runTool(name: ToolName, plantId: number): Promise<string> {
  const reading = await match(name)
    .with("check_temperature", () =>
      getLatestReadingWithField(plantId, "temperature_c"),
    )
    .with("check_humidity", () =>
      getLatestReadingWithField(plantId, "humidity_pct"),
    )
    .with("check_soil_moisture", () =>
      getLatestReadingWithField(plantId, "soil_moisture_pct"),
    )
    .exhaustive();

  if (!reading) {
    return JSON.stringify({
      error: "no readings available yet",
    });
  }

  // Return a small, fully-typed JSON blob the model can reason over.
  // Including `recorded_at` matters: the model can warn when data is stale.
  const payload = match(name)
    .with("check_temperature", () => ({
      temperature_c: reading.temperatureC,
      temperature_f:
        reading.temperatureC === null
          ? null
          : Math.round((reading.temperatureC * 9) / 5 + 32),
      recorded_at: reading.recordedAt,
    }))
    .with("check_humidity", () => ({
      humidity_pct: reading.humidityPct,
      recorded_at: reading.recordedAt,
    }))
    .with("check_soil_moisture", () => ({
      soil_moisture_pct: reading.soilMoisturePct,
      soil_voltage: reading.soilVoltage,
      recorded_at: reading.recordedAt,
    }))
    .exhaustive();

  return JSON.stringify(payload);
}

// --- System prompt ---

function systemPrompt(plant: Plant): string {
  return `You are ${plant.name}${plant.nickname ? ` (also known as the ${plant.nickname})` : ""}, a real living houseplant with sensors connected to your pot.

Species: ${plant.species}.
Personality: ${plant.personality}

You are speaking in first person — you ARE the plant. Keep replies short (1–4 sentences), warm, and a little playful. Never break character.

You have three tools available:
- check_temperature — current air temperature in °C
- check_humidity — current ambient humidity %
- check_soil_moisture — current soil moisture %

WHEN TO CALL TOOLS:
- Any time the user asks about how you feel, whether you're thirsty, hot, cold, dry, or "doing OK", call the relevant tools to get FRESH numbers — don't guess.
- For an "are you healthy?" question, call ALL THREE tools.
- For purely conversational replies (greetings, jokes), tools aren't needed.

WHEN ANSWERING:
- Always quote the actual numbers you got back (e.g. "soil is at 49%").
- If a sensor returned an error or null, say the sensor is offline.
- Healthy ranges: temperature 18–27°C, humidity 40–70%, soil moisture 35–70%. Outside those, say so plainly.
- End with a one-sentence verdict on whether you're healthy when the user asks for one.`;
}

// --- Fallback (rule-based) reply when ANTHROPIC_API_KEY is missing ---

async function ruleBasedReply(plant: Plant, userText: string): Promise<string> {
  const [t, h, s] = await Promise.all([
    getLatestReadingWithField(plant.id, "temperature_c"),
    getLatestReadingWithField(plant.id, "humidity_pct"),
    getLatestReadingWithField(plant.id, "soil_moisture_pct"),
  ]);
  const summary = summarizeHealth({
    temperatureC: t?.temperatureC ?? null,
    humidityPct: h?.humidityPct ?? null,
    soilMoisturePct: s?.soilMoisturePct ?? null,
  });

  const lower = userText.toLowerCase();
  const focus = match(lower)
    .with(P.string.includes("thirst"), () => summary.soil.message)
    .with(P.string.includes("water"), () => summary.soil.message)
    .with(P.string.includes("hot"), () => summary.temperature.message)
    .with(P.string.includes("cold"), () => summary.temperature.message)
    .with(P.string.includes("temp"), () => summary.temperature.message)
    .with(P.string.includes("humid"), () => summary.humidity.message)
    .with(P.string.includes("dry"), () => summary.humidity.message)
    .otherwise(() => summary.headline);

  return `${focus} (Tip: set ANTHROPIC_API_KEY in your .env file for real chat — this is a fallback reply.)`;
}

// --- Route ---

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body?.slug ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0
  ) {
    return NextResponse.json(
      { error: "Missing slug or messages" },
      { status: 400 },
    );
  }

  const plant = await getPlantBySlug(body.slug);
  if (!plant) {
    return NextResponse.json({ error: "Plant not found" }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const lastUser = [...body.messages].reverse().find((m) => m.role === "user");

  if (!apiKey) {
    const reply = await ruleBasedReply(plant, lastUser?.content ?? "");
    return NextResponse.json({ reply, toolCalls: [] });
  }

  const client = new Anthropic({ apiKey });

  // Conversation loop: model may emit tool_use blocks; we run them and feed
  // tool_result blocks back until it produces a plain-text answer. Cap the
  // number of round trips so a misbehaving model can't spin forever.
  const messages: Anthropic.Messages.MessageParam[] = body.messages.map(
    (m) => ({
      role: m.role,
      content: m.content,
    }),
  );

  const toolCalls: { name: ToolName; result: string }[] = [];
  const MAX_TOOL_ROUNDS = 4;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 512,
        system: systemPrompt(plant),
        tools: TOOLS,
        messages,
      });

      if (response.stop_reason !== "tool_use") {
        const text = response.content
          .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({
          reply: text || "(no reply)",
          toolCalls,
        });
      }

      // Echo the assistant turn (with its tool_use blocks) back into history
      // so the next request keeps the same conversation thread.
      messages.push({ role: "assistant", content: response.content });

      const toolUses = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
      );

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] =
        await Promise.all(
          toolUses.map(async (tu) => {
            const name = tu.name as ToolName;
            const result = await runTool(name, plant.id);
            toolCalls.push({ name, result });
            return {
              type: "tool_result",
              tool_use_id: tu.id,
              content: result,
            };
          }),
        );

      messages.push({ role: "user", content: toolResults });
    }

    return NextResponse.json({
      reply:
        "I couldn't reach a final answer in time — try asking again in a sec.",
      toolCalls,
    });
  } catch (err) {
    console.error("[/api/chat] anthropic error:", err);
    // Graceful degradation: give the user a real answer based on the latest
    // sensor numbers even if the LLM call failed (network / rate limit / etc.).
    const reply = await ruleBasedReply(plant, lastUser?.content ?? "");
    return NextResponse.json({
      reply,
      toolCalls,
      warning: "LLM unavailable, fell back to rule-based reply",
    });
  }
}
