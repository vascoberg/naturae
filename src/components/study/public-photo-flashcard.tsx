"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { PhotoAttribution } from "@/components/ui/photo-attribution";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PublicPhotoFlashcardProps {
  photoUrl: string;
  speciesName: string;
  scientificName: string;
  backText: string | null;
  attribution: {
    creator: string | null;
    license: "CC0" | "CC-BY";
    source: string;
    references?: string | null;
  };
  isFlipped: boolean;
  onFlip: () => void;
}

export function PublicPhotoFlashcard({
  photoUrl,
  speciesName,
  scientificName,
  backText,
  attribution,
  isFlipped,
  onFlip,
}: PublicPhotoFlashcardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset state wanneer de foto URL verandert (nieuwe kaart)
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [photoUrl]);

  const handleImageError = () => {
    console.error(`[Photo] Failed to load from ${attribution.source}: ${photoUrl}`);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`[Photo] Successfully loaded from ${attribution.source}: ${photoUrl.substring(0, 60)}...`);
    setImageLoaded(true);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 overflow-hidden select-none",
        "hover:shadow-lg active:scale-[0.99]"
      )}
      onClick={onFlip}
    >
      <CardContent className="p-0">
        {/* Voorkant: Foto */}
        <div
          className={cn(
            "transition-all duration-300",
            isFlipped ? "hidden" : "block"
          )}
        >
          {/* Afbeelding container */}
          <div className="relative aspect-[4/3] w-full bg-muted">
            {!imageLoaded && !imageError && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Foto kon niet geladen worden</p>
              </div>
            ) : (
              <Image
                src={photoUrl}
                alt={`Foto van ${speciesName}`}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
                sizes="(max-width: 768px) 100vw, 512px"
                unoptimized // External URLs van GBIF
              />
            )}
          </div>

          {/* Attributie */}
          <div className="p-3 border-t bg-muted/30">
            <PhotoAttribution
              creator={attribution.creator}
              license={attribution.license}
              source={attribution.source}
              references={attribution.references}
            />
          </div>

          {/* Hint */}
          <div className="p-4 pt-2 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="md:hidden">Tik om te draaien</span>
              <span className="hidden md:inline">Klik of druk op spatie</span>
            </p>
          </div>
        </div>

        {/* Achterkant: Antwoord */}
        <div
          className={cn(
            "transition-all duration-300 p-6",
            isFlipped ? "block" : "hidden"
          )}
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{speciesName}</h2>
            <p className="text-lg text-muted-foreground italic">
              {scientificName}
            </p>
          </div>

          {backText && (
            <>
              <hr className="my-4" />
              <p className="text-center text-muted-foreground">{backText}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
