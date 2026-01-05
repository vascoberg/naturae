import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deck, error } = await supabase
    .from("decks")
    .select("id, title, description, card_count, is_public, user_id")
    .eq("id", id)
    .single();

  if (error || !deck) {
    return NextResponse.json(
      { error: "Deck niet gevonden" },
      { status: 404 }
    );
  }

  return NextResponse.json(deck);
}
