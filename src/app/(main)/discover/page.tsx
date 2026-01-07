import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DiscoverPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Haal publieke decks op (exclusief eigen decks)
  const { data: publicDecks } = await supabase
    .from("decks")
    .select(
      `
      id,
      title,
      description,
      card_count,
      user_id,
      profiles!decks_user_id_fkey (username, display_name)
    `
    )
    .eq("is_public", true)
    .is("deleted_at", null)
    .neq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Ontdek leersets</h1>
        <p className="text-muted-foreground">
          Vind en leer van openbare leersets gemaakt door anderen
        </p>
      </div>

      {/* TODO: Add search and filter functionality in Sprint 3 */}

      {publicDecks && publicDecks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {publicDecks.map((deck) => {
            const profile = deck.profiles as unknown as {
              username: string;
              display_name: string | null;
            };
            const authorName = profile?.display_name || profile?.username;

            return (
              <Link key={deck.id} href={`/decks/${deck.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">{deck.title}</CardTitle>
                    {deck.description && (
                      <CardDescription className="line-clamp-2">
                        {deck.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{deck.card_count} kaarten</span>
                      {authorName && <span>door {authorName}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Er zijn nog geen openbare leersets beschikbaar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
