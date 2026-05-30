import { NextResponse } from "next/server";
import { getPlantBySlug } from "@/lib/plants";
import {
  listRecentWateringCommands,
  type WateringCommand,
} from "@/lib/wateringCommands";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Wire type — kept parallel to src/lib/api/types.ts so the client never
// imports server-only modules.
// ---------------------------------------------------------------------------

export type WateringCommandDTO = {
  id: number;
  status: WateringCommand["status"];
  source: string;
  requestedBy: string | null;
  durationMs: number;
  createdAt: string;
  executedAt: string | null;
  error: string | null;
};

function toDTO(c: WateringCommand): WateringCommandDTO {
  return {
    id: c.id,
    status: c.status,
    source: c.source,
    requestedBy: c.requestedBy,
    durationMs: c.durationMs,
    createdAt: c.createdAt,
    executedAt: c.executedAt,
    error: c.error,
  };
}

const DEFAULT_LIMIT = 20;

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_LIMIT;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const limit = parseLimit(url.searchParams.get("limit"));

  try {
    const plant = await getPlantBySlug(slug);
    if (!plant) {
      return NextResponse.json({ error: "Plant not found" }, { status: 404 });
    }
    const waterings = await listRecentWateringCommands(plant.id, limit);
    return NextResponse.json({ waterings: waterings.map(toDTO) });
  } catch (err) {
    console.error(`[/api/plants/${slug}/waterings] failed:`, err);
    return NextResponse.json(
      { error: "Failed to load watering history" },
      { status: 500 },
    );
  }
}
