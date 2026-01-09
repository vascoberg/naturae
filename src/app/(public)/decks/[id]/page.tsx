import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    .select("username, display_name")
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

  // Haal kaarten op met media
  const { data: cards } = await supabase
    .from("cards")
    .select(
      `
      id,
      front_text,
      back_text,
      position,
      card_media (
        id,
        type,
        url,
        position
      )
    `
    )
    .eq("deck_id", id)
    .is("deleted_at", null)
    .order("position", { ascending: true });

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
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{deck.title}</h1>
            {deck.description && (
              <p className="text-muted-foreground mb-2">{deck.description}</p>
            )}
            {!isOwner && authorName && (
              <p className="text-sm text-muted-foreground">
                door {authorName}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {deck.is_public && <Badge variant="secondary">Openbaar</Badge>}
            {isOwner && <Badge>Mijn deck</Badge>}
          </div>
        </div>

        {/* Stats - alleen voortgang tonen voor ingelogde users */}
        {isGuest ? (
          <div className="mb-6 space-y-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{totalCards}</p>
                <p className="text-sm text-muted-foreground">Kaarten</p>
              </CardContent>
            </Card>
            {/* Guest disclaimer */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 flex gap-3">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>{" "}
                om je leervoortgang op te slaan en te zien welke kaarten je moet herhalen.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{totalCards}</p>
                <p className="text-sm text-muted-foreground">Kaarten</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{newCards}</p>
                <p className="text-sm text-muted-foreground">Nieuw</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-bold">{cardsDue}</p>
                <p className="text-sm text-muted-foreground">Te herhalen</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 items-center">
          <StartStudyButton
            deckId={deck.id}
            totalCards={totalCards}
            dueCards={isGuest ? totalCards : cardsDue + newCards}
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
