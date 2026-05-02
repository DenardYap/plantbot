import { NextResponse } from "next/server";
import { match } from "ts-pattern";
import {
  getPlantBySlug,
  getReadingHistory,
  type HistoryWindow,
} from "@/lib/plants";

export const dynamic = "force-dynamic";

const WINDOWS: readonly HistoryWindow[] = ["5m", "6h", "7d", "90d"] as const;

function parseWindow(raw: string | null): HistoryWindow {
  return match(raw)
    .with("5m", () => "5m" as const)
    .with("6h", () => "6h" as const)
    .with("7d", () => "7d" as const)
    .with("90d", () => "90d" as const)
    .otherwise(() => "6h" as const);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const window = parseWindow(url.searchParams.get("window"));

  try {
    const plant = await getPlantBySlug(slug);
    if (!plant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const readings = await getReadingHistory(plant.id, window);
    return NextResponse.json({ window, windows: WINDOWS, readings });
  } catch (err) {
    console.error(`[/api/plants/${slug}/readings] failed:`, err);
    return NextResponse.json(
      { error: "Failed to load readings" },
      { status: 500 },
    );
  }
}
