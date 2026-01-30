"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpeciesSheet } from "@/components/species/species-sheet";
import { cn } from "@/lib/utils";
import { Check, X, ArrowRight, Play, Pause, Volume2, BookOpen } from "lucide-react";
import type { QuizCard, QuizOption } from "@/lib/actions/quiz";

interface QuizAudioQuestionProps {
  question: QuizCard;
  onAnswer: (selectedId: string, isCorrect: boolean) => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
  isLastQuestion: boolean;
}

export function QuizAudioQuestion({
  question,
  onAnswer,
  onNext,
  questionNumber,
  totalQuestions,
  isLastQuestion,
}: QuizAudioQuestionProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [speciesSheetId, setSpeciesSheetId] = useState<string | null>(null);

  // Reset state wanneer de vraag verandert
  useEffect(() => {
    setIsPlaying(false);
    setAudioLoaded(false);
    setAudioError(false);
    setSelectedOption(null);
    setShowResult(false);
    setHasAnswered(false);
  }, [question.cardId]);

  // Auto-play when audio loads
  useEffect(() => {
    if (audioLoaded && audioRef.current && !hasAnswered) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked by browser, user needs to click play
      });
    }
  }, [audioLoaded, hasAnswered]);

  // Keyboard support voor volgende vraag
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasAnswered && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasAnswered, onNext]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleOptionClick = (option: QuizOption) => {
    if (showResult) return; // Voorkom dubbele selectie

    setSelectedOption(option.id);
    setShowResult(true);
    setHasAnswered(true);

    // Registreer het antwoord direct (zonder navigatie)
    onAnswer(option.id, option.isCorrect);
  };

  const getOptionStyle = (option: QuizOption) => {
    if (!showResult) {
      return "hover:bg-accent hover:border-accent-foreground/20";
    }

    if (option.isCorrect) {
      return "bg-green-100 border-green-500 dark:bg-green-950 dark:border-green-500";
    }

    if (selectedOption === option.id && !option.isCorrect) {
      return "bg-red-100 border-red-500 dark:bg-red-950 dark:border-red-500";
    }

    return "opacity-50";
  };

  return (
    <div className="space-y-4">
      {/* Voortgang */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Vraag {questionNumber} van {totalQuestions}</span>
        <div className="h-2 flex-1 mx-4 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Audio player card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {/* Audio element (hidden) */}
          {question.audio && (
            <audio
              ref={audioRef}
              src={question.audio.url}
              onCanPlayThrough={() => setAudioLoaded(true)}
              onError={() => setAudioError(true)}
              onEnded={handleAudioEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}

          {/* Audio player UI */}
          <div className="flex flex-col items-center gap-4">
            {audioError ? (
              <div className="text-center text-muted-foreground py-8">
                <Volume2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Audio kon niet geladen worden</p>
              </div>
            ) : (
              <>
                {/* Play button */}
                <button
                  onClick={handlePlayPause}
                  disabled={!audioLoaded}
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center transition-all",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    isPlaying && "bg-primary/80"
                  )}
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10" />
                  ) : (
                    <Play className="w-10 h-10 ml-1" />
                  )}
                </button>

                {/* Status */}
                <p className="text-sm text-muted-foreground">
                  {!audioLoaded ? "Laden..." : isPlaying ? "Afspelen..." : "Klik om af te spelen"}
                </p>

                {/* Attribution */}
                {question.audio && (
                  <p className="text-xs text-muted-foreground text-center">
                    {question.audio.creator && (
                      <span>Door {question.audio.creator}</span>
                    )}
                    {question.audio.source && question.audio.creator && " • "}
                    {question.audio.source && (
                      <span>{question.audio.source}</span>
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vraag */}
      <p className="text-center font-medium">Welke soort is dit?</p>

      {/* Antwoord opties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            className={cn(
              "h-auto py-3 px-4 justify-start text-left transition-all relative",
              getOptionStyle(option),
              selectedOption === option.id && "ring-2 ring-offset-2",
              option.isCorrect && showResult && "ring-2 ring-green-500 ring-offset-2"
            )}
            onClick={() => handleOptionClick(option)}
            disabled={showResult}
          >
            <div className="flex items-center gap-3 w-full">
              {showResult && (
                <div className="flex-shrink-0">
                  {option.isCorrect ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : selectedOption === option.id ? (
                    <X className="w-5 h-5 text-red-600" />
                  ) : null}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{option.name}</p>
                <p className="text-xs text-muted-foreground italic truncate">
                  {option.scientificName}
                </p>
              </div>
              {/* Book icon - alleen tonen als er een species ID is */}
              {option.speciesId && (
                <span
                  role="button"
                  tabIndex={-1}
                  className="flex-shrink-0 p-1 -m-1 rounded hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSpeciesSheetId(option.speciesId!);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <BookOpen className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </span>
              )}
            </div>
          </Button>
        ))}
      </div>

      {/* Volgende knop na antwoord */}
      {showResult && (
        <div className="space-y-2">
          <Button
            onClick={onNext}
            className="w-full"
            size="lg"
          >
            {isLastQuestion ? "Bekijk resultaat" : "Volgende"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Druk op Enter of Spatie om door te gaan
          </p>
        </div>
      )}

      {/* Species Sheet */}
      <SpeciesSheet
        speciesId={speciesSheetId}
        open={!!speciesSheetId}
        onOpenChange={(open) => !open && setSpeciesSheetId(null)}
      />
    </div>
  );
}
