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
  Volume2,
  Dices,
  Music,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Hoofdmodus: Flashcards of Quiz
export type MainMode = "flashcards" | "quiz";

// Flashcard submodi (voor URL params)
export type FlashcardSubMode = "order" | "shuffle" | "smart" | "photos" | "sounds";

// Flashcard UI modes (voor weergave in selector)
type FlashcardUIMode = "order" | "shuffle" | "smart" | "public";

// Openbare media type (voor flashcards met externe bronnen)
type PublicMediaType = "gbif" | "xeno-canto";

// Quiz media bron
export type QuizMediaSource = "own" | "gbif" | "xeno-canto";

// Quiz media type (voor eigen media)
export type QuizMediaType = "image" | "audio" | "mix";

// Gecombineerde session mode voor URL params
export type SessionMode = FlashcardSubMode | "quiz";

interface SessionModeSelectorProps {
  deckId: string;
  totalCards: number;
  dueCards: number;
  speciesCardsCount?: number;
  cardsWithMediaCount?: number; // Aantal kaarten met eigen media (totaal)
  cardsWithImageCount?: number; // Aantal kaarten met eigen foto's
  cardsWithAudioCount?: number; // Aantal kaarten met eigen audio
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
  cardsWithImageCount = 0,
  cardsWithAudioCount = 0,
  isGuest = false,
  onClose,
}: SessionModeSelectorProps) {
  const router = useRouter();
  const [mainMode, setMainMode] = useState<MainMode>("flashcards");
  const [flashcardUIMode, setFlashcardUIMode] = useState<FlashcardUIMode | null>(null);
  const [publicMediaType, setPublicMediaType] = useState<PublicMediaType>("gbif");
  const [cardLimit, setCardLimit] = useState<number | null>(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState<number>(10);
  const [quizMediaSource, setQuizMediaSource] = useState<QuizMediaSource>("gbif");
  const [quizMediaType, setQuizMediaType] = useState<QuizMediaType>("image");

  const hasSpeciesCards = speciesCardsCount > 0;
  const hasOwnMedia = cardsWithMediaCount > 0;
  const hasOwnImages = cardsWithImageCount > 0;
  const hasOwnAudio = cardsWithAudioCount > 0;
  const canUseQuiz = speciesCardsCount >= 1; // Minstens 1 soort nodig voor quiz (GBIF)
  const canUseOwnMediaQuiz = cardsWithMediaCount >= 1; // Minstens 1 kaart met media

  const availableLimitOptions = useMemo(() => {
    return CARD_LIMIT_OPTIONS.filter((limit) => limit < totalCards);
  }, [totalCards]);

  // Bereken het aantal beschikbare kaarten voor de huidige quiz configuratie
  const getOwnMediaCount = (mediaType: QuizMediaType) => {
    if (mediaType === "image") return cardsWithImageCount;
    if (mediaType === "audio") return cardsWithAudioCount;
    return cardsWithMediaCount; // mix: alle kaarten met media
  };

  // Max aantal vragen voor quiz (afhankelijk van bron en mediatype)
  const maxQuizQuestions = quizMediaSource === "own"
    ? getOwnMediaCount(quizMediaType)
    : speciesCardsCount; // GBIF en Xeno-canto gebruiken beide speciesCardsCount

  const availableQuizOptions = useMemo(() => {
    return QUIZ_QUESTION_OPTIONS.filter((count) => count <= maxQuizQuestions);
  }, [maxQuizQuestions]);

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

  const flashcardModes: Array<{
    id: FlashcardUIMode;
    icon: typeof ListOrdered;
    title: string;
    description: string;
    cardCount: number;
    cardLabel: string;
  }> = [
    {
      id: "order",
      icon: ListOrdered,
      title: "Volgorde",
      description: "Alle kaarten in vaste volgorde",
      cardCount: totalCards,
      cardLabel: "kaarten",
    },
    {
      id: "shuffle",
      icon: Shuffle,
      title: "Shuffle",
      description: "Alle kaarten in willekeurige volgorde",
      cardCount: totalCards,
      cardLabel: "kaarten",
    },
    {
      id: "smart",
      icon: Brain,
      title: "Slim leren",
      description: "Alleen kaarten die je moet herhalen",
      cardCount: dueCards,
      cardLabel: "te herhalen",
    },
  ];

  const publicMediaMode = hasSpeciesCards
    ? {
        id: "public" as FlashcardUIMode,
        icon: Globe,
        title: "Openbare media",
        description: "GBIF foto's of Xeno-canto geluiden",
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
      // Voeg mediaType toe voor eigen media (niet voor GBIF of Xeno-canto)
      if (quizMediaSource === "own") {
        params.set("mediaType", quizMediaType);
      }
      router.push(`/study/${deckId}?${params.toString()}`);
    } else {
      if (!flashcardUIMode) return;

      // Bepaal de echte submode voor URL
      let actualMode: FlashcardSubMode;
      if (flashcardUIMode === "public") {
        actualMode = publicMediaType === "gbif" ? "photos" : "sounds";
      } else {
        actualMode = flashcardUIMode;
      }

      const params = new URLSearchParams({ mode: actualMode });
      if (cardLimit !== null) {
        params.set("limit", cardLimit.toString());
      }
      router.push(`/study/${deckId}?${params.toString()}`);
    }
  };

  // Bepaal of quiz gestart kan worden (afhankelijk van media bron en type)
  const canStartOwnQuiz = quizMediaType === "image"
    ? hasOwnImages
    : quizMediaType === "audio"
      ? hasOwnAudio
      : hasOwnMedia;
  // GBIF en Xeno-canto vereisen beide soorten met species_id
  const canStartQuiz = quizMediaSource === "own" ? canStartOwnQuiz : canUseQuiz;
  const canStart =
    mainMode === "quiz" ? canStartQuiz : flashcardUIMode !== null;

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

          {/* Alle modes inclusief public in een array voor de grid */}
          <div className="grid grid-cols-2 gap-3">
            {[...flashcardModes, ...(publicMediaMode ? [publicMediaMode] : [])].map((mode) => {
              const Icon = mode.icon;
              const isSelected = flashcardUIMode === mode.id;
              const effectiveCount = getEffectiveCardCount(mode.cardCount);
              const isDisabled = effectiveCount === 0;
              const isPublicMode = mode.id === "public";

              return (
                <Card
                  key={mode.id}
                  className={cn(
                    "cursor-pointer transition-all",
                    isPublicMode && "border-green-200 dark:border-green-900",
                    isSelected && !isPublicMode && "ring-2 ring-primary border-primary",
                    isSelected && isPublicMode && "ring-2 ring-green-500 border-green-500",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    !isDisabled && !isSelected && !isPublicMode && "hover:border-primary/50",
                    !isDisabled && !isSelected && isPublicMode && "hover:border-green-400"
                  )}
                  onClick={() => !isDisabled && setFlashcardUIMode(mode.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          isSelected && !isPublicMode && "bg-primary text-primary-foreground",
                          isSelected && isPublicMode && "bg-green-500 text-white",
                          !isSelected && !isPublicMode && "bg-muted",
                          !isSelected && isPublicMode && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
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

          {/* Type media selectie (alleen voor openbare media) */}
          {flashcardUIMode === "public" && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium mb-3">Type media</p>
              <div className="grid grid-cols-2 gap-2">
                {/* GBIF foto's */}
                <Button
                  size="sm"
                  variant={publicMediaType === "gbif" ? "default" : "outline"}
                  onClick={() => setPublicMediaType("gbif")}
                  className="flex flex-col h-auto py-3 gap-1"
                >
                  <Leaf className="w-5 h-5" />
                  <span className="text-sm font-medium">Foto's</span>
                  <span className="text-xs text-muted-foreground">GBIF</span>
                </Button>

                {/* Xeno-canto geluiden */}
                <Button
                  size="sm"
                  variant={publicMediaType === "xeno-canto" ? "default" : "outline"}
                  onClick={() => setPublicMediaType("xeno-canto")}
                  className="flex flex-col h-auto py-3 gap-1"
                >
                  <Music className="w-5 h-5" />
                  <span className="text-sm font-medium">Geluiden</span>
                  <span className="text-xs text-muted-foreground">Xeno-canto</span>
                </Button>
              </div>
            </div>
          )}

          {/* Guest disclaimer voor Slim leren */}
          {isGuest && flashcardUIMode === "smart" && (
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

          {/* Quiz media bronnen als kaarten */}
          <div className="grid grid-cols-3 gap-2">
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
              <CardContent className="flex flex-col items-center gap-1.5 p-3 text-center">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    quizMediaSource === "own" && canUseOwnMediaQuiz
                      ? "bg-green-500 text-white"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  )}
                >
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Eigen media</h3>
                  <p className="text-xs text-muted-foreground">
                    {cardsWithMediaCount} kaarten
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* GBIF foto's kaart */}
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
              <CardContent className="flex flex-col items-center gap-1.5 p-3 text-center">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    quizMediaSource === "gbif" && canUseQuiz
                      ? "bg-green-500 text-white"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  )}
                >
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">GBIF foto's</h3>
                  <p className="text-xs text-muted-foreground">
                    {speciesCardsCount} soorten
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Xeno-canto geluiden kaart */}
            <Card
              className={cn(
                "cursor-pointer transition-all",
                !canUseQuiz && "opacity-50 cursor-not-allowed",
                quizMediaSource === "xeno-canto" && canUseQuiz && "ring-2 ring-green-500 border-green-500",
                quizMediaSource !== "xeno-canto" && canUseQuiz && "hover:border-green-400",
                "border-green-200 dark:border-green-900"
              )}
              onClick={() => canUseQuiz && setQuizMediaSource("xeno-canto")}
            >
              <CardContent className="flex flex-col items-center gap-1.5 p-3 text-center">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    quizMediaSource === "xeno-canto" && canUseQuiz
                      ? "bg-green-500 text-white"
                      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  )}
                >
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Xeno-canto</h3>
                  <p className="text-xs text-muted-foreground">
                    {speciesCardsCount} soorten
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quiz media type selectie (alleen voor eigen media) */}
          {quizMediaSource === "own" && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium mb-3">Type media</p>
              <div className="grid grid-cols-3 gap-2">
                {/* Eigen foto's */}
                <Button
                  size="sm"
                  variant={quizMediaType === "image" ? "default" : "outline"}
                  onClick={() => setQuizMediaType("image")}
                  disabled={!hasOwnImages}
                  className="flex flex-col h-auto py-2 gap-1"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-xs">Foto's</span>
                  <span className="text-xs font-semibold">{cardsWithImageCount}</span>
                </Button>

                {/* Eigen audio */}
                <Button
                  size="sm"
                  variant={quizMediaType === "audio" ? "default" : "outline"}
                  onClick={() => setQuizMediaType("audio")}
                  disabled={!hasOwnAudio}
                  className="flex flex-col h-auto py-2 gap-1"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="text-xs">Audio</span>
                  <span className="text-xs font-semibold">{cardsWithAudioCount}</span>
                </Button>

                {/* Mix */}
                <Button
                  size="sm"
                  variant={quizMediaType === "mix" ? "default" : "outline"}
                  onClick={() => setQuizMediaType("mix")}
                  disabled={!hasOwnMedia}
                  className="flex flex-col h-auto py-2 gap-1"
                >
                  <Dices className="w-4 h-4" />
                  <span className="text-xs">Mix</span>
                  <span className="text-xs font-semibold">{cardsWithMediaCount}</span>
                </Button>
              </div>
            </div>
          )}

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
