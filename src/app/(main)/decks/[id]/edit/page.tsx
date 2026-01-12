import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeckEditor } from "@/components/deck/deck-editor";
import { getDeckTags } from "@/lib/actions/tags";

interface EditDeckPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDeckPage({ params }: EditDeckPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Haal deck op
  const { data: deck, error } = await supabase
    .from("decks")
    .select("id, title, description, is_public, user_id")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !deck) {
    notFound();
  }

  // Check ownership
  if (deck.user_id !== user.id) {
    notFound();
  }

  // Haal tags op
  const { data: deckTags } = await getDeckTags(id);

  // Haal kaarten op met species data
  const { data: cards } = await supabase
    .from("cards")
    .select(
      `
      id,
      front_text,
      back_text,
      position,
      species_id,
      species_display,
      species:species_id (
        id,
        scientific_name,
        canonical_name,
        common_names
      ),
      card_media (
        id,
        type,
        url,
        position,
        display_order,
        attribution_name,
        attribution_source,
        license,
        annotated_url
      )
    `
    )
    .eq("deck_id", id)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/decks/${id}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Terug naar leerset
        </Link>
      </div>

      <DeckEditor
        deck={{
          id: deck.id,
          title: deck.title,
          description: deck.description || "",
          isPublic: deck.is_public,
        }}
        initialTags={deckTags || []}
        cards={
          cards?.map((card) => {
            // Supabase returns species as array or object depending on query type
            const speciesData = Array.isArray(card.species) ? card.species[0] : card.species;
            return {
              id: card.id,
              frontText: card.front_text || "",
              backText: card.back_text || "",
              position: card.position,
              speciesId: card.species_id || null,
              speciesDisplay: (card.species_display as "front" | "back" | "both" | "none") || "back",
              species: speciesData ? {
                id: speciesData.id,
                scientificName: speciesData.scientific_name,
                canonicalName: speciesData.canonical_name,
                commonNames: speciesData.common_names as { nl?: string },
              } : null,
              media:
                card.card_media?.map((m) => ({
                  id: m.id,
                  type: m.type as "image" | "audio",
                  url: m.url,
                  position: m.position as "front" | "back",
                  displayOrder: m.display_order,
                  attributionName: m.attribution_name,
                  attributionSource: m.attribution_source,
                  license: m.license,
                  annotatedUrl: m.annotated_url,
                })) || [],
            };
          }) || []
        }
      />
    </div>
  );
}
