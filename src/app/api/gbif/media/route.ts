import { NextRequest, NextResponse } from "next/server";
import { getSpeciesMediaList } from "@/lib/services/gbif-media";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gbifKey = searchParams.get("gbifKey");
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  if (!gbifKey) {
    return NextResponse.json(
      { error: "gbifKey is required" },
      { status: 400 }
    );
  }

  const gbifKeyNum = parseInt(gbifKey, 10);
  if (isNaN(gbifKeyNum)) {
    return NextResponse.json(
      { error: "gbifKey must be a number" },
      { status: 400 }
    );
  }

  try {
    const result = await getSpeciesMediaList({
      gbifKey: gbifKeyNum,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching GBIF media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}
