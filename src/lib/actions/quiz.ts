"use server";

import { createClient } from "@/lib/supabase/server";
import { getRandomSpeciesMedia } from "@/lib/services/gbif-media";
import { searchXenoCantoBySpecies, type XenoCantoResult } from "@/lib/services/xeno-canto";

// ============================================================================
// Quiz Mode Types
// ============================================================================

export interface QuizOption {
  id: string;
  name: string;
  scientificName: string;
  isCorrect: boolean;
  speciesId?: string; // Species ID voor soortenpagina link (undefined voor non-species distractors)
}

export type QuizMediaType = "image" | "audio";

export interface QuizCard {
  cardId: string;
  speciesId: string;
  correctAnswer: {
    name: string;
    scientificName: string;
  };
  options: QuizOption[];
  mediaType: QuizMediaType;
  photo?: {
    url: string;
    creator: string | null;
    license: "CC0" | "CC-BY" | "CC-BY-NC";
    source: string;
    references: string | null;
  };
  audio?: {
    url: string;
    creator: string | null;
    source: string;
    /** Sonogram image URL (for Xeno-canto audio) */
    sonogramUrl?: string;
    /** Recording ID for stream proxy (for Xeno-canto) */
    xenoCantoId?: string;
    /** License for Xeno-canto recordings */
    license?: string;
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

function getSpeciesDisplayName(
  species: SpeciesForDistractor,
  backText?: string | null,
  deckBackTextMap?: Map<string, string>
): string {
  // Prioriteit: 1) meegegeven backText, 2) deck backText map, 3) species common_names, 4) canonical_name, 5) scientific_name
  if (backText) return backText;
  if (deckBackTextMap?.has(species.id)) return deckBackTextMap.get(species.id)!;
  return species.common_names?.nl || species.canonical_name || species.scientific_name;
}

// ============================================================================
// Quiz Server Actions
// ============================================================================

/**
 * Haal distractors op voor een soort
 *
 * Deck-first benadering: eerst alle deck-opties uitputten voordat we naar de database gaan.
 * Dit zorgt ervoor dat quizvragen zo veel mogelijk soorten uit de leerset gebruiken.
 *
 * Prioriteit (van meest naar minst gelijkend):
 * 1. Zelfde genus uit deck (bijv. Apus pallidus → Apus apus)
 * 2. Zelfde familie uit deck
 * 3. Zelfde orde uit deck (bijv. Passeriformes)
 * 4. Andere soorten uit deck
 * --- Fallback naar database (alleen als deck niet genoeg opties heeft) ---
 * 5. Zelfde genus uit hele database
 * 6. Zelfde familie uit hele database
 * 7. Zelfde orde uit hele database
 * 8. Zelfde taxonomische klasse uit database (bijv. alle Aves)
 */
async function getDistractors(
  supabase: Awaited<ReturnType<typeof createClient>>,
  correctSpecies: SpeciesForDistractor,
  deckSpeciesIds: string[], // Alle species IDs in het deck
  excludeIds: string[],
  count: number = 3,
  deckBackTextMap?: Map<string, string> // Map van speciesId -> back_text uit het deck
): Promise<{ distractors: SpeciesForDistractor[]; debug: DistractorDebugLog }> {
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

  // Debug log voor browser
  const debug: DistractorDebugLog = {
    correctSpecies: correctSpecies.scientific_name,
    taxonomy: { genus, family, order, class: taxonomicClass },
    deckSpeciesCount: deckSpeciesIds.length,
    availableDeckCount: availableDeckSpeciesIds.length,
    priorities: [],
    finalDistractors: [],
  };

  // Helper om gebruikte IDs bij te houden
  const getUsedIds = () => [...allExcludeIds, ...distractors.map(d => d.id)];

  // ============================================================================
  // DEEL 1: Deck-opties (prioriteit 1-4)
  // ============================================================================

  // Prioriteit 1: Zelfde genus uit deck (meest gelijkende soorten)
  if (genus && availableDeckSpeciesIds.length > 0 && distractors.length < count) {
    const { data: deckGenusMatches } = await supabase
      .from("species")
      .select("id, scientific_name, canonical_name, common_names, taxonomy")
      .in("id", availableDeckSpeciesIds)
      .filter("taxonomy->>genus", "eq", genus)
      .limit(count * 2);

    const matches = deckGenusMatches?.map(s => s.scientific_name) || [];
    let selected: string[] = [];

    if (deckGenusMatches && deckGenusMatches.length > 0) {
      const usedIds = getUsedIds();
      const filtered = deckGenusMatches.filter(s => !usedIds.includes(s.id));
      const shuffled = shuffleArray(filtered as SpeciesForDistractor[]);
      const needed = count - distractors.length;
      const selectedItems = shuffled.slice(0, needed);
      selected = selectedItems.map(s => s.scientific_name);
      distractors.push(...selectedItems);
    }
    debug.priorities.push({ level: `P1: Genus "${genus}" (deck)`, matches, selected });
  }

  // Prioriteit 2: Zelfde familie uit deck
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

      const matches = deckFamilyMatches?.map(s => s.scientific_name) || [];
      let selected: string[] = [];

      if (deckFamilyMatches && deckFamilyMatches.length > 0) {
        const shuffled = shuffleArray(deckFamilyMatches as SpeciesForDistractor[]);
        const needed = count - distractors.length;
        const selectedItems = shuffled.slice(0, needed);
        selected = selectedItems.map(s => s.scientific_name);
        distractors.push(...selectedItems);
      }
      debug.priorities.push({ level: `P2: Family "${family}" (deck)`, matches, selected });
    }
  }

