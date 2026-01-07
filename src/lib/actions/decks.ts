"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCard(
  deckId: string,
  data: {
    frontText?: string;
    backText: string;
    position?: number;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Niet ingelogd");
  }

  // Verify deck ownership
  const { data: deck } = await supabase
    .from("decks")
    .select("id, user_id")
    .eq("id", deckId)
    .single();

  if (!deck || deck.user_id !== user.id) {
    throw new Error("Geen toegang tot deze leerset");
  }

  // Get next position if not specified
  let position = data.position;
  if (position === undefined) {
    const { data: lastCard } = await supabase
      .from("cards")
      .select("position")
      .eq("deck_id", deckId)
      .is("deleted_at", null)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    position = (lastCard?.position ?? -1) + 1;
  }

  const { data: card, error } = await supabase
    .from("cards")
    .insert({
      deck_id: deckId,
      front_text: data.frontText || null,
      back_text: data.backText,
      position,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating card:", error);
    throw new Error("Kon kaart niet aanmaken");
  }

  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);

  return { id: card.id };
}

export async function updateCard(
  cardId: string,
  data: {
    frontText?: string;
    backText?: string;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Niet ingelogd");
  }

  // Get card and verify ownership via deck
  const { data: card } = await supabase
    .from("cards")
    .select("id, deck_id")
    .eq("id", cardId)
    .single();

  if (!card) {
    throw new Error("Kaart niet gevonden");
  }

  const { data: deck } = await supabase
    .from("decks")
    .select("user_id")
    .eq("id", card.deck_id)
    .single();

  if (!deck || deck.user_id !== user.id) {
    throw new Error("Geen toegang tot deze kaart");
  }

  const { error } = await supabase
    .from("cards")
    .update({
      front_text: data.frontText,
      back_text: data.backText,
    })
    .eq("id", cardId);

  if (error) {
    console.error("Error updating card:", error);
    throw new Error("Kon kaart niet bijwerken");
  }

  revalidatePath(`/decks/${card.deck_id}`);
  revalidatePath(`/decks/${card.deck_id}/edit`);

  return { success: true };
}

export async function deleteCard(cardId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Niet ingelogd");
  }

  // Get card and verify ownership via deck
  const { data: card } = await supabase
    .from("cards")
    .select("id, deck_id")
    .eq("id", cardId)
    .single();

  if (!card) {
    throw new Error("Kaart niet gevonden");
  }

  const { data: deck } = await supabase
    .from("decks")
    .select("user_id")
    .eq("id", card.deck_id)
    .single();

  if (!deck || deck.user_id !== user.id) {
    throw new Error("Geen toegang tot deze kaart");
  }

  // Hard delete - CASCADE zal automatisch card_media verwijderen
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId);

  if (error) {
    console.error("Error deleting card:", error);
    throw new Error("Kon kaart niet verwijderen");
  }

  revalidatePath(`/decks/${card.deck_id}`);
  revalidatePath(`/decks/${card.deck_id}/edit`);

  return { success: true };
}

export async function updateDeck(
  deckId: string,
  data: {
    title?: string;
    description?: string;
    isPublic?: boolean;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Niet ingelogd");
  }

  // Verify deck ownership
  const { data: deck } = await supabase
    .from("decks")
    .select("id, user_id")
    .eq("id", deckId)
    .single();

  if (!deck || deck.user_id !== user.id) {
    throw new Error("Geen toegang tot deze leerset");
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.isPublic !== undefined) updateData.is_public = data.isPublic;

  const { error } = await supabase
    .from("decks")
    .update(updateData)
    .eq("id", deckId);

  if (error) {
    console.error("Error updating deck:", error);
    throw new Error("Kon leerset niet bijwerken");
  }

  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
  revalidatePath("/my-decks");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteDeck(deckId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Niet ingelogd");
  }

  // Verify deck ownership
  const { data: deck } = await supabase
    .from("decks")
    .select("id, user_id")
    .eq("id", deckId)
    .single();

  if (!deck || deck.user_id !== user.id) {
    throw new Error("Geen toegang tot deze leerset");
  }

  // Hard delete - CASCADE zal automatisch cards, card_media en user_progress verwijderen
  const { error } = await supabase
    .from("decks")
    .delete()
    .eq("id", deckId);

  if (error) {
    console.error("Error deleting deck:", error);
    throw new Error(`Kon leerset niet verwijderen: ${error.message} (${error.code})`);
  }

  revalidatePath("/my-decks");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function addCardMedia(
  cardId: string,
  data: {
    type: "image" | "audio";
    url: string;
    position: "front" | "back" | "both";
    displayOrder?: number;
    attributionName?: string;
    attributionUrl?: string;
    attributionSource?: string;
    license?: string;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Niet ingelogd");
  }

  // Get card and verify ownership via deck
  const { data: card } = await supabase
    .from("cards")
    .select("id, deck_id")
    .eq("id", cardId)
    .single();

  if (!card) {
    throw new Error("Kaart niet gevonden");
  }

  const { data: deck } = await supabase
    .from("decks")
    .select("user_id")
    .eq("id", card.deck_id)
    .single();

  if (!deck || deck.user_id !== user.id) {
    throw new Error("Geen toegang tot deze kaart");
  }

  // Get next display order if not specified
  let displayOrder = data.displayOrder;
  if (displayOrder === undefined) {
    const { data: lastMedia } = await supabase
      .from("card_media")
      .select("display_order")
      .eq("card_id", cardId)
      .eq("position", data.position)
      .order("display_order", { ascending: false })
      .limit(1)
      .single();

    displayOrder = (lastMedia?.display_order ?? -1) + 1;
  }

  const { data: media, error } = await supabase
    .from("card_media")
    .insert({
      card_id: cardId,
      type: data.type,
      url: data.url,
      position: data.position,
      display_order: displayOrder,
      attribution_name: data.attributionName || null,
      attribution_url: data.attributionUrl || null,
      attribution_source: data.attributionSource || null,
      license: data.license || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error adding card media:", error);
    throw new Error("Kon media niet toevoegen");
  }

  revalidatePath(`/decks/${card.deck_id}`);
  revalidatePath(`/decks/${card.deck_id}/edit`);

  return { id: media.id };
}

export async function deleteCardMedia(mediaId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Niet ingelogd");
  }

  // Get media and card
  const { data: media } = await supabase
    .from("card_media")
    .select("id, card_id")
    .eq("id", mediaId)
    .single();

  if (!media) {
    throw new Error("Media niet gevonden");
  }

  // Get card and verify ownership
  const { data: card } = await supabase
    .from("cards")
    .select("deck_id")
    .eq("id", media.card_id)
    .single();

  if (!card) {
    throw new Error("Kaart niet gevonden");
  }

  const { data: deck } = await supabase
    .from("decks")
    .select("user_id")
    .eq("id", card.deck_id)
    .single();

  if (!deck || deck.user_id !== user.id) {
    throw new Error("Geen toegang tot deze media");
  }

  const { error } = await supabase
    .from("card_media")
    .delete()
    .eq("id", mediaId);

  if (error) {
    console.error("Error deleting card media:", error);
    throw new Error("Kon media niet verwijderen");
  }

  revalidatePath(`/decks/${card.deck_id}`);
  revalidatePath(`/decks/${card.deck_id}/edit`);

  return { success: true };
}
