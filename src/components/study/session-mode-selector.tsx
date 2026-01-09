"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ListOrdered, Shuffle, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SessionMode = "order" | "shuffle" | "smart";

interface SessionModeSelectorProps {
  deckId: string;
  totalCards: number;
  dueCards: number;
  onClose?: () => void;
}

// Vaste opties voor aantal kaarten
const CARD_LIMIT_OPTIONS = [10, 30, 60] as const;

export function SessionModeSelector({
  deckId,
  totalCards,
  dueCards,
  onClose,
}: SessionModeSelectorProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const [cardLimit, setCardLimit] = useState<number | null>(null); // null = alle kaarten

  // Bereken welke limit opties beschikbaar zijn (alleen tonen als kleiner dan totaal)
  const availableLimitOptions = useMemo(() => {
    return CARD_LIMIT_OPTIONS.filter((limit) => limit < totalCards);
  }, [totalCards]);

  // Bereken effectief aantal kaarten voor de geselecteerde modus
  const getEffectiveCardCount = (modeCardCount: number) => {
    if (cardLimit === null) return modeCardCount;
    return Math.min(cardLimit, modeCardCount);
  };

  const modes = [
    {
      id: "order" as SessionMode,
      icon: ListOrdered,
      title: "Volgorde",
      description: "Alle kaarten in vaste volgorde",
      cardCount: totalCards,
      cardLabel: "kaarten",
    },
    {
      id: "shuffle" as SessionMode,
      icon: Shuffle,
      title: "Shuffle",
      description: "Alle kaarten in willekeurige volgorde",
      cardCount: totalCards,
      cardLabel: "kaarten",
    },
    {
      id: "smart" as SessionMode,
      icon: Brain,
      title: "Slim leren",
      description: "Alleen kaarten die je moet herhalen (spaced repetition)",
      cardCount: dueCards,
      cardLabel: "te herhalen",
    },
  ];

  const handleStart = () => {
    if (!selectedMode) return;
    const params = new URLSearchParams({ mode: selectedMode });
    if (cardLimit !== null) {
      params.set("limit", cardLimit.toString());
    }
    router.push(`/study/${deckId}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Kies een leermodus</h2>
        <p className="text-sm text-muted-foreground">
          Hoe wil je deze set oefenen?
        </p>
      </div>

      <div className="grid gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          const effectiveCount = getEffectiveCardCount(mode.cardCount);
          const isDisabled = effectiveCount === 0;

          return (
            <Card
              key={mode.id}
              className={cn(
                "cursor-pointer transition-all",
                isSelected && "ring-2 ring-primary border-primary",
                isDisabled && "opacity-50 cursor-not-allowed",
                !isDisabled && !isSelected && "hover:border-primary/50"
              )}
              onClick={() => !isDisabled && setSelectedMode(mode.id)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{mode.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {mode.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">{effectiveCount}</p>
                  <p className="text-xs text-muted-foreground">{mode.cardLabel}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Aantal kaarten sectie - alleen tonen als er limit opties zijn */}
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

      <div className="flex gap-3 justify-end">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
        )}
        <Button onClick={handleStart} disabled={!selectedMode}>
          Start sessie
        </Button>
      </div>
    </div>
  );
}
