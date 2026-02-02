import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { Search, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SortSelect } from "@/components/discover/sort-select";
import { TagFilter } from "@/components/discover/tag-filter";
import { getAllTags } from "@/lib/actions/tags";

interface DiscoverPageProps {
  searchParams: Promise<{ q?: string; sort?: string; tags?: string }>;
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const { q: searchQuery, sort = "newest", tags: tagsParam } = await searchParams;
  const selectedTagSlugs = tagsParam?.split(",").filter(Boolean) || [];
  const supabase = await createClient();

  // Haal alle tags op voor de filter
  const { data: allTags } = await getAllTags();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Als tags geselecteerd zijn, haal eerst deck IDs op die deze tags hebben
  let deckIdsWithTags: string[] | null = null;
  if (selectedTagSlugs.length > 0) {
    // Haal tag IDs op basis van slugs
    const { data: selectedTags } = await supabase
      .from("tags")
      .select("id")
      .in("slug", selectedTagSlugs);

    if (selectedTags && selectedTags.length > 0) {
      const tagIds = selectedTags.map((t) => t.id);

      // Haal deck IDs op die AL deze tags hebben
      const { data: deckTags } = await supabase
        .from("deck_tags")
        .select("deck_id, tag_id")
        .in("tag_id", tagIds);

      if (deckTags) {
        // Groepeer per deck en check of deck alle geselecteerde tags heeft
        const deckTagCounts = new Map<string, number>();
        for (const dt of deckTags) {
          deckTagCounts.set(dt.deck_id, (deckTagCounts.get(dt.deck_id) || 0) + 1);
        }
        // Filter decks die alle tags hebben
        deckIdsWithTags = Array.from(deckTagCounts.entries())
          .filter(([, count]) => count >= tagIds.length)
          .map(([deckId]) => deckId);
      }
    }
  }

  // Bouw query voor openbare decks (zonder join voor guest compatibility)
  let query = supabase
    .from("decks")
    .select(
      `
      id,
      title,
      description,
      card_count,
      like_count,
      user_id,
      created_at
    `
    )
    .eq("is_public", true)
    .is("deleted_at", null);

  // Filter op tags als geselecteerd
  if (deckIdsWithTags !== null) {
    if (deckIdsWithTags.length === 0) {
      // Geen decks matchen de tags, return early
      query = query.in("id", ["00000000-0000-0000-0000-000000000000"]);
    } else {
      query = query.in("id", deckIdsWithTags);
    }
  }

  // Eigen decks worden ook getoond - zo kunnen makers zien hoe hun deck eruitziet
  // en is de pagina niet leeg als er nog weinig gebruikers zijn

  // Zoeken op titel
  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  // Sorteren
  if (sort === "popular") {
    query = query.order("like_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: publicDecks } = await query;

  // Haal auteur profielen apart op (voor guest compatibility)
  const authorProfiles = new Map<string, { username: string; display_name: string | null; avatar_url: string | null }>();
  if (publicDecks && publicDecks.length > 0) {
    const userIds = [...new Set(publicDecks.map((d) => d.user_id))];
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Ontdek leersets</h1>
        <p className="text-muted-foreground">
          Vind en leer van openbare leersets gemaakt door de community
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <form className="flex-1" action="/discover" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Zoek op titel..."
              className="pl-10"
            />
          </div>
          {sort !== "newest" && (
            <input type="hidden" name="sort" value={sort} />
          )}
          {tagsParam && (
            <input type="hidden" name="tags" value={tagsParam} />
          )}
        </form>

        <Suspense fallback={<div className="w-[180px] h-10 bg-muted rounded-md animate-pulse" />}>
          <SortSelect defaultValue={sort} />
        </Suspense>
      </div>

      {/* Tag filters */}
      {allTags && allTags.length > 0 && (
        <div className="mb-8">
          <Suspense fallback={<div className="h-8 bg-muted rounded-md animate-pulse w-64" />}>
            <TagFilter tags={allTags} selectedSlugs={selectedTagSlugs} />
          </Suspense>
        </div>
      )}

      {/* Results */}
      {publicDecks && publicDecks.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {publicDecks.length} leerset{publicDecks.length !== 1 ? "s" : ""}{" "}
            gevonden
            {searchQuery && ` voor "${searchQuery}"`}
            {selectedTagSlugs.length > 0 && ` met ${selectedTagSlugs.length} tag${selectedTagSlugs.length !== 1 ? "s" : ""}`}
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publicDecks.map((deck) => {
              const profile = authorProfiles.get(deck.user_id);
              const authorName = profile?.display_name || profile?.username;

              return (
                <Link key={deck.id} href={`/decks/${deck.id}`}>
                  <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] active:opacity-90">
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
                          {(deck.like_count ?? 0) > 0 && (
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
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            {searchQuery ? (
              <div>
                <p className="text-muted-foreground mb-2">
                  Geen leersets gevonden voor &quot;{searchQuery}&quot;
                </p>
                <Link
                  href="/discover"
                  className="text-primary hover:underline text-sm"
                >
                  Bekijk alle leersets
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Er zijn nog geen openbare leersets beschikbaar.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
