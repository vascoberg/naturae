"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Tag {
  id: string;
  slug: string;
  names: { nl: string; en?: string };
  type: string;
  usage_count: number;
}

/**
 * Haal alle beschikbare tags op
 */
export async function getAllTags(): Promise<{ data: Tag[] | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, names, type, usage_count")
    .order("usage_count", { ascending: false })
    .order("slug", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Tag[], error: null };
}

/**
 * Haal tags op voor een specifieke deck
 */
export async function getDeckTags(deckId: string): Promise<{ data: Tag[] | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deck_tags")
    .select(`
      tag_id,
      tags (
        id,
        slug,
        names,
        type,
        usage_count
      )
    `)
    .eq("deck_id", deckId);

  if (error) {
    return { data: null, error: error.message };
  }

  // Flatten de response
  const tags = data?.map((dt) => dt.tags as unknown as Tag).filter(Boolean) || [];
  return { data: tags, error: null };
}

/**
 * Voeg een tag toe aan een deck
 */
export async function addTagToDeck(
  deckId: string,
  tagId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Je moet ingelogd zijn" };
  }

  // Voeg tag toe aan deck
  const { error: insertError } = await supabase.from("deck_tags").insert({
    deck_id: deckId,
    tag_id: tagId,
    added_by: user.id,
  });

  if (insertError) {
    // Duplicate key error negeren (tag al toegevoegd)
    if (insertError.code === "23505") {
      return { success: true, error: null };
    }
    return { success: false, error: insertError.message };
  }

  // Update usage_count van de tag
  await supabase.rpc("increment_tag_usage", { tag_id_param: tagId });

  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);

  return { success: true, error: null };
}

/**
 * Verwijder een tag van een deck
 */
export async function removeTagFromDeck(
  deckId: string,
  tagId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Je moet ingelogd zijn" };
  }

  const { error } = await supabase
    .from("deck_tags")
    .delete()
    .eq("deck_id", deckId)
    .eq("tag_id", tagId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Decrement usage_count van de tag
  await supabase.rpc("decrement_tag_usage", { tag_id_param: tagId });

  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);

  return { success: true, error: null };
}

/**
 * Zoek tags op naam (voor autocomplete)
 */
export async function searchTags(query: string): Promise<{ data: Tag[] | null; error: string | null }> {
  const supabase = await createClient();

  // Zoek in de JSONB names kolom
  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, names, type, usage_count")
    .or(`slug.ilike.%${query}%,names->nl.ilike.%${query}%`)
    .order("usage_count", { ascending: false })
    .limit(10);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Tag[], error: null };
}

/**
 * Haal tags op gefilterd op type
 */
export async function getTagsByType(type: string): Promise<{ data: Tag[] | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, names, type, usage_count")
    .eq("type", type)
    .order("usage_count", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Tag[], error: null };
}

/**
 * Update tags voor een deck (vervang alle tags)
 */
export async function updateDeckTags(
  deckId: string,
  tagIds: string[]
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Je moet ingelogd zijn" };
  }

  // Haal huidige tags op
  const { data: currentTags } = await supabase
    .from("deck_tags")
    .select("tag_id")
    .eq("deck_id", deckId);

  const currentTagIds = currentTags?.map((t) => t.tag_id) || [];

  // Bepaal welke tags toegevoegd en verwijderd moeten worden
  const toAdd = tagIds.filter((id) => !currentTagIds.includes(id));
  const toRemove = currentTagIds.filter((id) => !tagIds.includes(id));

  // Verwijder oude tags
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("deck_tags")
      .delete()
      .eq("deck_id", deckId)
      .in("tag_id", toRemove);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Decrement usage counts
    for (const tagId of toRemove) {
      await supabase.rpc("decrement_tag_usage", { tag_id_param: tagId });
    }
  }

  // Voeg nieuwe tags toe
  if (toAdd.length > 0) {
    const newTags = toAdd.map((tagId) => ({
      deck_id: deckId,
      tag_id: tagId,
      added_by: user.id,
    }));

    const { error: insertError } = await supabase.from("deck_tags").insert(newTags);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Increment usage counts
    for (const tagId of toAdd) {
      await supabase.rpc("increment_tag_usage", { tag_id_param: tagId });
    }
  }

  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
  revalidatePath("/discover");

  return { success: true, error: null };
}
