"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MediaItem {
  type: "image" | "audio";
  url: string;
  attribution?: string;
}

interface FlashcardProps {
  cardId?: string; // Unieke ID voor key management
  frontText?: string | null;
  backText: string;
  frontMedia?: MediaItem[];
  backMedia?: MediaItem[];
  isFlipped?: boolean;
  onFlip?: () => void;
}

export function Flashcard({ cardId, frontText, backText, frontMedia, backMedia, isFlipped = false, onFlip }: FlashcardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
            <div className="relative">
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
      <div
        className={cn(
          "relative w-full transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <Card
          className={cn(
            "w-full min-h-[400px] flex items-center justify-center backface-hidden",
            isFlipped && "invisible"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <CardContent className="p-8 text-center w-full">
            {frontMedia && frontMedia.length > 0 && renderMedia(frontMedia, "front")}
            {frontText && (
              <p className="text-xl">{frontText}</p>
            )}
            {!frontText && !frontMedia?.length && (
              <p className="text-muted-foreground">(Geen vraag)</p>
            )}
            <p className="text-sm text-muted-foreground mt-6">
              Klik of druk op spatie om om te draaien
            </p>
          </CardContent>
        </Card>

        {/* Back */}
        <Card
          className={cn(
            "w-full min-h-[400px] flex items-center justify-center absolute inset-0 backface-hidden rotate-y-180",
            !isFlipped && "invisible"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <CardContent className="p-8 text-center w-full">
            {backMedia && backMedia.length > 0 && renderMedia(backMedia, "back")}
            <p className="text-2xl font-semibold text-primary">{backText}</p>
            <p className="text-sm text-muted-foreground mt-6">
              Klik of druk op spatie om om te draaien
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
