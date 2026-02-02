"use server";

import { createClient } from "@/lib/supabase/server";
import { fsrs, generatorParameters, Rating, State, type Card as FSRSCard, type Grade, createEmptyCard } from "ts-fsrs";
import { getRandomSpeciesMedia, type GBIFMediaResult } from "@/lib/services/gbif-media";
import { searchXenoCantoBySpecies, type XenoCantoResult } from "@/lib/services/xeno-canto";

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

export type StudyMode = "order" | "shuffle" | "smart" | "photos" | "sounds";

// Check of user is ingelogd
export async function isUserLoggedIn(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getStudyCards(deckId: string, mode: StudyMode = "smart", limit?: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check of deck openbaar is als user niet ingelogd is
  if (!user) {
    const { data: deck } = await supabase
      .from("decks")
      .select("is_public")
      .eq("id", deckId)
      .is("deleted_at", null)
      .single();

    if (!deck?.is_public) {
      throw new Error("Niet ingelogd");
    }
  }

  // Get all cards from this deck with species data
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(
      `
      id,
      front_text,
      back_text,
      position,
      species_id,
      species_display,
      species:species_id (
        id,
        scientific_name,
        canonical_name,
        common_names
      ),
      card_media (
        id,
        type,
        url,
        position,
        attribution_name,
        attribution_source,
        annotated_url
      )
    `
    )
    .eq("deck_id", deckId)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (cardsError) {
    throw new Error("Kon kaarten niet ophalen");
  }

  // Get progress (only for logged in users)
  let progressMap = new Map<
    string,
    { card_id: string; next_review: string | null; times_seen: number; state: number }
  >();

  if (user) {
    const { data: progress } = await supabase
      .from("user_progress")
      .select("card_id, next_review, times_seen, state")
      .eq("user_id", user.id)
      .in("card_id", cards?.map((c) => c.id) || []);

    progressMap = new Map(progress?.map((p) => [p.card_id, p]) || []);
  }

  const now = new Date();

  // Add progress info to cards
  const cardsWithProgress =
    cards?.map((card) => {
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
    }) || [];

  // Helper om limit toe te passen
  const applyLimit = <T>(arr: T[]): T[] => {
    if (limit && limit > 0) {
      return arr.slice(0, limit);
    }
    return arr;
  };

  // Apply mode-specific sorting/filtering
  switch (mode) {
    case "order":
      // Return all cards in deck order (already sorted by position)
      return applyLimit(cardsWithProgress);

    case "shuffle":
      // Return all cards in random order
      return applyLimit(shuffleArray(cardsWithProgress));

    case "smart":
    default:
      // For guests without progress, treat all cards as due
      if (!user) {
        return applyLimit(cardsWithProgress);
      }
      // Filter to only due cards, then sort: review cards first, then new cards
      const dueCards = cardsWithProgress.filter((card) => card.isDue);
      const sortedDueCards = dueCards.sort((a, b) => {
        // First: due cards that have been seen (review cards)
        if (!a.isNew && b.isNew) return -1;
        if (a.isNew && !b.isNew) return 1;
        // Otherwise: by position
        return a.position - b.position;
      });
      return applyLimit(sortedDueCards);
  }
}

// ============================================================================
// Openbare Foto's Modus
// ============================================================================

export interface PublicPhotoStudyCard {
  cardId: string;
  speciesId: string;
  /** Naam van de soort (back_text van de kaart, of GBIF naam als fallback) */
  speciesName: string;
  scientificName: string;
  backText: string | null;
  photo: {
    url: string;
    creator: string | null;
    license: "CC0" | "CC-BY" | "CC-BY-NC";
    source: string;
    references: string | null;
  } | null;
}

/**
 * Haal kaarten op met openbare foto's voor study sessie
 * Alleen kaarten met species_id en geldige gbif_key worden meegenomen
 */
export async function getPublicPhotoStudyCards(
  deckId: string,
  options?: { shuffle?: boolean; limit?: number }
): Promise<{ data: PublicPhotoStudyCard[]; error?: string }> {
  const supabase = await createClient();

  // Check of deck openbaar is of user toegang heeft
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deck } = await supabase
    .from("decks")
    .select("is_public, user_id")
    .eq("id", deckId)
    .is("deleted_at", null)
    .single();

  if (!deck) {
    return { data: [], error: "Deck niet gevonden" };
  }

  // Check access
  if (!deck.is_public && (!user || deck.user_id !== user.id)) {
    return { data: [], error: "Geen toegang tot dit deck" };
  }

  // Get all cards with species that have gbif_key
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(`
      id,
      front_text,
      back_text,
      position,
      species_id,
      species_display,
      species:species_id (
        id,
        scientific_name,
        canonical_name,
        common_names,
        gbif_key
      )
    `)
    .eq("deck_id", deckId)
    .is("deleted_at", null)
    .not("species_id", "is", null)
    .order("position", { ascending: true });

  if (cardsError) {
    return { data: [], error: "Kon kaarten niet ophalen" };
  }

  if (!cards || cards.length === 0) {
    return { data: [], error: "Geen kaarten met soorten gevonden" };
  }

  // Helper om species object te krijgen (Supabase kan array of object retourneren)
  const getSpeciesObject = (species: unknown) => {
    if (Array.isArray(species)) return species[0];
    return species;
  };

  // Filter cards that have a valid gbif_key
  let cardsWithGbif = cards.filter((card) => {
    const species = getSpeciesObject(card.species);
    return species && typeof species === "object" && "gbif_key" in species && species.gbif_key;
  });

  if (cardsWithGbif.length === 0) {
    return { data: [], error: "Geen kaarten met GBIF-gekoppelde soorten gevonden" };
  }

  // Shuffle VOORDAT we foto's ophalen
  if (options?.shuffle) {
    cardsWithGbif = shuffleArray(cardsWithGbif);
  }

  // Build result cards - haal foto's één voor één op tot we genoeg hebben
  // Dit voorkomt parallelle requests die kunnen timen en garandeert het juiste aantal
  const resultCards: PublicPhotoStudyCard[] = [];

  for (const card of cardsWithGbif) {
    // Stop zodra we genoeg kaarten hebben
    if (options?.limit && resultCards.length >= options.limit) {
      break;
    }

    const species = getSpeciesObject(card.species) as {
      id: string;
      scientific_name: string;
      canonical_name: string | null;
      common_names: { nl?: string } | null;
      gbif_key: number;
    };

    // Haal foto op voor deze specifieke soort
    const photo = await getRandomSpeciesMedia({ gbifKey: species.gbif_key, limit: 20 });

    // Skip cards without photos
    if (!photo) continue;

    // Prioriteit voor naam:
    // 1. back_text (de naam die de gebruiker heeft ingevoerd, bijv. "Bruine kikker")
    // 2. GBIF Dutch common name
    // 3. GBIF canonical name
    // 4. GBIF scientific name (altijd beschikbaar als fallback)
    const speciesName =
      card.back_text ||
      species.common_names?.nl ||
      species.canonical_name ||
      species.scientific_name;

    resultCards.push({
      cardId: card.id,
      speciesId: species.id,
      speciesName,
      scientificName: species.scientific_name,
      backText: null,
      photo: {
        url: photo.identifier,
        creator: photo.creator,
        license: photo.licenseType,
        source: photo.source,
        references: photo.references,
      },
    });
  }

  return { data: resultCards };
}

