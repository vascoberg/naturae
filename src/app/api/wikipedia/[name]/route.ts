import { NextRequest, NextResponse } from "next/server";
import { getWikipediaSummary } from "@/lib/services/wikipedia";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const dutchName = request.nextUrl.searchParams.get("dutchName");

  if (!name) {
    return NextResponse.json(
      { error: "Name parameter is required" },
      { status: 400 }
    );
  }

  const summary = await getWikipediaSummary(
    decodeURIComponent(name),
    dutchName ? decodeURIComponent(dutchName) : null
  );

  if (!summary) {
    return NextResponse.json(
      { error: "No Wikipedia article found" },
      { status: 404 }
    );
  }

  return NextResponse.json(summary);
}
