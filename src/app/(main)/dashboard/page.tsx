import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Haal profiel op
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user!.id)
    .single();

  // Haal eigen decks op
  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, description, card_count, is_public")
    .eq("user_id", user!.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  // Haal publieke decks op (voor nu, later verplaatsen naar Discover pagina)
  const { data: publicDecks } = await supabase
    .from("decks")
    .select("id, title, description, card_count, user_id")
    .eq("is_public", true)
    .is("deleted_at", null)
    .neq("user_id", user!.id)
    .limit(5)
    .order("created_at", { ascending: false });

  const displayName = profile?.display_name || profile?.username || "Gebruiker";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">Hallo, {displayName}!</h1>
        <p className="text-muted-foreground">
          Welkom bij Naturae. Begin met leren of bekijk beschikbare leersets.
        </p>
      </div>

      {/* Mijn Decks */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Mijn leersets</h2>
          <Link
            href="/my-decks"
            className="text-sm text-primary hover:underline"
          >
            Bekijk alle →
          </Link>
        </div>
        {decks && decks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {decks.slice(0, 6).map((deck) => (
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
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Je hebt nog geen leersets.
              </p>
              <Link
                href="/decks/new"
                className="text-primary hover:underline font-medium"
              >
                Maak je eerste leerset →
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Openbare Decks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Ontdek leersets</h2>
          <Link
            href="/discover"
            className="text-sm text-primary hover:underline"
          >
            Bekijk alle →
          </Link>
        </div>
        {publicDecks && publicDecks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publicDecks.map((deck) => (
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
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Er zijn nog geen openbare leersets beschikbaar.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
