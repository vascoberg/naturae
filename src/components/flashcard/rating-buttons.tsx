"use client";

import { Button } from "@/components/ui/button";

export type Rating = "again" | "hard" | "good";

interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  return (
    <div className="flex gap-3 justify-center">
      <Button
        variant="outline"
        size="lg"
        onClick={() => onRate("again")}
        disabled={disabled}
        className="flex-1 max-w-[120px] border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        Opnieuw
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={() => onRate("hard")}
        disabled={disabled}
        className="flex-1 max-w-[120px]"
        style={{
          borderColor: "hsl(var(--warning))",
          color: "hsl(var(--warning))",
        }}
      >
        Moeilijk
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={() => onRate("good")}
        disabled={disabled}
        className="flex-1 max-w-[120px] border-success text-success hover:bg-success hover:text-success-foreground"
        style={{
          borderColor: "hsl(var(--success))",
          color: "hsl(var(--success))",
        }}
      >
        Goed
      </Button>
    </div>
  );
}
