"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SpeciesSheet } from "@/components/species/species-sheet";
import { BookOpen, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioFlashcardProps {
  audioStreamUrl: string;
  sonogramUrl: string;
  speciesId?: string;
  speciesName: string;
  scientificName: string;
  backText: string | null;
  attribution: {
    recordist: string;
    type: string;
    quality: string;
    duration: string;
    country: string;
    license: string;
    pageUrl: string;
  };
  isFlipped: boolean;
  onFlip: () => void;
}

export function AudioFlashcard({
  audioStreamUrl,
  sonogramUrl,
  speciesId,
  speciesName,
  scientificName,
  backText,
  attribution,
  isFlipped,
  onFlip,
}: AudioFlashcardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speciesSheetOpen, setSpeciesSheetOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio when card flips or component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Stop audio, clear ref, and autoplay when navigating to next card (audioStreamUrl changes)
  useEffect(() => {
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);

    // Autoplay with small delay (alleen als kaart niet geflipped is)
    if (!isFlipped) {
      const timeoutId = setTimeout(() => {
        const audio = new Audio(audioStreamUrl);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
        audioRef.current = audio;

        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // Autoplay blocked by browser - user needs to click play manually
          setIsPlaying(false);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [audioStreamUrl, isFlipped]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flip

    if (isPlaying) {
      stopAudio();
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioStreamUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onerror = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const restartAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Translate sound type to Dutch
  const translateType = (type: string): string => {
    const translations: Record<string, string> = {
      song: "Zang",
      call: "Roep",
      "alarm call": "Alarm",
      "flight call": "Vlucht",
      "dawn song": "Ochtendzang",
      "calling song": "Lokzang",
      "courtship song": "Baltszang",
      echolocation: "Echolocatie",
      "social call": "Sociaal",
      "advertisement call": "Baltsroep",
      "mating call": "Paringsroep",
    };
    return translations[type.toLowerCase()] || type;
  };

  // Format license for display
  const formatLicense = (license: string): string => {
    return license
      .replace(/^CC\s+/i, "CC ")
      .replace(/\s+\d+\.\d+$/, "")
      .trim();
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
        {/* Voorkant: Sonogram + Audio controls */}
        <div
          className={cn(
            "transition-all duration-300",
            isFlipped ? "hidden" : "block"
          )}
        >
          {/* Sonogram container */}
          <div className="relative aspect-[4/3] w-full bg-muted">
            <img
              src={sonogramUrl}
              alt="Sonogram"
              className="w-full h-full object-cover"
            />

            {/* Play/Pause button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all",
                  isPlaying
                    ? "bg-primary text-primary-foreground scale-110"
                    : "bg-black/60 text-white hover:bg-black/80 hover:scale-105"
                )}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>
            </div>

            {/* Restart button (visible when playing) */}
            {isPlaying && (
              <button
                onClick={restartAudio}
                className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            {/* Quality badge */}
            <span
              className={cn(
                "absolute top-3 right-3 text-xs px-2 py-1 rounded font-medium",
                attribution.quality === "A"
                  ? "bg-green-500/90 text-white"
                  : attribution.quality === "B"
                  ? "bg-blue-500/90 text-white"
                  : "bg-orange-500/90 text-white"
              )}
            >
              Kwaliteit {attribution.quality}
            </span>
          </div>

          {/* Attributie */}
          <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between items-center">
              <span>{attribution.recordist}</span>
              <span>{attribution.duration}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-muted px-1.5 py-0.5 rounded">
                {translateType(attribution.type)}
              </span>
              <span className="bg-muted px-1.5 py-0.5 rounded">
                {attribution.country}
              </span>
              <a
                href={attribution.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary hover:underline"
              >
                {formatLicense(attribution.license)} · Xeno-canto
              </a>
            </div>
          </div>

          {/* Hint */}
          <div className="p-4 pt-2 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="md:hidden">Luister en tik om te draaien</span>
              <span className="hidden md:inline">Luister en klik of druk op spatie</span>
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
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-bold">{speciesName}</h2>
              {speciesId && (
                <BookOpen
                  className="w-5 h-5 text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSpeciesSheetOpen(true);
                  }}
                />
              )}
            </div>
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

      {/* Species Sheet */}
      {speciesId && (
        <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <SpeciesSheet
            speciesId={speciesId}
            open={speciesSheetOpen}
            onOpenChange={setSpeciesSheetOpen}
          />
        </div>
      )}
    </Card>
  );
}
