import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardGridView } from "@/components/deck/card-grid-view";
import { StartStudyButton } from "@/components/deck/start-study-button";
import { ExportButton } from "@/components/deck/export-button";
import { LikeButton } from "@/components/deck/like-button";

interface DeckPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Haal deck op (zonder join voor guest compatibility)
  const { data: deck, error } = await supabase
    .from("decks")
    .select(
      `
      id,
      title,
      description,
      card_count,
      like_count,
      is_public,
      user_id,
      created_at
    `
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !deck) {
    notFound();
  }

  // Check toegang: eigen deck of openbaar deck
  const isOwner = user && deck.user_id === user.id;
  const isGuest = !user;

  // Als gast en deck niet openbaar -> niet toegestaan
  if (isGuest && !deck.is_public) {
    notFound();
  }

  // Als ingelogd maar niet eigenaar en niet openbaar -> niet toegestaan
  if (!isOwner && !deck.is_public) {
    notFound();
  }

  // Haal auteur profiel apart op (voor guest compatibility)
  const { data: authorProfile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", deck.user_id)
    .single();

  const authorName = authorProfile?.display_name || authorProfile?.username;

  // Check of user deze deck al heeft geliked
  let isLiked = false;
  if (user) {
    const { data: like } = await supabase
      .from("deck_likes")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("deck_id", id)
      .single();
    isLiked = !!like;
  }

  // Haal kaarten op met media en species info
  const { data: cards } = await supabase
    .from("cards")
    .select(
      `
      id,
      front_text,
      back_text,
      position,
      species_id,
      species:species_id (
        gbif_key,
        scientific_name,
        canonical_name,
        common_names
      ),
      card_media (
        id,
        type,
        url,
        position,
        annotated_url
      )
    `
    )
    .eq("deck_id", id)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  // Tel kaarten met GBIF-gekoppelde soorten (voor openbare foto's modus)
  const speciesCardsCount = cards?.filter(
    (c) => c.species && typeof c.species === "object" && "gbif_key" in c.species && c.species.gbif_key
  ).length || 0;

  // Tel kaarten met eigen foto's (voor quiz met eigen foto's)
  const cardsWithImageCount = cards?.filter(
    (c) => c.card_media && c.card_media.length > 0 && c.card_media.some(m => m.type === "image")
  ).length || 0;

  // Tel kaarten met eigen audio (voor quiz met eigen geluiden)
  const cardsWithAudioCount = cards?.filter(
    (c) => c.card_media && c.card_media.length > 0 && c.card_media.some(m => m.type === "audio")
  ).length || 0;

  // Totaal kaarten met eigen media (voor backwards compatibility)
  const cardsWithMediaCount = cards?.filter(
    (c) => c.card_media && c.card_media.length > 0 && c.card_media.some(m => m.type === "image" || m.type === "audio")
  ).length || 0;

  // Haal voortgang op (alleen voor ingelogde gebruikers)
  let progress: {
    card_id: string;
    times_seen: number;
    times_correct: number;
    next_review: string | null;
  }[] = [];

  if (user) {
    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("card_id, times_seen, times_correct, next_review")
      .eq("user_id", user.id)
      .in("card_id", cards?.map((c) => c.id) || []);
    progress = userProgress || [];
  }

  // Bereken statistieken
  const totalCards = cards?.length || 0;
  const cardsSeen = progress.filter((p) => p.times_seen > 0).length;

  // Cards due for review
  const now = new Date().toISOString();
  const cardsDue = progress.filter(
    (p) => !p.next_review || p.next_review <= now
  ).length;
  const newCards = totalCards - cardsSeen;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Deck Header */}
      <div className="mb-8 pb-6 border-b">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">{deck.title}</h1>
            {deck.description && (
              <p className="text-muted-foreground text-lg">{deck.description}</p>
            )}
            {/* Metadata: card count + author */}
            <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="font-medium">{totalCards} kaarten</span>
              {!isOwner && authorName && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    door {authorName}
                    {authorProfile?.avatar_url ? (
                      <Image
                        src={authorProfile.avatar_url}
                        alt={authorName}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {deck.is_public && <Badge variant="secondary">Openbaar</Badge>}
            {isOwner && <Badge>Mijn deck</Badge>}
          </div>
        </div>

        {/* Guest disclaimer */}
        {isGuest && (
          <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border/50 flex gap-3">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>{" "}
              om je leervoortgang op te slaan.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 items-center">
          <StartStudyButton
            deckId={deck.id}
            totalCards={totalCards}
            dueCards={isGuest ? totalCards : cardsDue + newCards}
            speciesCardsCount={speciesCardsCount}
            cardsWithMediaCount={cardsWithMediaCount}
            cardsWithImageCount={cardsWithImageCount}
            cardsWithAudioCount={cardsWithAudioCount}
            hasStarted={!isGuest && cardsSeen > 0}
            isGuest={isGuest}
          />
          {isOwner && (
            <Button variant="outline" size="lg" asChild>
              <Link href={`/decks/${deck.id}/edit`}>
                <Pencil className="w-4 h-4 mr-2" />
                Bewerken
              </Link>
            </Button>
          )}
          <ExportButton deckId={deck.id} deckTitle={deck.title} />
          <LikeButton
            deckId={deck.id}
            initialLiked={isLiked}
            initialCount={deck.like_count || 0}
            isGuest={isGuest}
          />
        </div>
      </div>

      {/* Card grid/list view */}
      <CardGridView cards={cards || []} />
    </div>
  );
}
