import { NextResponse } from "next/server";
import { fixDutchNames, refreshDutchNamesFromGBIF } from "@/lib/actions/species";

/**
 * POST /api/admin/fix-dutch-names
 * Fixes Dutch names for existing species using improved GBIF name selection
 *
 * Query params:
 * - refresh=true: Fetch fresh vernacular names from GBIF API (slower but more accurate)
 *
 * This is a one-time migration endpoint - can be removed after running
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    const result = refresh
      ? await refreshDutchNamesFromGBIF()
      : await fixDutchNames();

    return NextResponse.json({
      success: true,
      message: `Updated ${result.updated} of ${result.checked} species`,
      method: refresh ? "refresh from GBIF" : "from stored data",
      ...result,
    });
  } catch (error) {
    console.error("Error fixing Dutch names:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fix Dutch names" },
      { status: 500 }
    );
  }
}
