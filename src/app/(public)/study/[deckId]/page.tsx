"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flashcard } from "@/components/flashcard/flashcard";
import { RatingButtons, Rating } from "@/components/flashcard/rating-buttons";
import { getStudyCards, recordAnswer, isUserLoggedIn, type StudyMode } from "@/lib/actions/study";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Kaarten laden...</p>
      </div>
    </div>
  );
}

interface StudyCard {
  id: string;
  front_text: string;
  back_text: string;
  position: number;
  card_media: {
    id: string;
    type: string;
    url: string;
    position: "front" | "back" | "both";
    attribution_name: string | null;
    attribution_source: string | null;
  }[];
  isDue: boolean;
  isNew: boolean;
  progress?: {
    card_id: string;
    next_review: string | null;
    times_seen: number;
    state: number;
  } | null;
}

// Wrapper component met Suspense voor useSearchParams
export default function StudyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <StudyPageContent />
    </Suspense>
  );
}

// Deze component leest URL params en forceert een volledige remount via key
function StudyPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const deckId = params.deckId as string;
  const mode = (searchParams.get("mode") as StudyMode) || "smart";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  // Key forceert volledige remount van StudySession bij navigatie
  const sessionKey = `${deckId}-${mode}-${limit ?? "all"}`;

  return <StudySession key={sessionKey} deckId={deckId} mode={mode} limit={limit} />;
}

// Alle state leeft hier - wordt volledig gereset bij key change
interface StudySessionProps {
  deckId: string;
  mode: StudyMode;
  limit?: number;
}

function StudySession({ deckId, mode, limit }: StudySessionProps) {
  const router = useRouter();

  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [deckTitle, setDeckTitle] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // Stats voor deze sessie
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    incorrect: 0,
  });

  // Bepaal of voortgang moet worden opgeslagen (alleen bij slim leren EN ingelogd)
  const shouldSaveProgress = mode === "smart" && isLoggedIn === true;

  // Mode labels voor UI
  const modeLabels: Record<StudyMode, string> = {
    order: "Volgorde",
    shuffle: "Shuffle",
    smart: "Slim leren",
  };

  // Use ref to prevent double-fetch in React Strict Mode
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    async function loadCards() {
      try {
        setIsLoading(true);

        // Check login status
        const loggedIn = await isUserLoggedIn();
        setIsLoggedIn(loggedIn);

        const studyCards = await getStudyCards(deckId, mode, limit);
        setCards(studyCards);

        if (studyCards.length === 0) {
          setSessionComplete(true);
        }
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCards();
  }, [deckId, mode, limit]);

  // Laad deck titel
  useEffect(() => {
    async function loadDeckTitle() {
      try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (response.ok) {
          const deck = await response.json();
          setDeckTitle(deck.title);
        }
      } catch {
        // Ignore error, title is optional
      }
    }
    loadDeckTitle();
  }, [deckId]);

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped((prev) => !prev); // Toggle: kan nu ook terug draaien
  };

  const handleRate = async (rating: Rating) => {
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Sla voortgang alleen op bij "slim leren" modus
      if (shouldSaveProgress) {
        await recordAnswer(currentCard.id, rating);
      }

      // Update session stats
      setSessionStats((prev) => ({
        reviewed: prev.reviewed + 1,
        correct: rating === "good" ? prev.correct + 1 : prev.correct,
        incorrect: rating === "again" ? prev.incorrect + 1 : prev.incorrect,
      }));

      // Ga naar volgende kaart (ongeacht rating)
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // Alle kaarten bekeken
        setSessionComplete(true);
      }
    } catch (error) {
      console.error("Error recording answer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionComplete || isLoading) return;

      // Spatiebalk en Enter toggle altijd de kaart (voor- en achterkant)
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleFlip();
      }
      // Rating shortcuts alleen als kaart geflipped is
      if (isFlipped) {
        if (e.key === "1") handleRate("again");
        else if (e.key === "2") handleRate("hard");
        else if (e.key === "3") handleRate("good");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, sessionComplete, isLoading, currentCard]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (sessionComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sessie voltooid!</h1>
          <p className="text-muted-foreground mb-6">
            {sessionStats.reviewed === 0
              ? "Er zijn geen kaarten om te leren op dit moment."
              : `Je hebt ${sessionStats.reviewed} kaart${sessionStats.reviewed !== 1 ? "en" : ""} bestudeerd.`}
          </p>

          {sessionStats.reviewed > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-semibold text-lg">{sessionStats.reviewed}</div>
                <div className="text-muted-foreground">Bekeken</div>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <div className="font-semibold text-lg text-success">
                  {sessionStats.correct}
                </div>
                <div className="text-muted-foreground">Correct</div>
              </div>
              <div className="p-3 rounded-lg bg-destructive/10">
                <div className="font-semibold text-lg text-destructive">
                  {sessionStats.incorrect}
                </div>
                <div className="text-muted-foreground">Opnieuw</div>
              </div>
            </div>
          )}

          {/* Subtiele hint voor gasten */}
          {isLoggedIn === false && sessionStats.reviewed > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              Je voortgang is niet opgeslagen.{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>{" "}
              om je leervoortgang bij te houden.
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link href={`/decks/${deckId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Terug naar leerset
              </Link>
            </Button>
            {isLoggedIn ? (
              <Button onClick={() => router.push("/dashboard")}>
                Dashboard
              </Button>
            ) : (
              <Button asChild>
                <Link href="/discover">Meer leersets</Link>
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;
  const frontMedia = currentCard?.card_media?.filter((m) => m.position === "front" || m.position === "both").map((m) => ({
    type: m.type as "image" | "audio",
    url: m.url,
    attribution: m.attribution_source || m.attribution_name || undefined,
  }));
  const backMedia = currentCard?.card_media?.filter((m) => m.position === "back" || m.position === "both").map((m) => ({
    type: m.type as "image" | "audio",
    url: m.url,
    attribution: m.attribution_source || m.attribution_name || undefined,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/decks/${deckId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Stoppen
            </Link>
          </Button>
          <div className="text-center">
            <span className="text-sm text-muted-foreground block">
              {deckTitle || "Laden..."}
            </span>
            <span className="text-xs text-muted-foreground/70">
              {modeLabels[mode]}
            </span>
          </div>
          <span className="text-sm font-medium">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {currentCard && (
            <>
              <Flashcard
                key={currentCard.id}
                cardId={currentCard.id}
                frontText={currentCard.front_text}
                backText={currentCard.back_text}
                frontMedia={frontMedia}
                backMedia={backMedia}
                isFlipped={isFlipped}
                onFlip={handleFlip}
              />

              {/* Rating buttons of flip instructie */}
              <div className="mt-6">
                {isFlipped ? (
                  <RatingButtons
                    onRate={handleRate}
                    disabled={isSubmitting}
                  />
                ) : (
                  <p className="text-center text-muted-foreground text-sm">
                    Klik op de kaart of druk op spatie om het antwoord te zien
                  </p>
                )}
              </div>

              {/* Keyboard shortcuts hint */}
              {isFlipped && (
                <p className="text-center text-muted-foreground text-xs mt-4">
                  Sneltoetsen: 1 = Opnieuw, 2 = Moeilijk, 3 = Goed
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
