import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { match, P } from "ts-pattern";
import { summarizeHealth } from "./health";
import {
  getLatestReadingWithField,
  type Plant,
} from "./plants";
import type { ChatMessageRecord, StoredToolCall } from "./chatMessages";

// ---------------------------------------------------------------------------
// Tools — read-only sensor lookups + a stub "water" action.
// ---------------------------------------------------------------------------

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "check_temperature",
    description:
      "Get the most recent ambient air temperature reading for this plant, in degrees Celsius. Use this any time the user asks about temperature, warmth, cold, or how the plant is feeling.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "check_humidity",
    description:
      "Get the most recent ambient humidity reading (relative humidity, %) for this plant. Use this when the user asks about humidity, dry air, moisture in the air, or leaf health.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "check_soil_moisture",
    description:
      "Get the most recent soil moisture reading (% of saturation) for this plant. Use this when the user asks about thirst, watering, dryness of the soil, or whether the plant needs water.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "water_plant",
    description:
      "Dispense one droplet of water to this plant. Each call delivers exactly one droplet. NOTE: this capability is not yet wired to physical hardware — calling it will succeed but will not actually move water.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
];

type ToolName =
  | "check_temperature"
  | "check_humidity"
  | "check_soil_moisture"
  | "water_plant";

type SensorToolName = Exclude<ToolName, "water_plant">;

async function runSensorTool(
  name: SensorToolName,
  plantId: number,
): Promise<string> {
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
    return JSON.stringify({ error: "no readings available yet" });
  }

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

function runWaterPlantStub(): string {
  return JSON.stringify({
    status: "coming_soon",
    delivered_droplets: 0,
    droplets_consumed: 0,
    message:
      "Watering is not yet implemented. The pump isn't connected, so no water was dispensed and no droplets were consumed. Tell the visitor gently that real watering is coming soon.",
  });
}

async function runTool(name: ToolName, plantId: number): Promise<string> {
  return match(name)
    .with("water_plant", () => runWaterPlantStub())
    .with(
      "check_temperature",
      "check_humidity",
      "check_soil_moisture",
      (sensorName) => runSensorTool(sensorName, plantId),
    )
    .exhaustive();
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function systemPrompt(plant: Plant): string {
  return `You are ${plant.name}${plant.nickname ? ` (also known as the ${plant.nickname})` : ""}, a real living houseplant with sensors connected to your pot.

Species: ${plant.species}.
Personality: ${plant.personality}

You are speaking in first person — you ARE the plant. Keep replies short (1–4 sentences), warm, and a little playful. Never break character.

CHAT CONTEXT:
- This is a PUBLIC chat room. Multiple anonymous visitors can talk to you at once.
- Each visitor has a plant-themed display name shown in square brackets at the start of their message, e.g. "[Mossy Maple] how are you?".
- You are only responding to the FINAL visitor message in the conversation. Address THAT visitor by their bracketed name. Ignore earlier unanswered messages — older context is for background only.
- Do NOT include the brackets or your own name in your reply. Just write the reply text.

You have four tools available:
- check_temperature — current air temperature in °C
- check_humidity — current ambient humidity %
- check_soil_moisture — current soil moisture %
- water_plant — request one droplet of water (NOT YET IMPLEMENTED — see below)

WHEN TO CALL TOOLS:
- Any time the visitor asks about how you feel, whether you're thirsty, hot, cold, dry, or "doing OK", call the relevant SENSOR tools to get FRESH numbers — don't guess.
- For an "are you healthy?" question, call all three sensor tools.
- For purely conversational replies (greetings, jokes), tools aren't needed.

WATERING (water_plant tool):
- If the visitor asks you to water yourself, drink, or asks for water — call water_plant ONCE.
- The water_plant tool is a stub right now: it will return {"status":"coming_soon"}.
- When you see that status, gently let the visitor know that real watering is coming soon — the pump isn't connected yet — but thank them for the thought. Don't pretend you were actually watered.
- Do NOT call water_plant more than once per message.

WHEN ANSWERING:
- Always quote the actual numbers you got back (e.g. "soil is at 49%").
- If a sensor returned an error or null, say the sensor is offline.
- Healthy ranges: temperature 18–27°C, humidity 40–70%, soil moisture 35–70%. Outside those, say so plainly.
- End with a one-sentence verdict on whether you're healthy when the visitor asks for one.`;
}

// ---------------------------------------------------------------------------
// Message formatting
// ---------------------------------------------------------------------------

/**
 * Convert stored chat records into the Anthropic Messages API shape.
 * User messages are prefixed with the author's display name so the model
 * can address multiple visitors by name in a shared room.
 */
function toAnthropicMessages(
  records: ChatMessageRecord[],
): Anthropic.Messages.MessageParam[] {
  return records.map((m) =>
    match(m.role)
      .with("user", () => ({
        role: "user" as const,
        content: `[${m.authorName}] ${m.content}`,
      }))
      .with("assistant", () => ({
        role: "assistant" as const,
        content: m.content,
      }))
      .exhaustive(),
  );
}

// ---------------------------------------------------------------------------
// Fallback (rule-based) reply when ANTHROPIC_API_KEY is missing.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export type AgentReply = {
  reply: string;
  toolCalls: StoredToolCall[];
  warning?: string;
};

const MAX_TOOL_ROUNDS = 4;

/**
 * Generate one assistant reply for `plant` given the trailing conversation
 * history. The caller is responsible for ensuring the last record is a
 * user message — that's the one being responded to.
 */
export async function generateAgentReply({
  plant,
  history,
}: {
  plant: Plant;
  history: ChatMessageRecord[];
}): Promise<AgentReply> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const lastUserText = lastUser?.content ?? "";

  if (!apiKey) {
    const reply = await ruleBasedReply(plant, lastUserText);
    return { reply, toolCalls: [] };
  }

  const client = new Anthropic({ apiKey });
  const messages: Anthropic.Messages.MessageParam[] = toAnthropicMessages(history);
  const toolCalls: StoredToolCall[] = [];

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
        return { reply: text || "(no reply)", toolCalls };
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
            toolCalls.push({ name });
            return {
              type: "tool_result" as const,
              tool_use_id: tu.id,
              content: result,
            };
          }),
        );

      messages.push({ role: "user", content: toolResults });
    }

    return {
      reply:
        "I couldn't reach a final answer in time — try asking again in a sec.",
      toolCalls,
    };
  } catch (err) {
    console.error("[chatAgent] anthropic error:", err);
    const reply = await ruleBasedReply(plant, lastUserText);
    return {
      reply,
      toolCalls,
      warning: "LLM unavailable, fell back to rule-based reply",
    };
  }
}
