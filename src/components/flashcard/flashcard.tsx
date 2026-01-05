"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  frontText?: string | null;
  backText: string;
  frontMedia?: {
    type: "image" | "audio";
    url: string;
  }[];
  isFlipped?: boolean;
  onFlip?: () => void;
}

export function Flashcard({ frontText, backText, frontMedia, isFlipped = false, onFlip }: FlashcardProps) {
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
      className="perspective-1000 w-full max-w-lg mx-auto cursor-pointer"
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
            "w-full min-h-[300px] flex items-center justify-center backface-hidden",
            isFlipped && "invisible"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <CardContent className="p-6 text-center">
            {frontMedia && frontMedia.length > 0 && (
              <div className="mb-4">
                {frontMedia.map((media, index) => (
                  <div key={index}>
                    {media.type === "image" && (
                      <img
                        src={media.url}
                        alt="Vraag afbeelding"
                        className="max-h-40 mx-auto rounded-lg object-contain"
                      />
                    )}
                    {media.type === "audio" && (
                      <audio controls className="w-full">
                        <source src={media.url} />
                        Je browser ondersteunt geen audio.
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            )}
            {frontText && (
              <p className="text-lg">{frontText}</p>
            )}
            {!frontText && !frontMedia?.length && (
              <p className="text-muted-foreground">(Geen vraag)</p>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Klik of druk op spatie om om te draaien
            </p>
          </CardContent>
        </Card>

        {/* Back */}
        <Card
          className={cn(
            "w-full min-h-[300px] flex items-center justify-center absolute inset-0 backface-hidden rotate-y-180",
            !isFlipped && "invisible"
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <CardContent className="p-6 text-center">
            <p className="text-xl font-semibold text-primary">{backText}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
