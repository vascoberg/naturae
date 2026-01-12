"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SessionModeSelector } from "@/components/study/session-mode-selector";

interface StartStudyButtonProps {
  deckId: string;
  totalCards: number;
  dueCards: number;
  speciesCardsCount?: number;
  hasStarted: boolean;
  isGuest?: boolean;
}

export function StartStudyButton({
  deckId,
  totalCards,
  dueCards,
  speciesCardsCount = 0,
  hasStarted,
  isGuest = false,
}: StartStudyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setIsOpen(true)} disabled={totalCards === 0}>
        {hasStarted ? "Ga verder met leren" : "Start met leren"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Kies leermodus</DialogTitle>
          </DialogHeader>
          <SessionModeSelector
            deckId={deckId}
            totalCards={totalCards}
            dueCards={dueCards}
            speciesCardsCount={speciesCardsCount}
            isGuest={isGuest}
            onClose={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
