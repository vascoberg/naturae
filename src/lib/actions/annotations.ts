"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AnnotationData } from "@/types/annotations";

export async function saveAnnotations(
  cardMediaId: string,
  annotations: AnnotationData,
  annotatedImageBase64: string
): Promise<{ success: boolean; annotatedUrl?: string; error?: string }> {
  try {
    console.log("saveAnnotations called with:", {
      cardMediaId,
      annotationsCount: annotations.annotations?.length ?? 0,
      base64Length: annotatedImageBase64?.length ?? 0,
      base64Preview: annotatedImageBase64?.substring(0, 50),
    });

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Niet ingelogd" };
    }

    // Get media info for path construction
    const { data: media, error: mediaError } = await supabase
      .from("card_media")
      .select("id, card_id, cards(deck_id)")
      .eq("id", cardMediaId)
      .single();

    if (mediaError || !media) {
      return { success: false, error: "Media niet gevonden" };
    }

    // Convert base64 to Uint8Array
    const base64Data = annotatedImageBase64.replace(
      /^data:image\/png;base64,/,
      ""
    );
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to storage with proper path for RLS
    const deckId = (media.cards as unknown as { deck_id: string }).deck_id;
    const filePath = `${user.id}/${deckId}/${media.card_id}/${cardMediaId}-annotated.png`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { success: false, error: `Upload mislukt: ${uploadError.message}` };
    }

    console.log("Upload successful, file path:", filePath);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(filePath);

    console.log("Public URL:", publicUrl);
    console.log("Updating database with annotations:", JSON.stringify(annotations).substring(0, 200));

    // Update database
    const { error: updateError } = await supabase
      .from("card_media")
      .update({
        annotated_url: publicUrl,
        annotations: annotations,
      })
      .eq("id", cardMediaId);

    if (updateError) {
      console.error("Update error:", updateError);
      return { success: false, error: `Database update mislukt: ${updateError.message}` };
    }

    console.log("Database update successful!");

    // Revalidate paths so the new annotated image shows up
    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
    revalidatePath(`/annotate/${cardMediaId}`);

    return { success: true, annotatedUrl: publicUrl };
  } catch (error) {
    console.error("saveAnnotations error:", error);
    return { success: false, error: "Onbekende fout" };
  }
}

export async function getAnnotations(cardMediaId: string): Promise<{
  url: string;
  annotations: AnnotationData | null;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("card_media")
    .select("url, annotations")
    .eq("id", cardMediaId)
    .single();

  if (error || !data) {
    console.error("getAnnotations error:", error);
    return null;
  }

  return {
    url: data.url,
    annotations: data.annotations as AnnotationData | null,
  };
}

export async function removeAnnotations(
  cardMediaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Niet ingelogd" };
    }

    // Get current annotated_url to delete from storage
    const { data: media } = await supabase
      .from("card_media")
      .select("annotated_url, card_id, cards(deck_id)")
      .eq("id", cardMediaId)
      .single();

    // Delete from storage if exists
    if (media?.annotated_url) {
      const deckId = (media.cards as unknown as { deck_id: string }).deck_id;
      const filePath = `${user.id}/${deckId}/${media.card_id}/${cardMediaId}-annotated.png`;

      await supabase.storage.from("media").remove([filePath]);
    }

    // Clear database fields
    const { error: updateError } = await supabase
      .from("card_media")
      .update({
        annotated_url: null,
        annotations: null,
      })
      .eq("id", cardMediaId);

    if (updateError) {
      return { success: false, error: "Database update mislukt" };
    }

    return { success: true };
  } catch (error) {
    console.error("removeAnnotations error:", error);
    return { success: false, error: "Onbekende fout" };
  }
}
