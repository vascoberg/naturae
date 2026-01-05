import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Haal profiel op
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();

  // Als geen username, redirect naar onboarding
  if (!profile?.username) {
    redirect("/onboarding");
  }

  // Haal decks op
  const { data: decks } = await supabase
    .from("decks")
    .select("id, title, description, card_count, is_public")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  // Haal publieke decks op (voor nu, later verplaatsen naar Discover pagina)
  const { data: publicDecks } = await supabase
    .from("decks")
    .select("id, title, description, card_count, user_id")
    .eq("is_public", true)
    .is("deleted_at", null)
    .neq("user_id", user.id)
    .limit(5)
    .order("created_at", { ascending: false });

  const displayName = profile.display_name || profile.username;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary">Naturae</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {displayName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">
            Hallo, {displayName}!
          </h2>
          <p className="text-muted-foreground">
            Welkom bij Naturae. Begin met leren of bekijk beschikbare leersets.
          </p>
        </div>

        {/* Mijn Decks */}
        <section className="mb-8">
          <h3 className="text-lg font-medium mb-4">Mijn leersets</h3>
          {decks && decks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {decks.map((deck) => (
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
                <p className="text-sm text-muted-foreground">
                  Bekijk de beschikbare leersets hieronder om te beginnen met leren.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Publieke Decks */}
        <section>
          <h3 className="text-lg font-medium mb-4">Beschikbare leersets</h3>
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
                  Er zijn nog geen publieke leersets beschikbaar.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
