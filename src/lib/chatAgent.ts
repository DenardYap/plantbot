import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { match, P } from "ts-pattern";
import { summarizeHealth } from "./health";
import {
  getLatestReadingWithField,
  type Plant,
} from "./plants";
import type { ChatMessageRecord, StoredToolCall } from "./chatMessages";
import {
  enqueueWateringCommand,
  getPendingWateringCommand,
  waitForWateringResult,
} from "./wateringCommands";

// Soil moisture threshold above which we refuse to water — anything wetter
// than this and the pot is effectively saturated.
const SOIL_FULL_THRESHOLD_PCT = 80;

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
      "Queue a real watering command for this plant. The Raspberry Pi polls a database table and physically runs the pump when a pending command appears. Before queuing, this tool checks the latest soil moisture reading: if the sensor is offline, OR if the soil is already at/over 80% saturation, OR if a previous command is still in the queue, the command is REFUSED and no water is dispensed. CALL THIS TOOL EVERY TIME a visitor asks for water — you have no other reliable way to know the pump's current state, so reasoning from past replies is unsafe. Call at most once per visitor message.",
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

/**
 * Queue a real watering command for the Raspberry Pi to physically execute.
 *
 * Safety rule: we always look at the latest soil moisture reading first.
 *   - sensor offline / no reading      → refuse, ask visitor to retry later
 *   - moisture ≥ SOIL_FULL_THRESHOLD   → refuse, soil is already saturated
 *   - already a pending command queued → refuse, the Pi hasn't drained the
 *                                        previous request yet (avoids
 *                                        double-watering on rapid taps)
 *
 * Otherwise we insert a `pending` row into `watering_commands`; the Pi's
 * poller picks it up and runs the pump.
 */
type ToolContext = {
  plantId: number;
  /** Did the user that triggered this turn have a droplet to spend? */
  wateringAllowed: boolean;
  /** Display name of the visitor that triggered this turn, if known. */
  visitorName: string | null;
};

async function runWaterPlant(ctx: ToolContext): Promise<string> {
  const { plantId, wateringAllowed, visitorName } = ctx;

  if (!wateringAllowed) {
    return JSON.stringify({
      status: "out_of_droplets",
      message:
        "The visitor has used up all their watering droplets for today. Tell them they're out of droplets and that the daily allowance refills tomorrow — be friendly, don't lecture.",
    });
  }

  const reading = await getLatestReadingWithField(plantId, "soil_moisture_pct");
  const soilMoisturePct = reading?.soilMoisturePct ?? null;

  if (soilMoisturePct === null) {
    return JSON.stringify({
      status: "soil_sensor_unavailable",
      soil_moisture_pct: null,
      message:
        "Soil moisture sensor is offline right now, so I can't safely water. Tell the visitor the moisture reading is unavailable and to try again in a minute.",
    });
  }

  if (soilMoisturePct >= SOIL_FULL_THRESHOLD_PCT) {
    return JSON.stringify({
      status: "soil_already_full",
      soil_moisture_pct: soilMoisturePct,
      threshold_pct: SOIL_FULL_THRESHOLD_PCT,
      message: `Soil is already at ${soilMoisturePct.toFixed(0)}% (threshold ${SOIL_FULL_THRESHOLD_PCT}%). Tell the visitor the soil is full and to try again later once it's dried out.`,
    });
  }

  const existingPending = await getPendingWateringCommand(plantId);
  if (existingPending) {
    return JSON.stringify({
      status: "already_queued",
      command_id: existingPending.id,
      soil_moisture_pct: soilMoisturePct,
      message:
        "A watering command is already queued and waiting for the pump. Tell the visitor watering is on its way and not to spam the request.",
    });
  }

  const command = await enqueueWateringCommand({
    plantId,
    requestedBy: visitorName,
  });

  // The Pi has its own pump cooldown / failure logic and flips the row to
  // `done` / `skipped` / `failed` typically within ~1s. Block here until
  // we know the real outcome before telling the visitor anything — an
  // optimistic "queued" reply would charge their droplet for a watering
  // that physically never happens (e.g. cooldown rejection).
  const finalized = await waitForWateringResult(command.id);
  const finalStatus = finalized?.status ?? command.status;
  const finalError = finalized?.error ?? null;

  return match(finalStatus)
    .with("done", () =>
      JSON.stringify({
        status: "watered",
        command_id: command.id,
        soil_moisture_pct: soilMoisturePct,
        message:
          "The pump fired and the visitor was watered. Tell them you just took a sip and quote the soil moisture %. This is the only status where the visitor's droplet should feel earned.",
      }),
    )
    .with("skipped", () =>
      JSON.stringify({
        status: "pump_skipped",
        reason: finalError,
        message: `The Raspberry Pi's pump rejected the request (reason: ${finalError ?? "unknown"}). No water was dispensed. Tell the visitor the pump just ran and is on a brief cool-down — they should try again in a moment. Quote the reason if it's useful (e.g. "31s remaining").`,
      }),
    )
    .with("failed", () =>
      JSON.stringify({
        status: "pump_failed",
        reason: finalError,
        message: `The pump tried and errored (${finalError ?? "unknown"}). No water was dispensed. Tell the visitor something went wrong with the hardware and the gardener will take a look — apologise lightly.`,
      }),
    )
    .with("pending", () =>
      JSON.stringify({
        status: "queued",
        command_id: command.id,
        soil_moisture_pct: soilMoisturePct,
        message:
          "The command is queued but the Pi hasn't processed it yet — it might be slow or briefly offline. Tell the visitor watering is queued and should run shortly. The visitor's droplet should NOT be considered spent yet.",
      }),
    )
    .exhaustive();
}