  // Prioriteit 3: Zelfde orde uit deck (bijv. alle Passeriformes zangvogels)
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

      const matches = deckOrderMatches?.map(s => s.scientific_name) || [];
      let selected: string[] = [];

      if (deckOrderMatches && deckOrderMatches.length > 0) {
        const shuffled = shuffleArray(deckOrderMatches as SpeciesForDistractor[]);
        const needed = count - distractors.length;
        const selectedItems = shuffled.slice(0, needed);
        selected = selectedItems.map(s => s.scientific_name);
        distractors.push(...selectedItems);
      }
      debug.priorities.push({ level: `P3: Order "${order}" (deck)`, matches, selected });
    }
  }

  // Prioriteit 4: Andere soorten uit het deck (ongeacht taxonomie)
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

      const matches = deckOtherMatches?.map(s => s.scientific_name) || [];
      let selected: string[] = [];

      if (deckOtherMatches && deckOtherMatches.length > 0) {
        const shuffled = shuffleArray(deckOtherMatches as SpeciesForDistractor[]);
        const selectedItems = shuffled.slice(0, needed);
        selected = selectedItems.map(s => s.scientific_name);
        distractors.push(...selectedItems);
      }
      debug.priorities.push({ level: "P4: Other (deck)", matches, selected });
    }
  }

  // ============================================================================
  // DEEL 2: Database fallback (prioriteit 5-8)
  // Alleen als het deck niet genoeg distractors heeft
  // ============================================================================

  // Prioriteit 5: Zelfde genus uit hele database
  if (genus && distractors.length < count) {
    const needed = count - distractors.length;
    const usedIds = getUsedIds();

    const { data: genusMatches } = await supabase
      .from("species")
      .select("id, scientific_name, canonical_name, common_names, taxonomy")
      .filter("taxonomy->>genus", "eq", genus)
      .not("id", "in", `(${usedIds.join(",")})`)
      .limit(needed * 2);

    const matches = genusMatches?.map(s => s.scientific_name) || [];
    let selected: string[] = [];

    if (genusMatches && genusMatches.length > 0) {
      const shuffled = shuffleArray(genusMatches as SpeciesForDistractor[]);
      const selectedItems = shuffled.slice(0, needed);
      selected = selectedItems.map(s => s.scientific_name);
      distractors.push(...selectedItems);
    }
    debug.priorities.push({ level: `P5: Genus "${genus}" (DB)`, matches, selected });
  }

  // Prioriteit 6: Zelfde familie uit hele database
  if (family && distractors.length < count) {
    const needed = count - distractors.length;
    const usedIds = getUsedIds();

    const { data: familyMatches } = await supabase
      .from("species")
      .select("id, scientific_name, canonical_name, common_names, taxonomy")
      .filter("taxonomy->>family", "eq", family)
      .not("id", "in", `(${usedIds.join(",")})`)
      .limit(needed * 2);

    const matches = familyMatches?.map(s => s.scientific_name) || [];
    let selected: string[] = [];

    if (familyMatches && familyMatches.length > 0) {
      const shuffled = shuffleArray(familyMatches as SpeciesForDistractor[]);
      const selectedItems = shuffled.slice(0, needed);
      selected = selectedItems.map(s => s.scientific_name);
      distractors.push(...selectedItems);
    }
    debug.priorities.push({ level: `P6: Family "${family}" (DB)`, matches, selected });
  }

  // Prioriteit 7: Zelfde orde uit hele database
  if (order && distractors.length < count) {
    const needed = count - distractors.length;
    const usedIds = getUsedIds();

    const { data: orderMatches } = await supabase
      .from("species")
      .select("id, scientific_name, canonical_name, common_names, taxonomy")
      .filter("taxonomy->>order", "eq", order)
      .not("id", "in", `(${usedIds.join(",")})`)
      .limit(needed * 2);

    const matches = orderMatches?.map(s => s.scientific_name) || [];
    let selected: string[] = [];

    if (orderMatches && orderMatches.length > 0) {
      const shuffled = shuffleArray(orderMatches as SpeciesForDistractor[]);
      const selectedItems = shuffled.slice(0, needed);
      selected = selectedItems.map(s => s.scientific_name);
      distractors.push(...selectedItems);
    }
    debug.priorities.push({ level: `P7: Order "${order}" (DB)`, matches, selected });
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

    const matches = classMatches?.map(s => s.scientific_name) || [];
    let selected: string[] = [];

    if (classMatches && classMatches.length > 0) {
      const shuffled = shuffleArray(classMatches as SpeciesForDistractor[]);
      const selectedItems = shuffled.slice(0, needed);
      selected = selectedItems.map(s => s.scientific_name);
      distractors.push(...selectedItems);
    }
    debug.priorities.push({ level: `P8: Class "${taxonomicClass}" (DB)`, matches, selected });
  }

  // Final distractors
  const finalDistractors = distractors.slice(0, count);
  debug.finalDistractors = finalDistractors.map(d => `${d.scientific_name} (${d.common_names?.nl || d.canonical_name || "no name"})`);

  return { distractors: finalDistractors, debug };
}

