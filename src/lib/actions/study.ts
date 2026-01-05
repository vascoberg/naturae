"use server";

import { createClient } from "@/lib/supabase/server";
import { fsrs, generatorParameters, Rating, State, type Card as FSRSCard, type Grade, createEmptyCard } from "ts-fsrs";

// Initialize FSRS with default parameters
const f = fsrs(generatorParameters());

export type UserRating = "again" | "hard" | "good";

// Map our rating names to FSRS Grade (excludes Manual)
const ratingMap: Record<UserRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
};

interface CardProgress {
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  next_review: string | null;
  times_seen: number;
  times_correct: number;
}

// Helper to check if a date is valid
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

function createFSRSCard(progress: CardProgress | null, now: Date): FSRSCard {
  // Use ts-fsrs's built-in createEmptyCard for new cards
  if (!progress || progress.state === 0 || progress.times_seen === 0) {
    return createEmptyCard(now);
  }

  // Parse dates safely
  const dueDate = progress.next_review ? new Date(progress.next_review) : now;
  const lastReviewDate = progress.last_review ? new Date(progress.last_review) : undefined;

  return {
    due: isValidDate(dueDate) ? dueDate : now,
    stability: progress.stability || 0,
    difficulty: progress.difficulty || 0,
    elapsed_days: progress.elapsed_days || 0,
    scheduled_days: progress.scheduled_days || 0,
    reps: progress.reps || 0,
    lapses: progress.lapses || 0,
    state: progress.state as State,
    last_review: lastReviewDate && isValidDate(lastReviewDate) ? lastReviewDate : undefined,
    learning_steps: 0,
  };
}

export async function recordAnswer(cardId: string, rating: UserRating) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Niet ingelogd");
  }

  // Get current progress
  const { data: currentProgress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .single();

  const now = new Date();
  const fsrsCard = createFSRSCard(currentProgress, now);
  const grade = ratingMap[rating];

  // Calculate next review using FSRS
  const schedulingResult = f.repeat(fsrsCard, now);
  const newCard = schedulingResult[grade].card;

  // Ensure the due date is valid, fallback to now + 1 day if not
  let nextReviewDate = newCard.due;
  if (!isValidDate(nextReviewDate)) {
    nextReviewDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // fallback: 1 day
  }

  // Update stats
  const newTimesSeen = (currentProgress?.times_seen || 0) + 1;
  const newTimesCorrect = (currentProgress?.times_correct || 0) + (rating === "good" ? 1 : 0);

  // Upsert progress
  const { error } = await supabase
    .from("user_progress")
    .upsert({
      user_id: user.id,
      card_id: cardId,
      stability: newCard.stability || 0,
      difficulty: newCard.difficulty || 0,
      elapsed_days: newCard.elapsed_days || 0,
      scheduled_days: newCard.scheduled_days || 0,
      reps: newCard.reps || 0,
      lapses: newCard.lapses || 0,
      state: newCard.state,
      last_review: now.toISOString(),
      next_review: nextReviewDate.toISOString(),
      times_seen: newTimesSeen,
      times_correct: newTimesCorrect,
      updated_at: now.toISOString(),
    }, {
      onConflict: "user_id,card_id",
    });

  if (error) {
    console.error("Error recording answer:", error);
    throw new Error("Kon antwoord niet opslaan");
  }

  return {
    success: true,
    nextReview: nextReviewDate.toISOString(),
    state: newCard.state,
  };
}

export async function getStudyCards(deckId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Niet ingelogd");
  }

  // Get all cards from this deck
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(`
      id,
      front_text,
      back_text,
      position,
      card_media (
        id,
        type,
        url,
        position
      )
    `)
    .eq("deck_id", deckId)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (cardsError) {
    throw new Error("Kon kaarten niet ophalen");
  }

  // Get progress
  const { data: progress } = await supabase
    .from("user_progress")
    .select("card_id, next_review, times_seen, state")
    .eq("user_id", user.id)
    .in("card_id", cards?.map(c => c.id) || []);

  const progressMap = new Map(progress?.map(p => [p.card_id, p]) || []);
  const now = new Date();

  // Sort cards: due cards first (by due date), then new cards
  const sortedCards = cards?.map(card => {
    const cardProgress = progressMap.get(card.id);
    const isDue = cardProgress?.next_review
      ? new Date(cardProgress.next_review) <= now
      : true; // New cards are always "due"
    const isNew = !cardProgress || cardProgress.times_seen === 0;

    return {
      ...card,
      isDue,
      isNew,
      progress: cardProgress,
    };
  }).sort((a, b) => {
    // First: due cards that have been seen (review cards)
    if (a.isDue && !a.isNew && (!b.isDue || b.isNew)) return -1;
    if (b.isDue && !b.isNew && (!a.isDue || a.isNew)) return 1;

    // Then: new cards
    if (a.isNew && !b.isNew) return 1;
    if (b.isNew && !a.isNew) return -1;

    // Otherwise: by position
    return a.position - b.position;
  });

  return sortedCards || [];
}

