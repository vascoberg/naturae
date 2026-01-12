import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { AnnotationPageClient } from "./annotation-page-client";

interface Props {
  params: Promise<{ mediaId: string }>;
  searchParams: Promise<{ deckId?: string; cardId?: string }>;
}

export default async function AnnotatePage({ params, searchParams }: Props) {
  const { mediaId } = await params;
  const { deckId, cardId } = await searchParams;

  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load media with card and deck info
  const { data: media, error } = await supabase
    .from("card_media")
    .select(
      `
      id,
      url,
      annotations,
      card_id,
      cards (
        id,
        deck_id,
        decks (
          user_id
        )
      )
    `
    )
    .eq("id", mediaId)
    .single();

  if (error || !media) {
    console.error("Media not found:", error);
    notFound();
  }

  console.log("Loaded media for annotation:", {
    mediaId: media.id,
    url: media.url,
    hasAnnotations: !!media.annotations,
    annotationsPreview: media.annotations ? JSON.stringify(media.annotations).substring(0, 100) : null,
  });

  // Type assertion for nested Supabase query result
  const cards = media.cards as unknown as {
    id: string;
    deck_id: string;
    decks: { user_id: string };
  } | null;

  if (!cards) {
    notFound();
  }

  // Authorization: only owner can annotate
  if (cards.decks.user_id !== user.id) {
    redirect("/dashboard");
  }

  return (
    <AnnotationPageClient
      mediaId={media.id}
      imageUrl={media.url}
      initialAnnotations={media.annotations}
      deckId={deckId || cards.deck_id}
      cardId={cardId || cards.id}
    />
  );
}
