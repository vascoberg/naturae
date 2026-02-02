import { NextRequest, NextResponse } from "next/server";
import { searchXenoCantoBySpecies } from "@/lib/services/xeno-canto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const scientificName = searchParams.get("scientificName");
  const limit = searchParams.get("limit");
  const quality = searchParams.get("quality") as "A" | "B" | "C" | "D" | "E" | null;
  const type = searchParams.get("type") as "song" | "call" | "alarm call" | "flight call" | null;
  const country = searchParams.get("country");

  if (!scientificName) {
    return NextResponse.json(
      { error: "scientificName is required" },
      { status: 400 }
    );
  }

  try {
    const result = await searchXenoCantoBySpecies(scientificName, {
      limit: limit ? parseInt(limit, 10) : 12,
      quality: quality || "B", // Default minimum quality B
      type: type || undefined,
      country: country || undefined,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recordings: result.data,
      total: result.total,
      hasMore: result.data.length < result.total,
    });
  } catch (error) {
    console.error("Error fetching Xeno-canto audio:", error);
    return NextResponse.json(
      { error: "Failed to fetch audio recordings" },
      { status: 500 }
    );
  }
}