/**
 * Haal quiz kaarten op voor een deck
 * Ondersteunt drie bronnen:
 * - "gbif": Gebruik openbare foto's van GBIF (vereist gbif_key op soorten)
 * - "own": Gebruik eigen media van kaarten (image, audio, of mix)
 * - "xeno-canto": Gebruik geluiden van Xeno-canto (voor vogels, kikkers, etc.)
 */
// Debug log type voor browser logging
export interface DistractorDebugLog {
  correctSpecies: string;
  taxonomy: { genus?: string; family?: string; order?: string; class?: string };
  deckSpeciesCount: number;
  availableDeckCount: number;
  priorities: Array<{
    level: string;
    matches: string[];
    selected: string[];
  }>;
  finalDistractors: string[];
}

export async function getQuizCards(
  deckId: string,
  options?: {
    limit?: number;
    source?: "own" | "gbif" | "xeno-canto";
    mediaType?: "image" | "audio" | "mix"; // Alleen relevant voor source="own"
  }
): Promise<{ data: QuizCard[]; error?: string; _debug?: DistractorDebugLog[] }> {
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
    return getQuizCardsWithOwnMedia(supabase, deckId, options?.limit, options?.mediaType || "image");
  } else if (source === "xeno-canto") {
    return getQuizCardsWithXenoCantoMedia(supabase, deckId, options?.limit);
  } else {
    return getQuizCardsWithGbifMedia(supabase, deckId, options?.limit);
  }
}