/**
 * Check of een deck geschikt is voor openbare foto's modus
 * Returns het aantal kaarten met GBIF-gekoppelde soorten
 */
export async function checkPublicPhotosAvailability(
  deckId: string
): Promise<{ available: boolean; speciesCount: number }> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("cards")
    .select("id, species:species_id!inner(gbif_key)", { count: "exact", head: true })
    .eq("deck_id", deckId)
    .is("deleted_at", null)
    .not("species_id", "is", null);

  if (error || count === null) {
    return { available: false, speciesCount: 0 };
  }

  return { available: count > 0, speciesCount: count };
}

// ============================================================================
// Xeno-canto Audio Modus
// ============================================================================

export interface XenoCantoStudyCard {
  cardId: string;
  speciesId: string;
  /** Naam van de soort (back_text van de kaart, of common name als fallback) */
  speciesName: string;
  scientificName: string;
  backText: string | null;
  audio: {
    id: string;
    /** Proxy URL voor streaming (niet direct Xeno-canto URL ivm CORS) */
    streamUrl: string;
    /** Sonogram afbeelding URL */
    sonogramUrl: string;
    recordist: string;
    type: string;
    quality: string;
    duration: string;
    country: string;
    license: string;
    pageUrl: string;
  } | null;
}

/**
 * Haal kaarten op met Xeno-canto audio voor study sessie
 * Alleen kaarten met species_id worden meegenomen
 */
