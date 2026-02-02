import Link from "next/link";
import Image from "next/image";
import { Plus, Heart } from "lucide-react";
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

  // Haal favoriete decks op (decks die user heeft geliked)
  const { data: likedDecks } = await supabase
    .from("deck_likes")
    .select(`
      deck_id,
      decks!inner (
        id,
        title,
        description,
        card_count,
        like_count,
        user_id,
        is_public
      )
    `)
    .eq("user_id", user!.id)
    .eq("decks.is_public", true)
    .is("decks.deleted_at", null);

  // Haal auteur profielen op voor favorieten
  const authorProfiles = new Map<string, { username: string; display_name: string | null; avatar_url: string | null }>();
  if (likedDecks && likedDecks.length > 0) {
    const userIds = [...new Set(likedDecks.map((l) => {
      const deck = l.decks as unknown as { user_id: string };
      return deck.user_id;
    }))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    if (profiles) {
      for (const profile of profiles) {
        authorProfiles.set(profile.id, {
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        });
      }
    }
  }

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

      {/* Eigen leersets */}
      <section className="mb-12">
        <h2 className="text-lg font-semibold mb-4">Mijn leersets</h2>
        {decks && decks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <Link key={deck.id} href={`/decks/${deck.id}`}>
                <Card className="h-full hover:border-primary/50 transition-all cursor-pointer active:scale-[0.98] active:opacity-90">
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
      </section>

      {/* Favorieten */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold">Mijn favorieten</h2>
        </div>
        {likedDecks && likedDecks.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {likedDecks.map((like) => {
              const deck = like.decks as unknown as {
                id: string;
                title: string;
                description: string | null;
                card_count: number;
                like_count: number;
                user_id: string;
              };
              const profile = authorProfiles.get(deck.user_id);
              const authorName = profile?.display_name || profile?.username;

              return (
                <Link key={deck.id} href={`/decks/${deck.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-all cursor-pointer active:scale-[0.98] active:opacity-90">
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
                        <div className="flex items-center gap-3">
                          <span>{deck.card_count} kaarten</span>
                          {deck.like_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {deck.like_count}
                            </span>
                          )}
                        </div>
                        {authorName && (
                          <span className="flex items-center gap-1.5">
                            door {authorName}
                            {profile?.avatar_url ? (
                              <Image
                                src={profile.avatar_url}
                                alt={authorName}
                                width={18}
                                height={18}
                                className="rounded-full"
                              />
                            ) : (
                              <span className="w-[18px] h-[18px] rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                                {authorName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-2">
                Je hebt nog geen favorieten.
              </p>
              <p className="text-sm text-muted-foreground">
                Geef een hartje aan leersets die je leuk vindt op de{" "}
                <Link href="/discover" className="text-primary hover:underline">
                  Ontdek
                </Link>{" "}
                pagina.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
