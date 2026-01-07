"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  cardId?: string; // Unieke ID voor key management
  frontText?: string | null;
  backText: string;
  frontMedia?: {
    type: "image" | "audio";
    url: string;
  }[];
  backMedia?: {
    type: "image" | "audio";
    url: string;
  }[];
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
            {frontMedia && frontMedia.length > 0 && (
              <div className="mb-6">
                {frontMedia.map((media, index) => (
                  <div key={`${cardId}-front-${index}-${media.url}`}>
                    {media.type === "image" && (
                      <img
                        src={media.url}
                        alt="Vraag afbeelding"
                        className="max-h-72 w-auto mx-auto rounded-lg object-contain"
                      />
                    )}
                    {media.type === "audio" && (
                      <audio
                        key={`audio-${cardId}-front-${media.url}`}
                        controls
                        className="w-full max-w-md mx-auto"
                      >
                        <source src={media.url} type="audio/mpeg" />
                        Je browser ondersteunt geen audio.
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            {backMedia && backMedia.length > 0 && (
              <div className="mb-6">
                {backMedia.map((media, index) => (
                  <div key={`${cardId}-back-${index}-${media.url}`}>
                    {media.type === "image" && (
                      <img
                        src={media.url}
                        alt="Antwoord afbeelding"
                        className="max-h-72 w-auto mx-auto rounded-lg object-contain"
                      />
                    )}
                    {media.type === "audio" && (
                      <audio
                        key={`audio-${cardId}-back-${media.url}`}
                        controls
                        className="w-full max-w-md mx-auto"
                      >
                        <source src={media.url} type="audio/mpeg" />
                        Je browser ondersteunt geen audio.
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            )}
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
