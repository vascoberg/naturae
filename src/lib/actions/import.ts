"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ImportResult } from "@/lib/import/types";

export async function createDeckWithCards(
  title: string,
  description: string | null,
  cards: ImportResult[]
): Promise<{ deckId: string } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Niet ingelogd" };
  }

  try {
    // Create the deck
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .insert({
        title,
        description,
        user_id: user.id,
        is_public: false,
        card_count: cards.length,
      })
      .select("id")
      .single();

    if (deckError) {
      console.error("Error creating deck:", deckError);
      return { error: "Kon leerset niet aanmaken" };
    }

    // Add cards to deck
    const result = await addCardsToDeck(deck.id, cards);
    if ("error" in result) {
      // Clean up deck on failure
      await supabase.from("decks").delete().eq("id", deck.id);
      return result;
    }

    revalidatePath("/my-decks");
    revalidatePath("/dashboard");

    return { deckId: deck.id };
  } catch (error) {
    console.error("Import error:", error);
    return { error: "Er ging iets mis bij het importeren" };
  }
}

export async function addCardsToDeck(
  deckId: string,
  cards: ImportResult[]
): Promise<{ success: true; addedCount: number } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Niet ingelogd" };
  }

  // Verify deck ownership
  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id, user_id, card_count")
    .eq("id", deckId)
    .is("deleted_at", null)
    .single();

  if (deckError || !deck) {
    return { error: "Leerset niet gevonden" };
  }

  if (deck.user_id !== user.id) {
    return { error: "Je hebt geen toegang tot deze leerset" };
  }

  try {
    // Get current highest position
    const { data: existingCards } = await supabase
      .from("cards")
      .select("position")
      .eq("deck_id", deckId)
      .is("deleted_at", null)
      .order("position", { ascending: false })
      .limit(1);

    const startPosition = existingCards?.[0]?.position ?? 0;

    // Create all cards with species koppeling
    const cardsToInsert = cards.map((card, index) => ({
      deck_id: deckId,
      front_text: card.frontText || null,
      back_text: card.backText || null,
      position: startPosition + card.position + index,
      species_id: card.speciesId || null,
      species_display: card.speciesId ? "back" : null,
    }));

    const { data: insertedCards, error: cardsError } = await supabase
      .from("cards")
      .insert(cardsToInsert)
      .select("id, position");

    if (cardsError) {
      console.error("Error creating cards:", cardsError);
      return { error: "Kon kaarten niet aanmaken" };
    }

    // Create card_media entries
    const mediaToInsert: Array<{
      card_id: string;
      type: "audio" | "image";
      url: string;
      position: "front" | "back" | "both";
      display_order: number;
      attribution_name: string | null;
      attribution_url: string | null;
      attribution_source: string | null;
    }> = [];

    // Map position to card ID
    const positionToCardId = new Map<number, string>();
    for (const card of insertedCards) {
      positionToCardId.set(card.position, card.id);
    }

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const insertedCard = insertedCards[i];
      if (!insertedCard) continue;

      let displayOrder = 0;

      // Front image
      if (card.frontImageUrl) {
        mediaToInsert.push({
          card_id: insertedCard.id,
          type: "image",
          url: card.frontImageUrl,
          position: "front",
          display_order: displayOrder++,
          attribution_name: card.artist,
          attribution_url: card.sourceUrl,
          attribution_source: card.copyright,
        });
      }

      // Back image
      if (card.backImageUrl) {
        mediaToInsert.push({
          card_id: insertedCard.id,
          type: "image",
          url: card.backImageUrl,
          position: "back",
          display_order: displayOrder++,
          attribution_name: card.artist,
          attribution_url: card.sourceUrl,
          attribution_source: card.copyright,
        });
      }

      // Audio media (always on front for now)
      if (card.audioUrl) {
        mediaToInsert.push({
          card_id: insertedCard.id,
          type: "audio",
          url: card.audioUrl,
          position: "front",
          display_order: displayOrder++,
          attribution_name: card.artist,
          attribution_url: card.sourceUrl,
          attribution_source: card.copyright,
        });
      }
    }

    if (mediaToInsert.length > 0) {
      const { error: mediaError } = await supabase
        .from("card_media")
        .insert(mediaToInsert);

      if (mediaError) {
        console.error("Error creating card media:", mediaError);
        // Don't fail the whole import for media errors
      }
    }

    // Update deck card_count
    const newCardCount = (deck.card_count || 0) + cards.length;
    await supabase
      .from("decks")
      .update({ card_count: newCardCount, updated_at: new Date().toISOString() })
      .eq("id", deckId);

    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
    revalidatePath("/my-decks");

    return { success: true, addedCount: cards.length };
  } catch (error) {
    console.error("Import error:", error);
    return { error: "Er ging iets mis bij het importeren" };
  }
}

export async function getStorageUploadUrl(
  bucket: string,
  path: string
): Promise<{ signedUrl: string; publicUrl: string } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Niet ingelogd" };
  }

  // Create a signed URL for upload
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) {
    console.error("Error creating upload URL:", error);
    return { error: "Kon upload URL niet aanmaken" };
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return {
    signedUrl: data.signedUrl,
    publicUrl: publicUrlData.publicUrl,
  };
}
