import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/check-back-text
 * Check cards that have back_text different from their species common_names.nl
 */
export async function GET() {
  const supabase = await createClient();

  // Find cards where back_text differs from species common_names.nl
  const { data: cards, error } = await supabase
    .from("cards")
    .select(`
      id,
      back_text,
      species:species_id (
        id,
        scientific_name,
        common_names
      )
    `)
    .not("species_id", "is", null)
    .not("back_text", "is", null)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter to cards where back_text differs from species Dutch name
  const mismatches = cards?.filter((card) => {
    const species = Array.isArray(card.species) ? card.species[0] : card.species;
    if (!species) return false;
    const speciesName = (species.common_names as { nl?: string })?.nl;
    return card.back_text && speciesName &&
           card.back_text.toLowerCase() !== speciesName.toLowerCase();
  }).map((card) => {
    const species = Array.isArray(card.species) ? card.species[0] : card.species;
    return {
      card_id: card.id,
      back_text: card.back_text,
      species_name: (species?.common_names as { nl?: string })?.nl,
      scientific_name: species?.scientific_name,
    };
  });

  return NextResponse.json({
    total_cards_with_back_text: cards?.length || 0,
    mismatches: mismatches || [],
  });
}
