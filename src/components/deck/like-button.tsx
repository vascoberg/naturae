"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLike } from "@/lib/actions/likes";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  deckId: string;
  initialLiked: boolean;
  initialCount: number;
  isGuest?: boolean;
}

export function LikeButton({
  deckId,
  initialLiked,
  initialCount,
  isGuest = false,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [showGuestMessage, setShowGuestMessage] = useState(false);

  const handleClick = () => {
    if (isGuest) {
      setShowGuestMessage(true);
      setTimeout(() => setShowGuestMessage(false), 3000);
      return;
    }

    // Optimistic update
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    startTransition(async () => {
      const result = await toggleLike(deckId);

      if (result.error) {
        // Revert on error
        setIsLiked(!newLiked);
        setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
      }
    });
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "gap-2 transition-colors",
          isLiked && "text-red-500 border-red-200 hover:text-red-600 hover:border-red-300"
        )}
      >
        <Heart
          className={cn(
            "w-4 h-4 transition-all",
            isLiked && "fill-current"
          )}
        />
        <span>{likeCount}</span>
      </Button>

      {showGuestMessage && (
        <div className="absolute top-full mt-2 left-0 right-0 min-w-max">
          <div className="bg-muted text-muted-foreground text-xs px-3 py-2 rounded-md shadow-md">
            Log in om leersets te bewaren
          </div>
        </div>
      )}
    </div>
  );
}
