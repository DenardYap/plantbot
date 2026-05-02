import { NextResponse } from "next/server";
import { listPlants } from "@/lib/plants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plants = await listPlants();
    return NextResponse.json({ plants });
  } catch (err) {
    console.error("[/api/plants] failed:", err);
    return NextResponse.json(
      { error: "Failed to load plants" },
      { status: 500 },
    );
  }
}
