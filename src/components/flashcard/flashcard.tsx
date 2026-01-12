"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MediaItem {
  type: "image" | "audio";
  url: string;
  attribution?: string;
}

interface SpeciesInfo {
  scientificName: string;
  canonicalName: string | null;
  commonName?: string | null;
}

interface FlashcardProps {
  cardId?: string; // Unieke ID voor key management
  frontText?: string | null;
  backText: string;
  frontMedia?: MediaItem[];
  backMedia?: MediaItem[];
  species?: SpeciesInfo | null;
  speciesDisplay?: "front" | "back" | "both" | "none";
  isFlipped?: boolean;
  onFlip?: () => void;
}

export function Flashcard({
  cardId,
  frontText,
  backText,
  frontMedia,
  backMedia,
  species,
  speciesDisplay = "back",
  isFlipped = false,
  onFlip
}: FlashcardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Render species as primary answer (prominent display)
  const renderSpeciesPrimary = () => {
    if (!species) return null;

    const displayName = species.commonName || species.canonicalName || species.scientificName;
    const scientificName = species.scientificName;

    return (
      <div className="mb-4">
        <p className="text-2xl font-semibold text-primary">{displayName}</p>
        {displayName !== scientificName && (
          <p className="text-base italic text-muted-foreground mt-1">
            {scientificName}
          </p>
        )}
      </div>
    );
  };

  // Render species badge (secondary, smaller display for front side)
  const renderSpeciesBadge = () => {
    if (!species) return null;

    const displayName = species.commonName || species.canonicalName || species.scientificName;
    const scientificName = species.scientificName;

    return (
      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{displayName}</span>
          {displayName !== scientificName && (
            <span className="italic ml-1.5 text-muted-foreground/70">
              ({scientificName})
            </span>
          )}
        </div>
      </div>
    );
  };

  // Determine if species should show on each side
  const showSpeciesOnFront = species && (speciesDisplay === "front" || speciesDisplay === "both");
  const showSpeciesOnBack = species && (speciesDisplay === "back" || speciesDisplay === "both");

  // Stop alle audio wanneer cardId verandert (nieuwe kaart)
  useEffect(() => {
    return () => {
      // Cleanup: stop alle audio in deze component
      if (containerRef.current) {
        const audioElements = containerRef.current.querySelectorAll("audio");
        audioElements.forEach((audio) => {
          audio.pause();
          audio.currentTime = 0;
        });
      }
    };
  }, [cardId]);

  const handleFlip = () => {
    onFlip?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleFlip();
    }
  };

  // Render media met subtiele attribution
  const renderMedia = (media: MediaItem[], side: "front" | "back") => (
    <div className="mb-6 space-y-3">
      {media.map((item, index) => (
        <div key={`${cardId}-${side}-${index}-${item.url}`} className="relative">
          {item.type === "image" && (
            <div className="relative inline-block">
              <img
                src={item.url}
                alt={side === "front" ? "Vraag afbeelding" : "Antwoord afbeelding"}
                className="max-h-72 w-auto mx-auto rounded-lg object-contain"
              />
              {item.attribution && (
                <span className="absolute bottom-1 left-1 text-[10px] text-white/70 bg-black/40 px-1.5 py-0.5 rounded max-w-[90%] truncate">
                  {item.attribution}
                </span>
              )}
            </div>
          )}
          {item.type === "audio" && (
            <div
              className="relative"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <audio
                key={`audio-${cardId}-${side}-${item.url}`}
                controls
                className="w-full max-w-md mx-auto"
              >
                <source src={item.url} type="audio/mpeg" />
                Je browser ondersteunt geen audio.
              </audio>
              {item.attribution && (
                <p className="text-[10px] text-muted-foreground/70 text-center mt-1">
                  {item.attribution}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="perspective-1000 w-full max-w-2xl mx-auto cursor-pointer"
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? "Toon vraag" : "Toon antwoord"}
    >
      {/* Grid container: beide kanten overlappen en de grootste bepaalt de hoogte */}
      <div
        className="grid grid-cols-1 grid-rows-1 transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <Card
          className={cn(
            "col-start-1 row-start-1 w-full min-h-[400px] flex items-center justify-center",
            isFlipped && "invisible"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <CardContent className="p-8 text-center w-full">
            {frontMedia && frontMedia.length > 0 && renderMedia(frontMedia, "front")}
            {/* Species prominent on front when speciesDisplay is 'front' or 'both' */}
            {showSpeciesOnFront ? (
              <>
                {renderSpeciesPrimary()}
                {/* frontText as secondary info */}
                {frontText && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-base text-muted-foreground">{frontText}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {frontText && (
                  <p className="text-xl">{frontText}</p>
                )}
                {!frontText && !frontMedia?.length && (
                  <p className="text-muted-foreground">(Geen vraag)</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Back */}
        <Card
          className={cn(
            "col-start-1 row-start-1 w-full min-h-[400px] flex items-center justify-center",
            !isFlipped && "invisible"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <CardContent className="p-8 text-center w-full">
            {backMedia && backMedia.length > 0 && renderMedia(backMedia, "back")}
            {/* Species is primary answer when present */}
            {showSpeciesOnBack ? (
              <>
                {renderSpeciesPrimary()}
                {/* backText as secondary info */}
                {backText && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-base text-muted-foreground">{backText}</p>
                  </div>
                )}
              </>
            ) : (
              /* No species: backText is the primary answer */
              <p className="text-2xl font-semibold text-primary">{backText}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