/**
 * Quiz met eigen media van kaarten
 * Ondersteunt image, audio, of mix
 */
async function getQuizCardsWithOwnMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deckId: string,
  limit?: number,
  mediaType: "image" | "audio" | "mix" = "image"
): Promise<{ data: QuizCard[]; error?: string; _debug?: DistractorDebugLog[] }> {
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

  // Filter cards based on mediaType
  let cardsWithMedia = cards.filter((card) => {
    if (!card.card_media || card.card_media.length === 0) return false;
    if (mediaType === "image") {
      return card.card_media.some(m => m.type === "image");
    } else if (mediaType === "audio") {
      return card.card_media.some(m => m.type === "audio");
    } else {
      // mix: any media type
      return card.card_media.some(m => m.type === "image" || m.type === "audio");
    }
  });

  if (cardsWithMedia.length === 0) {
    const errorMsg = mediaType === "audio"
      ? "Geen kaarten met audio gevonden"
      : mediaType === "mix"
        ? "Geen kaarten met media gevonden"
        : "Geen kaarten met afbeeldingen gevonden";
    return { data: [], error: errorMsg };
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

  // Build a map of speciesId -> back_text for deck cards (for consistent naming)
  const deckBackTextMap = new Map<string, string>();
  for (const card of cards) {
    const speciesId = getSpeciesObject(card.species)?.id;
    if (speciesId && card.back_text) {
      deckBackTextMap.set(speciesId, card.back_text);
    }
  }

  // Build result cards with distractors
  const resultCards: QuizCard[] = [];
  const debugLogs: DistractorDebugLog[] = [];

  for (const card of cardsToProcess) {
    // Determine which media to use based on mediaType
    let selectedMedia: typeof card.card_media[0] | undefined;
    let selectedMediaType: QuizMediaType;

    if (mediaType === "mix") {
      // For mix mode, randomly pick image or audio (preferring what's available)
      const hasImage = card.card_media?.some(m => m.type === "image");
      const hasAudio = card.card_media?.some(m => m.type === "audio");
      if (hasImage && hasAudio) {
        // Random keuze
        selectedMediaType = Math.random() < 0.5 ? "image" : "audio";
      } else if (hasImage) {
        selectedMediaType = "image";
      } else {
        selectedMediaType = "audio";
      }
      selectedMedia = card.card_media?.find(m => m.type === selectedMediaType);
    } else {
      selectedMediaType = mediaType;
      selectedMedia = card.card_media?.find(m => m.type === mediaType);
    }

    if (!selectedMedia) continue;

    const species = getSpeciesObject(card.species);

    // Bepaal het correcte antwoord (back_text of species naam)
    const correctName = card.back_text ||
      (species ? (species.common_names?.nl || species.canonical_name || species.scientific_name) : "Onbekend");
    const scientificName = species?.scientific_name || "";

    // Get distractors als er een species is
    let distractors: SpeciesForDistractor[] = [];
    if (species) {
      // Alleen de huidige species wordt uitgesloten (binnen getDistractors)
      // Andere "correct answer" species mogen wel als distractor voor andere vragen
      const result = await getDistractors(supabase, species, deckSpeciesIds, [], 3, deckBackTextMap);
      distractors = result.distractors;
      debugLogs.push(result.debug);
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
        speciesId: species?.id, // undefined als er geen species is
      },
    ];

    // Voeg distractors toe
    if (species && distractors.length > 0) {
      quizOptions.push(...distractors.map(d => ({
        id: d.id,
        name: getSpeciesDisplayName(d, null, deckBackTextMap),
        scientificName: d.scientific_name,
        isCorrect: false,
        speciesId: d.id,
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
        // speciesId is undefined - geen Book icon voor non-species distractors
      })));
    }

    // Shuffle options so correct answer isn't always first
    const shuffledOptions = shuffleArray(quizOptions);

    // Build the quiz card based on media type
    const quizCard: QuizCard = {
      cardId: card.id,
      speciesId: species?.id || card.id,
      correctAnswer: {
        name: correctName,
        scientificName: scientificName,
      },
      options: shuffledOptions,
      mediaType: selectedMediaType,
    };

    if (selectedMediaType === "image") {
      quizCard.photo = {
        url: selectedMedia.annotated_url || selectedMedia.url,
        creator: selectedMedia.attribution_name,
        license: "CC-BY", // Default, eigen media heeft geen specifieke licentie info
        source: selectedMedia.attribution_source || "Eigen media",
        references: null,
      };
    } else {
      quizCard.audio = {
        url: selectedMedia.url,
        creator: selectedMedia.attribution_name,
        source: selectedMedia.attribution_source || "Eigen media",
      };
    }

    resultCards.push(quizCard);
  }

  if (resultCards.length === 0) {
    return { data: [], error: "Kon geen quiz vragen genereren" };
  }

  return { data: resultCards, _debug: debugLogs };
}

