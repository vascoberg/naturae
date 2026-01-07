import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface DeckExport {
  version: "1.0";
  exported_at: string;
  deck: {
    title: string;
    description: string | null;
    is_public: boolean;
  };
  cards: Array<{
    front_text: string | null;
    back_text: string;
    position: number;
    media: Array<{
      type: string;
      url: string;
      position: string;
      attribution_name: string | null;
      attribution_url: string | null;
      attribution_source: string | null;
    }>;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Haal deck op
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select("id, title, description, is_public, user_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (deckError || !deck) {
      return NextResponse.json(
        { error: "Deck niet gevonden" },
        { status: 404 }
      );
    }

    // Check toegang: eigen deck of publiek deck
    if (deck.user_id !== user?.id && !deck.is_public) {
      return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
    }

    // Haal kaarten op met media
    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select(
        `
        front_text,
        back_text,
        position,
        card_media (
          type,
          url,
          position,
          attribution_name,
          attribution_url,
          attribution_source
        )
      `
      )
      .eq("deck_id", id)
      .is("deleted_at", null)
      .order("position", { ascending: true });

    if (cardsError) {
      console.error("Export cards error:", cardsError);
      return NextResponse.json(
        { error: "Kon kaarten niet ophalen" },
        { status: 500 }
      );
    }

    // Bouw export object
    const exportData: DeckExport = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      deck: {
        title: deck.title,
        description: deck.description,
        is_public: deck.is_public,
      },
      cards:
        cards?.map((card) => ({
          front_text: card.front_text,
          back_text: card.back_text,
          position: card.position,
          media: Array.isArray(card.card_media)
            ? card.card_media.map(
                (m: {
                  type: string;
                  url: string;
                  position: string;
                  attribution_name: string | null;
                  attribution_url: string | null;
                  attribution_source: string | null;
                }) => ({
                  type: m.type,
                  url: m.url,
                  position: m.position,
                  attribution_name: m.attribution_name,
                  attribution_url: m.attribution_url,
                  attribution_source: m.attribution_source,
                })
              )
            : [],
        })) || [],
    };

    // Return JSON met download headers
    const filename = `${deck.title.replace(/[^a-zA-Z0-9]/g, "-")}-export.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het exporteren" },
      { status: 500 }
    );
  }
}