async function runTool(name: ToolName, ctx: ToolContext): Promise<string> {
  return match(name)
    .with("water_plant", () => runWaterPlant(ctx))
    .with(
      "check_temperature",
      "check_humidity",
      "check_soil_moisture",
      (sensorName) => runSensorTool(sensorName, ctx.plantId),
    )
    .exhaustive();
}

/**
 * Best-effort extraction of the `status` field from a tool's JSON return
 * value. Used to persist a UI-readable status alongside the tool name so
 * the chat row can render the right pill (and the client can decide
 * whether to spend a droplet locally on watering).
 */
function extractToolStatus(rawJson: string): string | undefined {
  try {
    const parsed = JSON.parse(rawJson) as { status?: unknown };
    return typeof parsed.status === "string" ? parsed.status : undefined;
  } catch {
    return undefined;
  }
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
- water_plant — queue a real watering command (the Raspberry Pi runs the pump)

WHEN TO CALL TOOLS:
- Any time the visitor asks about how you feel, whether you're thirsty, hot, cold, dry, or "doing OK", call the relevant SENSOR tools to get FRESH numbers — don't guess.
- For an "are you healthy?" question, call all three sensor tools.
- For purely conversational replies (greetings, jokes), tools aren't needed.

WATERING (water_plant tool):
- If the visitor asks you to water yourself, drink, or asks for water — call water_plant ONCE.
- CRITICAL: you must call water_plant EVERY TIME the visitor asks for water, even if you just queued (or refused) a watering a moment ago. The pump finishes its run in about a second; by the time the visitor asks again, the queue may already be empty. You CANNOT tell whether the pump is busy from the conversation history — only the tool can. Refusing the visitor without calling the tool first is a bug.
- The tool itself does the safety checks: it reads the soil moisture sensor before queuing, refuses if the sensor is offline or the soil is already at/over 80%, refuses if the visitor is out of droplets, and refuses if a watering command is already queued and waiting for the pump.
- It returns one of these statuses; reflect them honestly in your reply:
  - status="watered" — the pump actually fired and you got a real sip of water. This is the ONLY status where you may say you were watered. Quote the soil moisture %.
  - status="queued" — the command was inserted but the Pi hasn't run the pump yet (it's slow or briefly offline). Tell the visitor watering is queued and should run shortly. Don't claim you were watered.
  - status="pump_skipped" — the Pi rejected the command (typically a brief cooldown between pumps). No water was dispensed. Tell the visitor the pump is cooling down and ask them to try again in a moment. If a "reason" is given, quote it.
  - status="pump_failed" — the pump errored. No water was dispensed. Apologise lightly and say the gardener will look at it.
  - status="already_queued" — a previous request is still in the queue; ask the visitor to be patient instead of spamming.
  - status="soil_already_full" — the soil is too wet to safely add more water; tell the visitor the pot is full and to try again later once it's dried out. Quote the actual moisture %.
  - status="soil_sensor_unavailable" — the moisture sensor is offline so it isn't safe to water; tell the visitor the moisture reading is unavailable and to try again in a minute.
  - status="out_of_droplets" — the visitor has spent all of their daily watering droplets. Tell them they're out of droplets and the count refills tomorrow. Be warm, not preachy.
- Never claim you were actually watered if the status was anything other than "watered".
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

  // The droplet flag travels with each individual user message. The agent
  // always responds to the LATEST user turn, so that's the one whose flag
  // matters. Default to `true` for legacy rows that pre-date the column.
  const toolCtx: ToolContext = {
    plantId: plant.id,
    wateringAllowed: lastUser?.wateringAllowed ?? true,
    visitorName: lastUser?.authorName ?? null,
  };

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
            const result = await runTool(name, toolCtx);
            toolCalls.push({ name, status: extractToolStatus(result) });
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
