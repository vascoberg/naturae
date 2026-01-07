"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleLike(deckId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Je moet ingelogd zijn om te liken" };
  }

  // Check of user al heeft geliked
  const { data: existingLike } = await supabase
    .from("deck_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("deck_id", deckId)
    .single();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from("deck_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("deck_id", deckId);

    if (error) {
      return { error: "Kon like niet verwijderen" };
    }

    revalidatePath(`/decks/${deckId}`);
    revalidatePath("/discover");
    revalidatePath("/");
    return { liked: false };
  } else {
    // Like
    const { error } = await supabase.from("deck_likes").insert({
      user_id: user.id,
      deck_id: deckId,
    });

    if (error) {
      return { error: "Kon niet liken" };
    }

    revalidatePath(`/decks/${deckId}`);
    revalidatePath("/discover");
    revalidatePath("/");
    return { liked: true };
  }
}

export async function getLikeStatus(deckId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isLiked: false, likeCount: 0 };
  }

  // Check of user heeft geliked
  const { data: like } = await supabase
    .from("deck_likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("deck_id", deckId)
    .single();

  // Haal like count op van deck
  const { data: deck } = await supabase
    .from("decks")
    .select("like_count")
    .eq("id", deckId)
    .single();

  return {
    isLiked: !!like,
    likeCount: deck?.like_count || 0,
  };
}
