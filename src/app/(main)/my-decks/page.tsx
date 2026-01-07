import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function MyDecksPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Haal eigen decks op
  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, description, card_count, is_public, created_at")
    .eq("user_id", user!.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Mijn leersets</h1>
          <p className="text-muted-foreground">
            Beheer en oefen met je eigen leersets
          </p>
        </div>
        <Link href="/decks/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe leerset
          </Button>
        </Link>
      </div>

      {decks && decks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/decks/${deck.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{deck.title}</CardTitle>
                    {deck.is_public && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Openbaar
                      </span>
                    )}
                  </div>
                  {deck.description && (
                    <CardDescription className="line-clamp-2">
                      {deck.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {deck.card_count} kaarten
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Je hebt nog geen leersets gemaakt.
            </p>
            <Link href="/decks/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Maak je eerste leerset
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
