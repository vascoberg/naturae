import Link from "next/link";
import Image from "next/image";
import { Search, Layers, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default async function Home() {
  const supabase = await createClient();

  // Haal populaire openbare decks op (gesorteerd op likes, dan card_count)
  const { data: popularDecks } = await supabase
    .from("decks")
    .select("id, title, description, card_count, like_count, created_at, user_id")
    .eq("is_public", true)
    .is("deleted_at", null)
    .order("like_count", { ascending: false })
    .order("card_count", { ascending: false })
    .limit(4);

  // Haal thumbnails en auteur profielen op
  const deckThumbnails = new Map<string, string>();
  const authorProfiles = new Map<string, { username: string; display_name: string | null; avatar_url: string | null }>();

  if (popularDecks && popularDecks.length > 0) {
    const deckIds = popularDecks.map((d) => d.id);
    const userIds = [...new Set(popularDecks.map((d) => d.user_id))];

    // Haal eerste kaart met afbeelding per deck
    const { data: thumbnails } = await supabase
      .from("cards")
      .select(`
        deck_id,
        card_media!inner (url, type)
      `)
      .in("deck_id", deckIds)
      .is("deleted_at", null)
      .eq("card_media.type", "image")
      .order("position", { ascending: true });

    // Map deck_id naar eerste afbeelding URL
    if (thumbnails) {
      for (const card of thumbnails) {
        if (!deckThumbnails.has(card.deck_id)) {
          const media = card.card_media as unknown as { url: string; type: string }[];
          if (media && media.length > 0) {
            deckThumbnails.set(card.deck_id, media[0].url);
          }
        }
      }
    }

    // Haal auteur profielen op
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary">
            <Image
              src="/images/logo.png"
              alt="Naturae"
              width={28}
              height={28}
              className="w-7 h-7 flex-shrink-0"
            />
            Naturae
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/discover"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ontdek
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Inloggen</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Registreren</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background image - gespiegeld zodat vogel rechts staat */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-bg.jpg"
            alt=""
            fill
            className="object-cover object-left scale-x-[-1]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-xl text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Leer soorten herkennen
            </h1>
            <p className="text-xl text-muted-foreground mb-10">
              Ontdek flashcards gemaakt door de community en leer vogels,
              planten, insecten en meer te herkennen.
            </p>

            {/* Search bar */}
            <form action="/discover" method="GET" className="max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder="Zoek leersets..."
                  className="pl-12 pr-4 py-6 text-lg rounded-full border-2 focus-visible:ring-primary"
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Popular decks */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold">Populaire leersets</h2>
            <Button variant="ghost" asChild>
              <Link href="/discover">Bekijk alle &rarr;</Link>
            </Button>
          </div>

          {popularDecks && popularDecks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularDecks.map((deck) => {
                const thumbnail = deckThumbnails.get(deck.id);
                const profile = authorProfiles.get(deck.user_id);
                const authorName = profile?.display_name || profile?.username;
                return (
                  <Link key={deck.id} href={`/decks/${deck.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                      {/* Thumbnail */}
                      <div className="aspect-[4/3] relative bg-muted">
                        {thumbnail ? (
                          <Image
                            src={thumbnail}
                            alt={deck.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Layers className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="pt-4">
                        <h3 className="font-semibold mb-1 line-clamp-1">
                          {deck.title}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>{deck.card_count} kaarten</span>
                            {(deck.like_count ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {deck.like_count}
                              </span>
                            )}
                          </div>
                        </div>
                        {authorName && (
                          <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                            <span>door {authorName}</span>
                            {profile?.avatar_url ? (
                              <Image
                                src={profile.avatar_url}
                                alt={authorName}
                                width={18}
                                height={18}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-[18px] h-[18px] rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                                {authorName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nog geen openbare leersets beschikbaar.</p>
              <p className="mt-2">
                <Link href="/signup" className="text-primary hover:underline">
                  Maak een account
                </Link>{" "}
                om de eerste te maken!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features / How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center mb-12">
            Hoe het werkt
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">1</span>
              </div>
              <h3 className="font-semibold mb-2">Kies een leerset</h3>
              <p className="text-sm text-muted-foreground">
                Blader door openbare leersets of maak je eigen collectie.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">2</span>
              </div>
              <h3 className="font-semibold mb-2">Oefen met flashcards</h3>
              <p className="text-sm text-muted-foreground">
                Bekijk foto&apos;s en geluiden, draai de kaart om en check je
                antwoord.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">3</span>
              </div>
              <h3 className="font-semibold mb-2">Leer effectief</h3>
              <p className="text-sm text-muted-foreground">
                Slim herhalen zorgt dat je het onthoudt. Op je eigen tempo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Naturae - Leer de natuur kennen
            </p>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/discover" className="hover:text-foreground">
                Ontdek
              </Link>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="/login" className="hover:text-foreground">
                Inloggen
              </Link>
              <Link href="/signup" className="hover:text-foreground">
                Registreren
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
