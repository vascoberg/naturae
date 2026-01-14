"use server";

import { createClient } from "@/lib/supabase/server";
import { getMediaForSpecies } from "@/lib/services/gbif-media";

// ============================================================================
// Quiz Mode Types
// ============================================================================

export interface QuizOption {
  id: string;
  name: string;
  scientificName: string;
  isCorrect: boolean;
}

export interface QuizCard {
  cardId: string;
  speciesId: string;
  correctAnswer: {
    name: string;
    scientificName: string;
  };
  options: QuizOption[];
  photo: {
    url: string;
    creator: string | null;
    license: "CC0" | "CC-BY";
    source: string;
    references: string | null;
  };
}

interface SpeciesForDistractor {
  id: string;
  scientific_name: string;
  canonical_name: string | null;
  common_names: { nl?: string } | null;
  taxonomy: {
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
  } | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getSpeciesDisplayName(species: SpeciesForDistractor, backText?: string | null): string {
  return backText || species.common_names?.nl || species.canonical_name || species.scientific_name;
}

// ============================================================================
// Quiz Server Actions
// ============================================================================

/**
 * Haal distractors op voor een soort
 * Prioriteit (van meest naar minst gelijkend):
 * 1. Zelfde genus uit deck (bijv. Apus pallidus → Apus apus)
 * 2. Zelfde genus uit hele database (voor kleine decks)
 * 3. Zelfde familie uit deck
 * 4. Zelfde familie uit hele database
 * 5. Zelfde orde uit deck (bijv. Passeriformes)
 * 6. Zelfde orde uit hele database
 * 7. Andere soorten uit deck
 * 8. Zelfde taxonomische klasse uit database (bijv. alle Aves)
 */
async function getDistractors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  correctSpecies: SpeciesForDistractor,
  deckSpeciesIds: string[], // Alle species IDs in het deck
  excludeIds: string[],
  count: number = 3
): Promise<SpeciesForDistractor[]> {
  const distractors: SpeciesForDistractor[] = [];
  const genus = correctSpecies.taxonomy?.genus;
  const family = correctSpecies.taxonomy?.family;
  const order = correctSpecies.taxonomy?.order;
  const taxonomicClass = correctSpecies.taxonomy?.class;
  const allExcludeIds = [...excludeIds, correctSpecies.id];

  // Filter deck species die we kunnen gebruiken (niet in excludeIds)
  const availableDeckSpeciesIds = deckSpeciesIds.filter(
    id => !allExcludeIds.includes(id)
  );

  // Helper om gebruikte IDs bij te houden
  const getUsedIds = () => [...allExcludeIds, ...distractors.map(d => d.id)];

  // Prioriteit 1: Zelfde genus uit deck (meest gelijkende soorten)
  if (genus && availableDeckSpeciesIds.length > 0 && distractors.length < count) {
    const { data: deckGenusMatches, error: p1Error } = await supabase
      .from("species")
      .select("id, scientific_name, canonical_name, common_names, taxonomy")
      .in("id", availableDeckSpeciesIds)
      .filter("taxonomy->>genus", "eq", genus)
      .limit(count * 2);

    if (deckGenusMatches && deckGenusMatches.length > 0) {
      const usedIds = getUsedIds();
      const filtered = deckGenusMatches.filter(s => !usedIds.includes(s.id));
      const shuffled = shuffleArray(filtered as SpeciesForDistractor[]);
      const needed = count - distractors.length;
      distractors.push(...shuffled.slice(0, needed));
    }
  }

  // Prioriteit 2: Zelfde genus uit hele database (voor kleine decks)
  if (genus && distractors.length < count) {
    const needed = count - distractors.length;
    const usedIds = getUsedIds();

    const { data: genusMatches } = await supabase
      .from("species")
      .select("id, scientific_name, canonical_name, common_names, taxonomy")
      .filter("taxonomy->>genus", "eq", genus)
      .not("id", "in", `(${usedIds.join(",")})`)
      .limit(needed * 2);

    if (genusMatches && genusMatches.length > 0) {
      const shuffled = shuffleArray(genusMatches as SpeciesForDistractor[]);
      distractors.push(...shuffled.slice(0, needed));
    }
  }

  // Prioriteit 3: Zelfde familie uit deck
  if (family && availableDeckSpeciesIds.length > 0 && distractors.length < count) {
    const usedIds = getUsedIds();
    const remainingDeckIds = availableDeckSpeciesIds.filter(id => !usedIds.includes(id));

    if (remainingDeckIds.length > 0) {
      const { data: deckFamilyMatches } = await supabase
        .from("species")
        .select("id, scientific_name, canonical_name, common_names, taxonomy")
        .in("id", remainingDeckIds)
        .filter("taxonomy->>family", "eq", family)
        .limit(count * 2);

      if (deckFamilyMatches && deckFamilyMatches.length > 0) {
        const shuffled = shuffleArray(deckFamilyMatches as SpeciesForDistractor[]);
        const needed = count - distractors.length;
        distractors.push(...shuffled.slice(0, needed));
      }
    }
  }

  // Prioriteit 4: Zelfde familie uit hele database
  if (family && distractors.length < count) {
    const needed = count - distractors.length;
    const usedIds = getUsedIds();

    const { data: familyMatches } = await supabase
      .from("species")
      .select("id, scientific_name, canonical_name, common_names, taxonomy")
      .filter("taxonomy->>family", "eq", family)
      .not("id", "in", `(${usedIds.join(",")})`)
      .limit(needed * 2);

    if (familyMatches && familyMatches.length > 0) {
      const shuffled = shuffleArray(familyMatches as SpeciesForDistractor[]);
      distractors.push(...shuffled.slice(0, needed));
    }
  }

  // Prioriteit 5: Zelfde orde uit deck (bijv. alle Passeriformes zangvogels)
  if (order && availableDeckSpeciesIds.length > 0 && distractors.length < count) {
    const usedIds = getUsedIds();
    const remainingDeckIds = availableDeckSpeciesIds.filter(id => !usedIds.includes(id));

    if (remainingDeckIds.length > 0) {
      const { data: deckOrderMatches } = await supabase
        .from("species")
        .select("id, scientific_name, canonical_name, common_names, taxonomy")
        .in("id", remainingDeckIds)
        .filter("taxonomy->>order", "eq", order)
        .limit(count * 2);

      if (deckOrderMatches && deckOrderMatches.length > 0) {
        const shuffled = shuffleArray(deckOrderMatches as SpeciesForDistractor[]);
        const needed = count - distractors.length;
        distractors.push(...shuffled.slice(0, needed));
      }
    }
  }

  // Prioriteit 6: Zelfde orde uit hele database
  if (order && distractors.length < count) {
    const needed = count - distractors.length;
    const usedIds = getUsedIds();

    const { data: orderMatches } = await supabase
      .from("species")
      .select("id, scientific_name, canonical_name, common_names, taxonomy")
      .filter("taxonomy->>order", "eq", order)
      .not("id", "in", `(${usedIds.join(",")})`)
      .limit(needed * 2);

    if (orderMatches && orderMatches.length > 0) {
      const shuffled = shuffleArray(orderMatches as SpeciesForDistractor[]);
      distractors.push(...shuffled.slice(0, needed));
    }
  }

  // Prioriteit 7: Andere soorten uit het deck
  if (distractors.length < count && availableDeckSpeciesIds.length > 0) {
    const needed = count - distractors.length;
    const usedIds = getUsedIds();
    const remainingDeckIds = availableDeckSpeciesIds.filter(id => !usedIds.includes(id));

    if (remainingDeckIds.length > 0) {
      const { data: deckOtherMatches } = await supabase
        .from("species")
        .select("id, scientific_name, canonical_name, common_names, taxonomy")
        .in("id", remainingDeckIds)
        .limit(needed * 2);

      if (deckOtherMatches && deckOtherMatches.length > 0) {
        const shuffled = shuffleArray(deckOtherMatches as SpeciesForDistractor[]);
        distractors.push(...shuffled.slice(0, needed));
      }
    }
  }

  // Prioriteit 8: Soorten uit zelfde taxonomische klasse uit hele database
  // Dit voorkomt dat amfibieën verschijnen in een vogelquiz
  if (distractors.length < count && taxonomicClass) {
    const needed = count - distractors.length;
    const usedIds = getUsedIds();

    const { data: classMatches } = await supabase
      .from("species")
      .select("id, scientific_name, canonical_name, common_names, taxonomy")
      .filter("taxonomy->>class", "eq", taxonomicClass)
      .not("id", "in", `(${usedIds.join(",")})`)
      .limit(needed * 2);

    if (classMatches && classMatches.length > 0) {
      const shuffled = shuffleArray(classMatches as SpeciesForDistractor[]);
      distractors.push(...shuffled.slice(0, needed));
    }
  }

  return distractors.slice(0, count);
}

