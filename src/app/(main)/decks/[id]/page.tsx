import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardGridView } from "@/components/deck/card-grid-view";
import { StartStudyButton } from "@/components/deck/start-study-button";
import { ExportButton } from "@/components/deck/export-button";

interface DeckPageProps {
  params: Promise<{ id: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Haal deck op
  const { data: deck, error } = await supabase
    .from("decks")
    .select(`
      id,
      title,
      description,
      card_count,
      is_public,
      user_id,
      created_at
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error || !deck) {
    notFound();
  }

  // Check of user toegang heeft (eigen deck of publiek)
  if (deck.user_id !== user.id && !deck.is_public) {
    notFound();
  }

  // Haal kaarten op met media
  const { data: cards } = await supabase
    .from("cards")
    .select(`
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
    `)
    .eq("deck_id", id)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  // Haal voortgang op voor deze gebruiker
  const { data: progress } = await supabase
    .from("user_progress")
    .select("card_id, times_seen, times_correct, next_review")
    .eq("user_id", user.id)
    .in("card_id", cards?.map(c => c.id) || []);

  // Bereken statistieken
  const totalCards = cards?.length || 0;
  const cardsSeen = progress?.filter(p => p.times_seen > 0).length || 0;

  // Cards due for review
  const now = new Date().toISOString();
  const cardsDue = progress?.filter(p => !p.next_review || p.next_review <= now).length || 0;
  const newCards = totalCards - cardsSeen;

  const isOwner = deck.user_id === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Deck Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{deck.title}</h1>
              {deck.description && (
                <p className="text-muted-foreground">{deck.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {deck.is_public && <Badge variant="secondary">Openbaar</Badge>}
              {isOwner && <Badge>Mijn deck</Badge>}
            </div>
          </div>

          {/* Stats */}
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

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <StartStudyButton
              deckId={deck.id}
              totalCards={totalCards}
              dueCards={cardsDue + newCards}
              hasStarted={cardsSeen > 0}
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
          </div>
        </div>

{/* Card grid/list view */}
        <CardGridView cards={cards || []} />
    </div>
  );
}
