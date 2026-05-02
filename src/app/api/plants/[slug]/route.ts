import { NextResponse } from "next/server";
import {
  getLatestReading,
  getLatestReadingWithField,
  getPlantBySlug,
} from "@/lib/plants";
import { summarizeHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  try {
    const plant = await getPlantBySlug(slug);
    if (!plant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // The DHT22 occasionally fails a single read, leaving temp/humidity null
    // even when soil moisture is fine. Backfill each metric with the most
    // recent non-null reading so the dashboard never looks "empty" when
    // a single bad row is at the head of the queue.
    const [latest, latestTemp, latestHumidity, latestSoil] = await Promise.all([
      getLatestReading(plant.id),
      getLatestReadingWithField(plant.id, "temperature_c"),
      getLatestReadingWithField(plant.id, "humidity_pct"),
      getLatestReadingWithField(plant.id, "soil_moisture_pct"),
    ]);

    const current = {
      temperatureC: latestTemp?.temperatureC ?? null,
      humidityPct: latestHumidity?.humidityPct ?? null,
      soilMoisturePct: latestSoil?.soilMoisturePct ?? null,
    };

    return NextResponse.json({
      plant,
      latest, // most-recent row exactly as written, may have nulls
      current, // each field backfilled from latest non-null read
      health: summarizeHealth(current),
    });
  } catch (err) {
    console.error(`[/api/plants/${slug}] failed:`, err);
    return NextResponse.json(
      { error: "Failed to load plant" },
      { status: 500 },
    );
  }
}