/**
 * Haal quiz kaarten op voor een deck
 * Ondersteunt twee bronnen:
 * - "gbif": Gebruik openbare foto's van GBIF (vereist gbif_key op soorten)
 * - "own": Gebruik eigen media van kaarten (vereist card_media met type "image")
 */
export async function getQuizCards(
  deckId: string,
  options?: { limit?: number; source?: "own" | "gbif" }
): Promise<{ data: QuizCard[]; error?: string }> {
  const supabase = await createClient();
  const source = options?.source || "gbif";

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

  // Verschillende queries afhankelijk van bron
  if (source === "own") {
    return getQuizCardsWithOwnMedia(supabase, deckId, options?.limit);
  } else {
    return getQuizCardsWithGbifMedia(supabase, deckId, options?.limit);
  }
}

/**
 * Quiz met eigen media van kaarten
 */
async function getQuizCardsWithOwnMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deckId: string,
  limit?: number
): Promise<{ data: QuizCard[]; error?: string }> {
  // Get all cards with their own media AND species (voor distractors)
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(`
      id,
      back_text,
      front_text,
      position,
      species_id,
      species:species_id (
        id,
        scientific_name,
        canonical_name,
        common_names,
        taxonomy
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
    `)
    .eq("deck_id", deckId)
    .is("deleted_at", null)
    .order("position", { ascending: true });

  if (cardsError) {
    return { data: [], error: "Kon kaarten niet ophalen" };
  }

  if (!cards || cards.length === 0) {
    return { data: [], error: "Geen kaarten gevonden" };
  }

  // Helper om species object te krijgen
  const getSpeciesObject = (species: unknown): SpeciesForDistractor | null => {
    const s = Array.isArray(species) ? species[0] : species;
    if (!s || typeof s !== "object") return null;
    return s as SpeciesForDistractor;
  };

  // Filter cards that have at least one image media
  let cardsWithMedia = cards.filter((card) => {
    return card.card_media && card.card_media.some(m => m.type === "image");
  });

  if (cardsWithMedia.length === 0) {
    return { data: [], error: "Geen kaarten met afbeeldingen gevonden" };
  }

  // Shuffle cards
  cardsWithMedia = shuffleArray(cardsWithMedia);

  // Limit cards to fetch
  const fetchLimit = limit ? Math.min(cardsWithMedia.length, limit) : cardsWithMedia.length;
  const cardsToProcess = cardsWithMedia.slice(0, fetchLimit);

  // Collect all species IDs in cards with species (for distractor selection)
  const deckSpeciesIds = cards
    .map(card => getSpeciesObject(card.species)?.id)
    .filter((id): id is string => !!id);

  // Collect species IDs we'll use as correct answers
  const correctSpeciesIds = cardsToProcess
    .map(card => getSpeciesObject(card.species)?.id)
    .filter((id): id is string => !!id);

  // Build result cards with distractors
  const resultCards: QuizCard[] = [];

  for (const card of cardsToProcess) {
    // Get first image from card_media
    const imageMedia = card.card_media?.find(m => m.type === "image");
    if (!imageMedia) continue;

    const species = getSpeciesObject(card.species);

    // Bepaal het correcte antwoord (back_text of species naam)
    const correctName = card.back_text ||
      (species ? (species.common_names?.nl || species.canonical_name || species.scientific_name) : "Onbekend");
    const scientificName = species?.scientific_name || "";

    // Get distractors als er een species is
    let distractors: SpeciesForDistractor[] = [];
    if (species) {
      distractors = await getDistractors(supabase, species, deckSpeciesIds, correctSpeciesIds, 3);
    } else {
      // Geen species: gebruik andere back_text waarden als distractors
      const otherCards = cards
        .filter(c => c.id !== card.id && c.back_text)
        .slice(0, 10);
      const shuffledOthers = shuffleArray(otherCards).slice(0, 3);
      distractors = shuffledOthers.map(c => ({
        id: c.id,
        scientific_name: "",
        canonical_name: null,
        common_names: null,
        taxonomy: null,
        // Gebruik back_text als naam via getSpeciesDisplayName workaround
      }));
    }

    // Build options
    const quizOptions: QuizOption[] = [
      {
        id: species?.id || card.id,
        name: correctName,
        scientificName: scientificName,
        isCorrect: true,
      },
    ];

    // Voeg distractors toe
    if (species && distractors.length > 0) {
      quizOptions.push(...distractors.map(d => ({
        id: d.id,
        name: getSpeciesDisplayName(d),
        scientificName: d.scientific_name,
        isCorrect: false,
      })));
    } else if (!species) {
      // Gebruik back_text van andere kaarten als distractors
      const otherBackTexts = cards
        .filter(c => c.id !== card.id && c.back_text && c.back_text !== card.back_text)
        .map(c => c.back_text!)
        .slice(0, 10);
      const shuffledTexts = shuffleArray(otherBackTexts).slice(0, 3);
      quizOptions.push(...shuffledTexts.map((text, i) => ({
        id: `distractor-${i}`,
        name: text,
        scientificName: "",
        isCorrect: false,
      })));
    }

    // Shuffle options so correct answer isn't always first
    const shuffledOptions = shuffleArray(quizOptions);

    resultCards.push({
      cardId: card.id,
      speciesId: species?.id || card.id,
      correctAnswer: {
        name: correctName,
        scientificName: scientificName,
      },
      options: shuffledOptions,
      photo: {
        url: imageMedia.annotated_url || imageMedia.url,
        creator: imageMedia.attribution_name,
        license: "CC-BY", // Default, eigen media heeft geen specifieke licentie info
        source: imageMedia.attribution_source || "Eigen media",
        references: null,
      },
    });
  }

  if (resultCards.length === 0) {
    return { data: [], error: "Kon geen quiz vragen genereren" };
  }

  return { data: resultCards };
}

