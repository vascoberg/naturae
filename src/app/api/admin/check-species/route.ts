import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic"; // Disable caching

/**
 * GET /api/admin/check-species?name=Prunella
 * Check species data directly (no caching)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") || "Prunella";

  const supabase = await createClient();

  const { data: species, error } = await supabase
    .from("species")
    .select("id, scientific_name, canonical_name, common_names")
    .ilike("scientific_name", `%${name}%`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ species, timestamp: new Date().toISOString() });
}
