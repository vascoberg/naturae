"use client";

import { useState } from "react";
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

export function SessionModeSelector({
  deckId,
  totalCards,
  dueCards,
  onClose,
}: SessionModeSelectorProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);

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
    router.push(`/study/${deckId}?mode=${selectedMode}`);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Kies een leermodus</h2>
        <p className="text-sm text-muted-foreground">
          Hoe wil je deze set oefenen?
        </p>
      </div>

      <div className="grid gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          const isDisabled = mode.cardCount === 0;

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
                  <p className="text-lg font-semibold">{mode.cardCount}</p>
                  <p className="text-xs text-muted-foreground">{mode.cardLabel}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