export async function getXenoCantoStudyCards(
  deckId: string,
  options?: { shuffle?: boolean; limit?: number }
): Promise<{ data: XenoCantoStudyCard[]; error?: string }> {
  const supabase = await createClient();

  // Check of deck openbaar is of user toegang heeft
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deck } = await supabase
    .from("decks")
    .select("is_public, user_id")
    .eq("id", deckId)
    .is("deleted_at", null)
    .single();

  if (!deck) {
    return { data: [], error: "Deck niet gevonden" };
  }

  // Check access
  if (!deck.is_public && (!user || deck.user_id !== user.id)) {
    return { data: [], error: "Geen toegang tot dit deck" };
  }

  // Get all cards with species
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(`
      id,
      front_text,
      back_text,
      position,
      species_id,
      species_display,
      species:species_id (
        id,
        scientific_name,
        canonical_name,
        common_names
      )
    `)
    .eq("deck_id", deckId)
    .is("deleted_at", null)
    .not("species_id", "is", null)
    .order("position", { ascending: true });

  if (cardsError) {
    return { data: [], error: "Kon kaarten niet ophalen" };
  }

  if (!cards || cards.length === 0) {
    return { data: [], error: "Geen kaarten met soorten gevonden" };
  }

  // Helper om species object te krijgen (Supabase kan array of object retourneren)
  const getSpeciesObject = (species: unknown) => {
    if (Array.isArray(species)) return species[0];
    return species;
  };

  // Filter cards that have a valid species
  let cardsWithSpecies = cards.filter((card) => {
    const species = getSpeciesObject(card.species);
    return species && typeof species === "object" && "scientific_name" in species;
  });

  if (cardsWithSpecies.length === 0) {
    return { data: [], error: "Geen kaarten met soorten gevonden" };
  }

  // Shuffle VOORDAT we audio ophalen
  if (options?.shuffle) {
    cardsWithSpecies = shuffleArray(cardsWithSpecies);
  }

  // Build result cards - haal audio één voor één op tot we genoeg hebben
  const resultCards: XenoCantoStudyCard[] = [];

  for (const card of cardsWithSpecies) {
    // Stop zodra we genoeg kaarten hebben
    if (options?.limit && resultCards.length >= options.limit) {
      break;
    }
    const species = getSpeciesObject(card.species) as {
      id: string;
      scientific_name: string;
      canonical_name: string | null;
      common_names: { nl?: string } | null;
    };

    // Fetch audio from Xeno-canto (quality B or better)
    const audioResult = await searchXenoCantoBySpecies(species.scientific_name, {
      limit: 1,
      quality: "B",
    });

    // Skip cards without audio
    if (audioResult.error || audioResult.data.length === 0) continue;

    const recording = audioResult.data[0];

    // Prioriteit voor naam:
    // 1. back_text (de naam die de gebruiker heeft ingevoerd)
    // 2. Dutch common name
    // 3. Canonical name
    // 4. Scientific name (altijd beschikbaar als fallback)
    const speciesName =
      card.back_text ||
      species.common_names?.nl ||
      species.canonical_name ||
      species.scientific_name;

    resultCards.push({
      cardId: card.id,
      speciesId: species.id,
      speciesName,
      scientificName: species.scientific_name,
      backText: null,
      audio: {
        id: recording.id,
        streamUrl: `/api/xeno-canto/stream/${recording.id}`,
        sonogramUrl: recording.sonogramUrl,
        recordist: recording.recordist,
        type: recording.type,
        quality: recording.quality,
        duration: recording.duration,
        country: recording.country,
        license: recording.license,
        pageUrl: recording.pageUrl,
      },
    });

    // Stop als we genoeg kaarten hebben
    if (options?.limit && resultCards.length >= options.limit) {
      break;
    }
  }

  return { data: resultCards };
}

