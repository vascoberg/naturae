import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/test-update
 * Test direct species update (using admin client to bypass RLS)
 */
export async function POST() {
  const supabase = createAdminClient();

  // Find Prunella modularis
  const { data: species, error: findError } = await supabase
    .from("species")
    .select("id, scientific_name, common_names")
    .ilike("scientific_name", "%Prunella modularis%")
    .neq("scientific_name", "Prunella modularis modularis")
    .single();

  if (findError || !species) {
    return NextResponse.json({ error: "Species not found", findError }, { status: 404 });
  }

  // Try to update
  const { data: updated, error: updateError } = await supabase
    .from("species")
    .update({
      common_names: {
        ...(species.common_names as Record<string, string>),
        nl: "Heggenmus",
      },
    })
    .eq("id", species.id)
    .select("id, common_names");

  if (updateError) {
    return NextResponse.json({
      error: "Update failed",
      updateError,
      species_id: species.id,
    }, { status: 500 });
  }

  // Verify the update
  const { data: verified } = await supabase
    .from("species")
    .select("id, common_names")
    .eq("id", species.id)
    .single();

  return NextResponse.json({
    success: true,
    before: species.common_names,
    updateResult: updated,
    after: verified?.common_names,
  });
}