/**
 * Quiz met GBIF foto's (originele implementatie)
 */
async function getQuizCardsWithGbifMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deckId: string,
  limit?: number
): Promise<{ data: QuizCard[]; error?: string; _debug?: DistractorDebugLog[] }> {
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

  // Shuffle VOORDAT we foto's ophalen
  cardsWithGbif = shuffleArray(cardsWithGbif);

  // Collect all species IDs in the deck (for distractor selection)
  const deckSpeciesIds = cardsWithGbif
    .map(card => getSpeciesObject(card.species)?.id)
    .filter((id): id is string => !!id);

  // Build a map of speciesId -> back_text for deck cards (for consistent naming)
  const deckBackTextMap = new Map<string, string>();
  for (const card of cardsWithGbif) {
    const speciesId = getSpeciesObject(card.species)?.id;
    if (speciesId && card.back_text) {
      deckBackTextMap.set(speciesId, card.back_text);
    }
  }

  // Build result cards - haal foto's één voor één op tot we genoeg hebben
  // Dit voorkomt dat we 100 parallelle requests doen die kunnen timen
  const resultCards: QuizCard[] = [];
  const debugLogs: DistractorDebugLog[] = [];

  for (const card of cardsWithGbif) {
    // Stop zodra we genoeg kaarten hebben
    if (limit && resultCards.length >= limit) {
      break;
    }

    const species = getSpeciesObject(card.species)!;

    // Haal foto op voor deze specifieke soort
    const photo = await getRandomSpeciesMedia({ gbifKey: species.gbif_key!, limit: 20 });

    // Skip als geen foto gevonden
    if (!photo) continue;

    // Get distractors for this species (prefer from deck, fallback to same taxonomic class)
    const { distractors, debug } = await getDistractors(supabase, species, deckSpeciesIds, [], 3, deckBackTextMap);
    debugLogs.push(debug);

    // Build options: correct answer + distractors
    const correctName = getSpeciesDisplayName(species, card.back_text, deckBackTextMap);
    const quizOptions: QuizOption[] = [
      {
        id: species.id,
        name: correctName,
        scientificName: species.scientific_name,
        isCorrect: true,
        speciesId: species.id,
      },
      ...distractors.map(d => ({
        id: d.id,
        name: getSpeciesDisplayName(d, null, deckBackTextMap),
        scientificName: d.scientific_name,
        isCorrect: false,
        speciesId: d.id,
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
      mediaType: "image",
      photo: {
        url: photo.identifier,
        creator: photo.creator,
        license: photo.licenseType,
        source: photo.source,
        references: photo.references,
      },
    });
  }

  if (resultCards.length === 0) {
    return { data: [], error: "Kon geen quiz vragen genereren (geen foto's gevonden)" };
  }

  return { data: resultCards, _debug: debugLogs };
}

/**
 * Quiz met Xeno-canto geluiden
 * Haalt random geluiden op van Xeno-canto voor soorten in het deck
 */
async function getQuizCardsWithXenoCantoMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  deckId: string,
  limit?: number
): Promise<{ data: QuizCard[]; error?: string; _debug?: DistractorDebugLog[] }> {
  // Get all cards with species that have scientific_name
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

  // Helper om species object te krijgen
  const getSpeciesObject = (species: unknown): SpeciesForDistractor | null => {
    const s = Array.isArray(species) ? species[0] : species;
    if (!s || typeof s !== "object") return null;
    return s as SpeciesForDistractor;
  };

  // Filter cards that have a valid scientific_name
  let cardsWithSpecies = cards.filter((card) => {
    const species = getSpeciesObject(card.species);
    return species && species.scientific_name;
  });

  if (cardsWithSpecies.length === 0) {
    return { data: [], error: "Geen kaarten met soorten gevonden" };
  }

  // Shuffle VOORDAT we audio ophalen
  cardsWithSpecies = shuffleArray(cardsWithSpecies);

  // Haal ALLE kaarten op - we filteren later op basis van beschikbare audio
  // Dit zorgt ervoor dat we altijd het gevraagde aantal vragen kunnen leveren
  // (mits er genoeg kaarten met audio zijn)
  const cardsToFetch = cardsWithSpecies;

  // Collect all species IDs in the deck (for distractor selection)
  const deckSpeciesIds = cardsWithSpecies
    .map(card => getSpeciesObject(card.species)?.id)
    .filter((id): id is string => !!id);

  // Build a map of speciesId -> back_text for deck cards (for consistent naming)
  const deckBackTextMap = new Map<string, string>();
  for (const card of cardsWithSpecies) {
    const speciesId = getSpeciesObject(card.species)?.id;
    if (speciesId && card.back_text) {
      deckBackTextMap.set(speciesId, card.back_text);
    }
  }

  // Build result cards with audio from Xeno-canto
  const resultCards: QuizCard[] = [];
  const debugLogs: DistractorDebugLog[] = [];

  // Fetch audio for each species (parallel with concurrency limit)
  const audioPromises = cardsToFetch.map(async (card) => {
    const species = getSpeciesObject(card.species);
    if (!species) return null;

    // Fetch random recording from Xeno-canto (quality B or better, limit 5 for randomness)
    const result = await searchXenoCantoBySpecies(species.scientific_name, {
      limit: 5,
      quality: "B",
    });

    if (result.error || result.data.length === 0) {
      return null;
    }

    // Pick a random recording from the results
    const recording = result.data[Math.floor(Math.random() * result.data.length)];

    return { card, species, recording };
  });

  const audioResults = await Promise.all(audioPromises);

  // Process results
  for (const result of audioResults) {
    if (!result) continue;

    const { card, species, recording } = result;

    // Get distractors for this species
    // Alleen de huidige species wordt uitgesloten (binnen getDistractors)
    const { distractors, debug } = await getDistractors(supabase, species, deckSpeciesIds, [], 3, deckBackTextMap);
    debugLogs.push(debug);

    // Build options: correct answer + distractors
    const correctName = getSpeciesDisplayName(species, card.back_text, deckBackTextMap);
    const quizOptions: QuizOption[] = [
      {
        id: species.id,
        name: correctName,
        scientificName: species.scientific_name,
        isCorrect: true,
        speciesId: species.id,
      },
      ...distractors.map(d => ({
        id: d.id,
        name: getSpeciesDisplayName(d, null, deckBackTextMap),
        scientificName: d.scientific_name,
        isCorrect: false,
        speciesId: d.id,
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
      mediaType: "audio",
      audio: {
        url: `/api/xeno-canto/stream/${recording.id}`, // Use proxy for CORS
        creator: recording.recordist,
        source: "Xeno-canto",
        sonogramUrl: recording.sonogramUrl,
        xenoCantoId: recording.id,
        license: recording.license,
      },
    });

    // Stop als we genoeg kaarten hebben
    if (limit && resultCards.length >= limit) {
      break;
    }
  }

  if (resultCards.length === 0) {
    return { data: [], error: "Kon geen quiz vragen genereren (geen geluiden gevonden)" };
  }

  return { data: resultCards, _debug: debugLogs };
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