/**
 * Quiz met GBIF foto's (originele implementatie)
 */
async function getQuizCardsWithGbifMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deckId: string,
  limit?: number
): Promise<{ data: QuizCard[]; error?: string }> {
  // Get all cards with species that have gbif_key AND taxonomy
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(`
      id,
      back_text,
      position,
      species_id,
      species:species_id (
        id,
        scientific_name,
        canonical_name,
        common_names,
        gbif_key,
        taxonomy
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
  const getSpeciesObject = (species: unknown): SpeciesForDistractor & { gbif_key: number | null } | null => {
    const s = Array.isArray(species) ? species[0] : species;
    if (!s || typeof s !== "object") return null;
    return s as SpeciesForDistractor & { gbif_key: number | null };
  };

  // Filter cards that have a valid gbif_key
  let cardsWithGbif = cards.filter((card) => {
    const species = getSpeciesObject(card.species);
    return species && species.gbif_key;
  });

  if (cardsWithGbif.length === 0) {
    return { data: [], error: "Geen kaarten met GBIF-gekoppelde soorten gevonden" };
  }

  // Shuffle en limit VOORDAT we foto's ophalen
  cardsWithGbif = shuffleArray(cardsWithGbif);

  // Haal iets meer kaarten op dan de limit (sommige kunnen geen foto hebben)
  const fetchLimit = limit
    ? Math.min(cardsWithGbif.length, Math.ceil(limit * 1.5))
    : cardsWithGbif.length;
  const cardsToFetch = cardsWithGbif.slice(0, fetchLimit);

  // Build species list for batch photo request
  const speciesList = cardsToFetch.map((card) => {
    const species = getSpeciesObject(card.species)!;
    return {
      gbifKey: species.gbif_key!,
      cardId: card.id,
    };
  });

  // Fetch photos from GBIF (parallel)
  const photoMap = await getMediaForSpecies(speciesList);

  // Collect all species IDs in the deck (for distractor selection)
  const deckSpeciesIds = cardsWithGbif
    .map(card => getSpeciesObject(card.species)?.id)
    .filter((id): id is string => !!id);

  // Collect species IDs we'll use as correct answers (to exclude from being distractors for themselves)
  const correctSpeciesIds = cardsToFetch
    .map(card => getSpeciesObject(card.species)?.id)
    .filter((id): id is string => !!id);

  // Build result cards with distractors
  const resultCards: QuizCard[] = [];

  for (const card of cardsToFetch) {
    const species = getSpeciesObject(card.species)!;
    const photo = photoMap.get(card.id);

    // Skip cards without photos
    if (!photo) continue;

    // Get distractors for this species (prefer from deck, fallback to same taxonomic class)
    const distractors = await getDistractors(supabase, species, deckSpeciesIds, correctSpeciesIds, 3);

    // Build options: correct answer + distractors
    const correctName = getSpeciesDisplayName(species, card.back_text);
    const quizOptions: QuizOption[] = [
      {
        id: species.id,
        name: correctName,
        scientificName: species.scientific_name,
        isCorrect: true,
      },
      ...distractors.map(d => ({
        id: d.id,
        name: getSpeciesDisplayName(d),
        scientificName: d.scientific_name,
        isCorrect: false,
      })),
    ];

    // Shuffle options so correct answer isn't always first
    const shuffledOptions = shuffleArray(quizOptions);

    resultCards.push({
      cardId: card.id,
      speciesId: species.id,
      correctAnswer: {
        name: correctName,
        scientificName: species.scientific_name,
      },
      options: shuffledOptions,
      photo: {
        url: photo.identifier,
        creator: photo.creator,
        license: photo.licenseType,
        source: photo.source,
        references: photo.references,
      },
    });

    // Stop als we genoeg kaarten hebben
    if (limit && resultCards.length >= limit) {
      break;
    }
  }

  if (resultCards.length === 0) {
    return { data: [], error: "Kon geen quiz vragen genereren (geen foto's gevonden)" };
  }

  return { data: resultCards };
}

/**
 * Check of een deck geschikt is voor quiz mode
 * Returns het aantal kaarten met GBIF-gekoppelde soorten
 */
export async function checkQuizAvailability(
  deckId: string
): Promise<{ available: boolean; speciesCount: number }> {
  const supabase = await createClient();

  // We need at least 4 species total for a meaningful quiz (1 correct + 3 distractors)
  const { count: deckSpeciesCount, error: deckError } = await supabase
    .from("cards")
    .select("id, species:species_id!inner(gbif_key)", { count: "exact", head: true })
    .eq("deck_id", deckId)
    .is("deleted_at", null)
    .not("species_id", "is", null);

  if (deckError || deckSpeciesCount === null) {
    return { available: false, speciesCount: 0 };
  }

  // Also check if we have enough species in the database for distractors
  const { count: totalSpecies } = await supabase
    .from("species")
    .select("id", { count: "exact", head: true });

  // Need at least 4 species total to make a quiz work
  const hasEnoughSpecies = (totalSpecies || 0) >= 4;

  return {
    available: deckSpeciesCount > 0 && hasEnoughSpecies,
    speciesCount: deckSpeciesCount
  };
}
