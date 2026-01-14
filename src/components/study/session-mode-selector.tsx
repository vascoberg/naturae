"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ListOrdered,
  Shuffle,
  Brain,
  Info,
  Leaf,
  CircleHelp,
  Layers,
  ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Hoofdmodus: Flashcards of Quiz
export type MainMode = "flashcards" | "quiz";

// Flashcard submodi
export type FlashcardSubMode = "order" | "shuffle" | "smart" | "photos";

// Quiz media bron
export type QuizMediaSource = "own" | "gbif";

// Gecombineerde session mode voor URL params
export type SessionMode = FlashcardSubMode | "quiz";

interface SessionModeSelectorProps {
  deckId: string;
  totalCards: number;
  dueCards: number;
  speciesCardsCount?: number;
  cardsWithMediaCount?: number; // Aantal kaarten met eigen media
  isGuest?: boolean;
  onClose?: () => void;
}

const CARD_LIMIT_OPTIONS = [10, 30, 60] as const;
const QUIZ_QUESTION_OPTIONS = [5, 10, 20] as const;

export function SessionModeSelector({
  deckId,
  totalCards,
  dueCards,
  speciesCardsCount = 0,
  cardsWithMediaCount = 0,
  isGuest = false,
  onClose,
}: SessionModeSelectorProps) {
  const router = useRouter();
  const [mainMode, setMainMode] = useState<MainMode>("flashcards");
  const [flashcardSubMode, setFlashcardSubMode] = useState<FlashcardSubMode | null>(null);
  const [cardLimit, setCardLimit] = useState<number | null>(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(10);
  const [quizMediaSource, setQuizMediaSource] = useState<QuizMediaSource>("gbif");

  const hasSpeciesCards = speciesCardsCount > 0;
  const hasOwnMedia = cardsWithMediaCount > 0;
  const canUseQuiz = speciesCardsCount >= 1; // Minstens 1 soort nodig voor quiz (GBIF)
  const canUseOwnMediaQuiz = cardsWithMediaCount >= 1; // Minstens 1 kaart met media

  const availableLimitOptions = useMemo(() => {
    return CARD_LIMIT_OPTIONS.filter((limit) => limit < totalCards);
  }, [totalCards]);

  const availableQuizOptions = useMemo(() => {
    const maxCount = quizMediaSource === "own" ? cardsWithMediaCount : speciesCardsCount;
    return QUIZ_QUESTION_OPTIONS.filter((count) => count <= maxCount);
  }, [speciesCardsCount, cardsWithMediaCount, quizMediaSource]);

  // Max aantal vragen voor quiz (afhankelijk van bron)
  const maxQuizQuestions = quizMediaSource === "own" ? cardsWithMediaCount : speciesCardsCount;

  // Reset quiz question count als deze groter is dan het max bij de nieuwe bron
  useEffect(() => {
    if (quizQuestionCount > maxQuizQuestions && maxQuizQuestions > 0) {
      // Vind de hoogste beschikbare optie
      const validOptions = QUIZ_QUESTION_OPTIONS.filter((count) => count <= maxQuizQuestions);
      if (validOptions.length > 0) {
        setQuizQuestionCount(validOptions[validOptions.length - 1]);
      } else {
        setQuizQuestionCount(maxQuizQuestions);
      }
    }
  }, [quizMediaSource, maxQuizQuestions]);

  const getEffectiveCardCount = (modeCardCount: number) => {
    if (cardLimit === null) return modeCardCount;
    return Math.min(cardLimit, modeCardCount);
  };

  const flashcardModes = [
    {
      id: "order" as FlashcardSubMode,
      icon: ListOrdered,
      title: "Volgorde",
      description: "Alle kaarten in vaste volgorde",
      cardCount: totalCards,
      cardLabel: "kaarten",
    },
    {
      id: "shuffle" as FlashcardSubMode,
      icon: Shuffle,
      title: "Shuffle",
      description: "Alle kaarten in willekeurige volgorde",
      cardCount: totalCards,
      cardLabel: "kaarten",
    },
    {
      id: "smart" as FlashcardSubMode,
      icon: Brain,
      title: "Slim leren",
      description: "Alleen kaarten die je moet herhalen",
      cardCount: dueCards,
      cardLabel: "te herhalen",
    },
  ];

  const publicPhotosMode = hasSpeciesCards
    ? {
        id: "photos" as FlashcardSubMode,
        icon: Leaf,
        title: "Openbare foto's",
        description: "Leer met gevarieerde natuurfoto's",
        cardCount: speciesCardsCount,
        cardLabel: "soorten",
      }
    : null;

  const handleStart = () => {
    if (mainMode === "quiz") {
      const params = new URLSearchParams({
        mode: "quiz",
        limit: quizQuestionCount.toString(),
        source: quizMediaSource,
      });
      router.push(`/study/${deckId}?${params.toString()}`);
    } else {
      if (!flashcardSubMode) return;
      const params = new URLSearchParams({ mode: flashcardSubMode });
      if (cardLimit !== null) {
        params.set("limit", cardLimit.toString());
      }
      router.push(`/study/${deckId}?${params.toString()}`);
    }
  };

  // Bepaal of quiz gestart kan worden (afhankelijk van media bron)
  const canStartQuiz = quizMediaSource === "own" ? canUseOwnMediaQuiz : canUseQuiz;
  const canStart =
    mainMode === "quiz" ? canStartQuiz : flashcardSubMode !== null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Kies een leermodus</h2>
        <p className="text-sm text-muted-foreground">
          Hoe wil je deze set oefenen?
        </p>
      </div>

      {/* Hoofdmodus toggle: Flashcards of Quiz */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className={cn(
            "cursor-pointer transition-all",
            mainMode === "flashcards" && "ring-2 ring-primary border-primary",
            mainMode !== "flashcards" && "hover:border-primary/50"
          )}
          onClick={() => setMainMode("flashcards")}
        >
          <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
            <div
              className={cn(
                "p-3 rounded-lg",
                mainMode === "flashcards"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium">Flashcards</h3>
              <p className="text-xs text-muted-foreground">
                Bekijk vraag & antwoord
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all",
            !canUseQuiz && "opacity-50 cursor-not-allowed",
            mainMode === "quiz" && canUseQuiz && "ring-2 ring-green-500 border-green-500",
            mainMode !== "quiz" && canUseQuiz && "hover:border-green-400",
            "border-green-200 dark:border-green-900"
          )}
          onClick={() => canUseQuiz && setMainMode("quiz")}
        >
          <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
            <div
              className={cn(
                "p-3 rounded-lg",
                mainMode === "quiz"
                  ? "bg-green-500 text-white"
                  : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              )}
            >
              <CircleHelp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium">Quiz</h3>
              <p className="text-xs text-muted-foreground">
                {canUseQuiz
                  ? "Meerkeuze met foto's"
                  : "Geen soorten gekoppeld"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flashcard submodi - 2x2 grid */}
      {mainMode === "flashcards" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Kies een methode
          </p>

          {/* Alle modes inclusief photos in een array voor de grid */}
          <div className="grid grid-cols-2 gap-3">
            {[...flashcardModes, ...(publicPhotosMode ? [publicPhotosMode] : [])].map((mode) => {
              const Icon = mode.icon;
              const isSelected = flashcardSubMode === mode.id;
              const effectiveCount = getEffectiveCardCount(mode.cardCount);
              const isDisabled = effectiveCount === 0;
              const isPhotosMode = mode.id === "photos";

              return (
                <Card
                  key={mode.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    isPhotosMode && "border-green-200 dark:border-green-900",
                    isSelected && !isPhotosMode && "ring-2 ring-primary border-primary",
                    isSelected && isPhotosMode && "ring-2 ring-green-500 border-green-500",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    !isDisabled && !isSelected && !isPhotosMode && "hover:border-primary/50",
                    !isDisabled && !isSelected && isPhotosMode && "hover:border-green-400"
                  )}
                  onClick={() => !isDisabled && setFlashcardSubMode(mode.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          isSelected && !isPhotosMode && "bg-primary text-primary-foreground",
                          isSelected && isPhotosMode && "bg-green-500 text-white",
                          !isSelected && !isPhotosMode && "bg-muted",
                          !isSelected && isPhotosMode && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-medium text-sm">{mode.title}</h3>
                          <span className="text-sm font-semibold tabular-nums">
                            {effectiveCount}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Guest disclaimer voor Slim leren */}
          {isGuest && flashcardSubMode === "smart" && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 flex gap-3">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>{" "}
                om je voortgang op te slaan.
              </p>
            </div>
          )}

          {/* Aantal kaarten voor flashcards */}
          {availableLimitOptions.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium mb-3">Aantal kaarten</p>
              <div className="flex flex-wrap gap-2">
                {availableLimitOptions.map((limit) => (
                  <Button
                    key={limit}
                    size="sm"
                    variant={cardLimit === limit ? "default" : "outline"}
                    onClick={() => setCardLimit(limit)}
                  >
                    {limit}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant={cardLimit === null ? "default" : "outline"}
                  onClick={() => setCardLimit(null)}
                >
                  Alle ({totalCards})
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quiz instellingen */}
      {mainMode === "quiz" && (canUseQuiz || canUseOwnMediaQuiz) && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Kies een methode
          </p>

          {/* Quiz media bronnen als kaarten - zelfde stijl als flashcard modes */}
          <div className="grid grid-cols-2 gap-3">
            {/* Eigen media kaart */}
            <Card
              className={cn(
                "cursor-pointer transition-all",
                !canUseOwnMediaQuiz && "opacity-50 cursor-not-allowed",
                quizMediaSource === "own" && canUseOwnMediaQuiz && "ring-2 ring-green-500 border-green-500",
                quizMediaSource !== "own" && canUseOwnMediaQuiz && "hover:border-green-400",
                "border-green-200 dark:border-green-900"
              )}
              onClick={() => canUseOwnMediaQuiz && setQuizMediaSource("own")}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      quizMediaSource === "own" && canUseOwnMediaQuiz
                        ? "bg-green-500 text-white"
                        : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    )}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-medium text-sm">Eigen media</h3>
                      <span className="text-sm font-semibold tabular-nums">
                        {cardsWithMediaCount}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      Gebruik je eigen foto's
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Openbare foto's kaart */}
            <Card
              className={cn(
                "cursor-pointer transition-all",
                !canUseQuiz && "opacity-50 cursor-not-allowed",
                quizMediaSource === "gbif" && canUseQuiz && "ring-2 ring-green-500 border-green-500",
                quizMediaSource !== "gbif" && canUseQuiz && "hover:border-green-400",
                "border-green-200 dark:border-green-900"
              )}
              onClick={() => canUseQuiz && setQuizMediaSource("gbif")}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      quizMediaSource === "gbif" && canUseQuiz
                        ? "bg-green-500 text-white"
                        : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    )}
                  >
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-medium text-sm">Openbare foto's</h3>
                      <span className="text-sm font-semibold tabular-nums">
                        {speciesCardsCount}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      Gevarieerde natuurfoto's
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aantal vragen */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium mb-3">Aantal vragen</p>
            <div className="flex flex-wrap gap-2">
              {availableQuizOptions.map((count) => (
                <Button
                  key={count}
                  size="sm"
                  variant={quizQuestionCount === count ? "default" : "outline"}
                  onClick={() => setQuizQuestionCount(count)}
                >
                  {count}
                </Button>
              ))}
              {maxQuizQuestions > 20 && (
                <Button
                  size="sm"
                  variant={quizQuestionCount === maxQuizQuestions ? "default" : "outline"}
                  onClick={() => setQuizQuestionCount(maxQuizQuestions)}
                >
                  Alle ({maxQuizQuestions})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
        )}
        <Button onClick={handleStart} disabled={!canStart}>
          Start sessie
        </Button>
      </div>
    </div>
  );
}
