"use client";

import { useState } from "react";
import { LayoutGrid, List, Music, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SpeciesSheet } from "@/components/species/species-sheet";

interface CardMedia {
  id: string;
  type: string;
  url: string;
  position: string;
  annotated_url?: string | null;
}

interface CardData {
  id: string;
  front_text: string | null;
  back_text: string;
  position: number;
  species_id?: string | null; // Voor soortenpagina link
  card_media: CardMedia[] | null;
}

interface CardGridViewProps {
  cards: CardData[];
}

export function CardGridView({ cards }: CardGridViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [speciesSheetId, setSpeciesSheetId] = useState<string | null>(null);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Kaarten ({cards.length})</h2>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            aria-label="Grid weergave"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            aria-label="Lijst weergave"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {cards.map((card) => {
            const imageMedia = card.card_media?.find((m) => m.type === "image");
            const audioMedia = card.card_media?.find((m) => m.type === "audio");

            return (
              <Card key={card.id} className="overflow-hidden">
                {/* Thumbnail area */}
                <div className="aspect-[4/3] bg-muted relative">
                  {imageMedia ? (
                    <img
                      src={imageMedia.annotated_url || imageMedia.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : audioMedia ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-xs text-muted-foreground text-center line-clamp-3">
                        {card.front_text || "(Geen vraag)"}
                      </p>
                    </div>
                  )}
                </div>
                {/* Card name with optional book icon */}
                <CardContent className="p-2">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium truncate flex-1">{card.back_text}</p>
                    {card.species_id && (
                      <BookOpen
                        className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={() => setSpeciesSheetId(card.species_id!)}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {cards.map((card, index) => {
            const imageMedia = card.card_media?.find((m) => m.type === "image");
            const audioMedia = card.card_media?.find((m) => m.type === "audio");

            return (
              <Card key={card.id}>
                <CardContent className="py-2 px-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-6 flex-shrink-0">
                      {index + 1}.
                    </span>

                    {/* Media thumbnail */}
                    {imageMedia ? (
                      <img
                        src={imageMedia.annotated_url || imageMedia.url}
                        alt=""
                        className="w-8 h-8 object-cover rounded flex-shrink-0"
                      />
                    ) : audioMedia ? (
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 flex-shrink-0" />
                    )}

                    <span className="font-medium truncate flex-1">
                      {card.back_text}
                    </span>
                    {card.species_id && (
                      <BookOpen
                        className="w-4 h-4 flex-shrink-0 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        onClick={() => setSpeciesSheetId(card.species_id!)}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Species Sheet */}
      <SpeciesSheet
        speciesId={speciesSheetId}
        open={!!speciesSheetId}
        onOpenChange={(open) => !open && setSpeciesSheetId(null)}
      />
    </section>
  );
}
