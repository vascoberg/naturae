"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhotoAttribution } from "@/components/ui/photo-attribution";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Check, X, ArrowRight } from "lucide-react";
import type { QuizCard, QuizOption } from "@/lib/actions/quiz";

interface QuizQuestionProps {
  question: QuizCard;
  onAnswer: (selectedId: string, isCorrect: boolean) => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
  isLastQuestion: boolean;
}

export function QuizQuestion({
  question,
  onAnswer,
  onNext,
  questionNumber,
  totalQuestions,
  isLastQuestion,
}: QuizQuestionProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Reset state wanneer de vraag verandert
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setSelectedOption(null);
    setShowResult(false);
    setHasAnswered(false);
  }, [question.cardId]);

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

      {/* Foto kaart */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Afbeelding */}
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
                src={question.photo.url}
                alt="Quiz foto"
                fill
                className={cn(
                  "object-contain transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, 512px"
                unoptimized
              />
            )}
          </div>

          {/* Attributie */}
          <div className="p-3 border-t bg-muted/30">
            <PhotoAttribution
              creator={question.photo.creator}
              license={question.photo.license}
              source={question.photo.source}
              references={question.photo.references}
            />
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
    </div>
  );
}
