"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  Species,
  SpeciesSearchResult,
  GBIFSuggestResult,
  GBIFMatchResult,
  GBIFVernacularName,
  GBIFSpeciesData,
  CreateManualSpeciesInput,
} from "@/types/species";

const GBIF_API_BASE = "https://api.gbif.org/v1";

/**
 * Search for species in local database and GBIF
 * Returns combined results with local matches first
 * Supports both scientific names and vernacular names (Dutch, English, etc.)
 */
export async function searchSpecies(
  query: string
): Promise<{ data: SpeciesSearchResult[]; error?: string }> {
  if (!query || query.length < 2) {
    return { data: [] };
  }

  const supabase = await createClient();
  const results: SpeciesSearchResult[] = [];
  const seenGbifKeys = new Set<number>();

  // 1. Search local database first (scientific names + Dutch and English names)
  const { data: localSpecies, error: dbError } = await supabase
    .from("species")
    .select("id, scientific_name, canonical_name, common_names, taxonomy, gbif_key, source, gbif_data")
    .or(
      `scientific_name.ilike.%${query}%,canonical_name.ilike.%${query}%,common_names->>nl.ilike.%${query}%,common_names->>en.ilike.%${query}%`
    )
    .limit(10);

  if (dbError) {
    console.error("Error searching local species:", dbError);
  }

  // Add local results
  if (localSpecies) {
    for (const species of localSpecies) {
      results.push({
        id: species.id,
        scientific_name: species.scientific_name,
        canonical_name: species.canonical_name,
        dutch_name: species.common_names?.nl || null,
        source: "local",
        gbif_key: species.gbif_key,
        taxonomy: species.taxonomy,
      });

      // Track GBIF keys to avoid duplicates
      if (species.gbif_key) {
        seenGbifKeys.add(species.gbif_key);
      }
    }
  }

  // 2. Also search local database by vernacular names stored in gbif_data
  // This finds species where any language vernacular name matches
  const { data: vernacularMatches } = await supabase
    .from("species")
    .select("id, scientific_name, canonical_name, common_names, taxonomy, gbif_key, source, gbif_data")
    .not("gbif_key", "in", `(${Array.from(seenGbifKeys).join(",") || "0"})`)
    .limit(10);

  if (vernacularMatches) {
    for (const species of vernacularMatches) {
      // Check if any vernacular name in gbif_data matches the query
      const vernacularNames = species.gbif_data?.vernacularNames as GBIFVernacularName[] | undefined;
      if (vernacularNames) {
        const matchingName = vernacularNames.find((v) =>
          v.vernacularName.toLowerCase().includes(query.toLowerCase())
        );

        if (matchingName && !seenGbifKeys.has(species.gbif_key)) {
          results.push({
            id: species.id,
            scientific_name: species.scientific_name,
            canonical_name: species.canonical_name,
            dutch_name: species.common_names?.nl || matchingName.vernacularName,
            source: "local",
            gbif_key: species.gbif_key,
            taxonomy: species.taxonomy,
          });
          seenGbifKeys.add(species.gbif_key);
        }
      }
    }
  }

  // 3. Search GBIF API - both scientific names and vernacular names
  try {
    // Parallel search: scientific name suggest + vernacular name search
    const [gbifSuggestResults, gbifVernacularResults] = await Promise.all([
      fetchGBIFSuggest(query),
      fetchGBIFByVernacularName(query),
    ]);

    // Process scientific name results
    for (const gbif of gbifSuggestResults) {
      if (seenGbifKeys.has(gbif.key)) continue;
      if (gbif.rank !== "SPECIES") continue;

      seenGbifKeys.add(gbif.key);
      results.push({
        id: `gbif-${gbif.key}`,
        scientific_name: gbif.scientificName,
        canonical_name: gbif.canonicalName,
        dutch_name: null, // Will be fetched when selected
        source: "gbif",
        gbif_key: gbif.key,
        taxonomy: {
          family: gbif.family,
          order: gbif.order,
        },
      });
    }

    // Process vernacular name results
    for (const gbif of gbifVernacularResults) {
      if (seenGbifKeys.has(gbif.key)) continue;
      if (gbif.rank !== "SPECIES") continue;

      seenGbifKeys.add(gbif.key);
      results.push({
        id: `gbif-${gbif.key}`,
        scientific_name: gbif.scientificName,
        canonical_name: gbif.canonicalName,
        dutch_name: gbif.vernacularName || null, // From vernacular search
        source: "gbif",
        gbif_key: gbif.key,
        taxonomy: {
          family: gbif.family,
          order: gbif.order,
        },
      });
    }
  } catch (error) {
    console.error("GBIF API error:", error);
    // Continue with local results only
  }

  return { data: results.slice(0, 15) };
}

/**
 * Get or create a species from GBIF key
 * If species exists locally, returns it
 * If not, fetches from GBIF and creates it
 */
export async function getOrCreateSpecies(
  gbifKey: number
): Promise<{ data: Species | null; error?: string }> {
  const supabase = await createClient();

  // 1. Check if species exists locally
  const { data: existing } = await supabase
    .from("species")
    .select("*")
    .eq("gbif_key", gbifKey)
    .single();

  if (existing) {
    return { data: existing as Species };
  }

  // 2. Fetch from GBIF
  try {
    const gbifData = await fetchGBIFSpecies(gbifKey);
    if (!gbifData) {
      return { data: null, error: "Soort niet gevonden in GBIF" };
    }

    // 3. Fetch vernacular names (Dutch and English)
    const vernacularNames = await fetchGBIFVernacularNames(gbifKey);
    const dutchName = selectBestDutchName(vernacularNames);
    const englishName = selectBestEnglishName(vernacularNames);

    // Build common_names object with available languages
    const commonNames: Record<string, string> = {};
    if (dutchName) commonNames.nl = dutchName.vernacularName;
    if (englishName) commonNames.en = englishName.vernacularName;

    // 4. Create species in local database
    const { data: newSpecies, error: insertError } = await supabase
      .from("species")
      .insert({
        scientific_name: gbifData.scientificName,
        canonical_name: gbifData.canonicalName,
        common_names: commonNames,
        taxonomy: {
          kingdom: gbifData.kingdom,
          phylum: gbifData.phylum,
          class: gbifData.class,
          order: gbifData.order,
          family: gbifData.family,
          genus: gbifData.genus,
        },
        gbif_key: gbifKey,
        source: "gbif",
        gbif_data: {
          ...gbifData,
          vernacularNames: vernacularNames,
        },
      })
      .select()
      .single();

    if (insertError) {
      // Handle unique constraint violation (race condition)
      if (insertError.code === "23505") {
        const { data: raceResult } = await supabase
          .from("species")
          .select("*")
          .eq("gbif_key", gbifKey)
          .single();
        return { data: raceResult as Species };
      }

      console.error("Error creating species:", insertError);
      return { data: null, error: "Kon soort niet opslaan" };
    }

    return { data: newSpecies as Species };
  } catch (error) {
    console.error("Error fetching GBIF species:", error);
    return { data: null, error: "Fout bij ophalen soort" };
  }
}

/**
 * Create a manual species (not in GBIF)
 */
export async function createManualSpecies(
  input: CreateManualSpeciesInput
): Promise<{ data: Species | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Niet ingelogd" };
  }

  const { data: newSpecies, error } = await supabase
    .from("species")
    .insert({
      scientific_name: input.scientific_name,
      canonical_name: input.scientific_name, // Same as scientific for manual
      common_names: input.dutch_name ? { nl: input.dutch_name } : {},
      taxonomy: input.taxonomy || {},
      gbif_key: null,
      source: "manual",
      gbif_data: null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { data: null, error: "Deze soort bestaat al" };
    }
    console.error("Error creating manual species:", error);
    return { data: null, error: "Kon soort niet aanmaken" };
  }

  return { data: newSpecies as Species };
}

/**
 * Get species by ID
 */
export async function getSpeciesById(
  id: string
): Promise<{ data: Species | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("species")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return { data: null, error: "Soort niet gevonden" };
  }

  return { data: data as Species };
}

/**
 * Match species by scientific name (exact or fuzzy)
 * Used for bulk import
 */
export async function matchSpeciesByName(
  scientificName: string
): Promise<{ data: Species | null; error?: string }> {
  const supabase = await createClient();

  // 1. Try exact local match first
  const { data: exactMatch } = await supabase
    .from("species")
    .select("*")
    .or(`scientific_name.eq.${scientificName},canonical_name.eq.${scientificName}`)
    .single();

  if (exactMatch) {
    return { data: exactMatch as Species };
  }

  // 2. Try GBIF match
  try {
    const matchResult = await fetchGBIFMatch(scientificName);

    if (matchResult && matchResult.matchType !== "NONE" && matchResult.confidence >= 90) {
      // Create species from GBIF match
      const result = await getOrCreateSpecies(matchResult.usageKey || matchResult.key);
      return result;
    }
  } catch (error) {
    console.error("GBIF match error:", error);
  }

  return { data: null };
}

// ============ GBIF API Helpers ============

/**
 * Select the best Dutch vernacular name from GBIF results
 *
 * Priority order:
 * 1. Name with preferred=true and language nld/nl
 * 2. Name from trusted Dutch sources (Nederlands Soortenregister, Belgian Species List)
 * 3. Name from authoritative international sources (IOC World Bird List)
 * 4. First available Dutch name (fallback)
 */
function selectBestDutchName(vernacularNames: GBIFVernacularName[]): GBIFVernacularName | undefined {
  // Filter to only Dutch names
  const dutchNames = vernacularNames.filter(
    (v) => v.language === "nld" || v.language === "nl"
  );

  if (dutchNames.length === 0) return undefined;

  // Priority 1: Preferred name (official according to GBIF)
  const preferred = dutchNames.find((v) => v.preferred === true);
  if (preferred) return preferred;

  // Priority 2: Nederlands Soortenregister (most authoritative for Dutch names)
  const nsr = dutchNames.find((v) =>
    v.source?.includes("Nederlands Soortenregister") ||
    v.source?.includes("Dutch Species Register")
  );
  if (nsr) return nsr;

  // Priority 3: Belgian Species List (also authoritative for Dutch)
  const belgian = dutchNames.find((v) =>
    v.source?.includes("Belgian Species List")
  );
  if (belgian) return belgian;

  // Priority 4: IOC World Bird List (authoritative for birds)
  const ioc = dutchNames.find((v) =>
    v.source?.includes("IOC World Bird List")
  );
  if (ioc) return ioc;

  // Priority 5: EUNIS (European biodiversity database)
  const eunis = dutchNames.find((v) =>
    v.source?.includes("EUNIS")
  );
  if (eunis) return eunis;

  // Fallback: first available Dutch name
  return dutchNames[0];
}

/**
 * Select the best English vernacular name from GBIF results
 *
 * Priority order:
 * 1. Name with preferred=true and language eng/en
 * 2. Name from IOC World Bird List (most authoritative for bird common names)
 * 3. Name from eBird/Clements checklist
 * 4. First available English name (fallback)
 */
function selectBestEnglishName(vernacularNames: GBIFVernacularName[]): GBIFVernacularName | undefined {
  // Filter to only English names
  const englishNames = vernacularNames.filter(
    (v) => v.language === "eng" || v.language === "en"
  );

  if (englishNames.length === 0) return undefined;

  // Priority 1: Preferred name (official according to GBIF)
  const preferred = englishNames.find((v) => v.preferred === true);
  if (preferred) return preferred;

  // Priority 2: IOC World Bird List (authoritative for bird common names)
  const ioc = englishNames.find((v) =>
    v.source?.includes("IOC World Bird List")
  );
  if (ioc) return ioc;

  // Priority 3: eBird/Clements Checklist
  const ebird = englishNames.find((v) =>
    v.source?.includes("eBird") || v.source?.includes("Clements")
  );
  if (ebird) return ebird;

  // Priority 4: Integrated Taxonomic Information System (ITIS)
  const itis = englishNames.find((v) =>
    v.source?.includes("ITIS")
  );
  if (itis) return itis;

  // Fallback: first available English name
  return englishNames[0];
}

async function fetchGBIFSuggest(query: string): Promise<GBIFSuggestResult[]> {
  const url = `${GBIF_API_BASE}/species/suggest?q=${encodeURIComponent(query)}&limit=10`;
  const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1 hour

  if (!response.ok) {
    throw new Error(`GBIF suggest failed: ${response.status}`);
  }

  return response.json();
}

async function fetchGBIFSpecies(key: number): Promise<GBIFSpeciesData | null> {
  const url = `${GBIF_API_BASE}/species/${key}`;
  const response = await fetch(url, { next: { revalidate: 86400 } }); // Cache 24 hours

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`GBIF species fetch failed: ${response.status}`);
  }

  return response.json();
}

async function fetchGBIFVernacularNames(key: number): Promise<GBIFVernacularName[]> {
  const url = `${GBIF_API_BASE}/species/${key}/vernacularNames?limit=100`;
  const response = await fetch(url, { next: { revalidate: 86400 } }); // Cache 24 hours

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.results || [];
}

async function fetchGBIFMatch(name: string): Promise<GBIFMatchResult | null> {
  const url = `${GBIF_API_BASE}/species/match?name=${encodeURIComponent(name)}&strict=false`;
  const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1 hour

  if (!response.ok) {
    throw new Error(`GBIF match failed: ${response.status}`);
  }

  const result = await response.json();

  if (result.matchType === "NONE") {
    return null;
  }

  return result;
}

/**
 * Search GBIF by vernacular (common) name
 * Returns species that have matching vernacular names in any language
 */
interface GBIFSearchResult extends GBIFSuggestResult {
  vernacularName?: string;
}

async function fetchGBIFByVernacularName(query: string): Promise<GBIFSearchResult[]> {
  // Use the species/search endpoint with q parameter (searches both scientific and vernacular names)
  // This is more reliable than the vernacularName parameter which doesn't work as expected
  const url = `${GBIF_API_BASE}/species/search?q=${encodeURIComponent(query)}&rank=SPECIES&status=ACCEPTED&limit=10`;
  const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache 1 hour

  if (!response.ok) {
    console.error(`GBIF vernacular search failed: ${response.status}`);
    return [];
  }

  const data = await response.json();
  const results: GBIFSearchResult[] = [];

  // The search API returns results in a different format
  for (const item of data.results || []) {
    // Only include results that have a nubKey (the canonical GBIF backbone key)
    // This filters out duplicate entries from different datasets
    if (item.nubKey && item.scientificName) {
      // Try to find a Dutch vernacular name first, then fall back to any matching name
      const dutchName = item.vernacularNames?.find(
        (v: { language?: string; vernacularName: string }) =>
          v.language === "nld" || v.language === "nl"
      );
      const matchingName = item.vernacularNames?.find(
        (v: { vernacularName: string }) =>
          v.vernacularName.toLowerCase().includes(query.toLowerCase())
      );

      results.push({
        key: item.nubKey, // Use nubKey for consistency with GBIF backbone
        scientificName: item.scientificName,
        canonicalName: item.canonicalName || item.scientificName,
        rank: item.rank,
        status: item.taxonomicStatus,
        kingdom: item.kingdom,
        phylum: item.phylum,
        class: item.class,
        order: item.order,
        family: item.family,
        genus: item.genus,
        vernacularName: dutchName?.vernacularName || matchingName?.vernacularName,
      });
    }
  }

  return results;
}

/**
 * Fix missing genus in taxonomy by extracting from gbif_data
 * Returns count of updated species
 */
export async function fixMissingGenus(): Promise<{ updated: number; errors: string[] }> {
  const supabase = await createClient();
  let updated = 0;
  const errors: string[] = [];

  // Find species that have gbif_data but no genus in taxonomy
  const { data: speciesWithoutGenus } = await supabase
    .from("species")
    .select("id, scientific_name, taxonomy, gbif_data")
    .not("gbif_data", "is", null);

  if (!speciesWithoutGenus) {
    return { updated: 0, errors: ["Could not fetch species"] };
  }

  for (const species of speciesWithoutGenus) {
    // Check if genus is missing in taxonomy
    const currentTaxonomy = species.taxonomy as Record<string, string> | null;
    if (currentTaxonomy?.genus) continue; // Already has genus

    // Try to extract genus from gbif_data
    const gbifData = species.gbif_data as GBIFSpeciesData | null;
    if (!gbifData?.genus) {
      console.log(`[fixMissingGenus] No genus in gbif_data for ${species.scientific_name}`);
      continue;
    }

    // Update taxonomy with genus (and other fields if missing)
    const newTaxonomy = {
      ...currentTaxonomy,
      kingdom: currentTaxonomy?.kingdom || gbifData.kingdom,
      phylum: currentTaxonomy?.phylum || gbifData.phylum,
      class: currentTaxonomy?.class || gbifData.class,
      order: currentTaxonomy?.order || gbifData.order,
      family: currentTaxonomy?.family || gbifData.family,
      genus: gbifData.genus,
    };

    const { error } = await supabase
      .from("species")
      .update({ taxonomy: newTaxonomy })
      .eq("id", species.id);

    if (error) {
      errors.push(`Failed to update ${species.scientific_name}: ${error.message}`);
    } else {
      console.log(`[fixMissingGenus] Updated ${species.scientific_name} with genus: ${gbifData.genus}`);
      updated++;
    }
  }

  return { updated, errors };
}

/**
 * DEBUG: Check taxonomy data for species in a deck
 * Returns species with their taxonomy to diagnose missing genus fields
 */
export async function debugDeckTaxonomy(deckId: string): Promise<{
  species: Array<{
    id: string;
    scientific_name: string;
    taxonomy: Record<string, string> | null;
    hasGenus: boolean;
  }>;
}> {
  const supabase = await createClient();

  // Get all cards in deck with their species
  const { data: cards } = await supabase
    .from("cards")
    .select(`
      species:species_id (
        id,
        scientific_name,
        taxonomy
      )
    `)
    .eq("deck_id", deckId)
    .is("deleted_at", null);

  if (!cards) return { species: [] };

  const speciesMap = new Map<string, { id: string; scientific_name: string; taxonomy: Record<string, string> | null }>();

  for (const card of cards) {
    const species = Array.isArray(card.species) ? card.species[0] : card.species;
    if (species && typeof species === "object" && "id" in species) {
      speciesMap.set(species.id as string, {
        id: species.id as string,
        scientific_name: species.scientific_name as string,
        taxonomy: species.taxonomy as Record<string, string> | null,
      });
    }
  }

  return {
    species: Array.from(speciesMap.values()).map(s => ({
      ...s,
      hasGenus: !!s.taxonomy?.genus,
    })),
  };
}

/**
 * DEBUG: Get all species with their taxonomy info
 * For diagnosing genus matching issues
 */
export async function debugAllSpeciesTaxonomy(): Promise<{
  total: number;
  withGenus: number;
  withoutGenus: number;
  sample: Array<{
    scientific_name: string;
    genus: string | null;
    family: string | null;
  }>;
}> {
  const supabase = await createClient();

  const { data: allSpecies, count, error } = await supabase
    .from("species")
    .select("scientific_name, taxonomy", { count: "exact" });

  console.log("[debugAllSpeciesTaxonomy] Query result:", { count, error, dataLength: allSpecies?.length });

  if (!allSpecies || error) {
    console.error("[debugAllSpeciesTaxonomy] Error:", error);
    return { total: 0, withGenus: 0, withoutGenus: 0, sample: [] };
  }

  const withGenus = allSpecies.filter(s => {
    const tax = s.taxonomy as Record<string, string> | null;
    return !!tax?.genus;
  });

  const withoutGenus = allSpecies.filter(s => {
    const tax = s.taxonomy as Record<string, string> | null;
    return !tax?.genus;
  });

  // Sample: first 10 species
  const sample = allSpecies.slice(0, 10).map(s => {
    const tax = s.taxonomy as Record<string, string> | null;
    return {
      scientific_name: s.scientific_name,
      genus: tax?.genus || null,
      family: tax?.family || null,
    };
  });

  console.log("[debugAllSpeciesTaxonomy] Total species:", count);
  console.log("[debugAllSpeciesTaxonomy] With genus:", withGenus.length);
  console.log("[debugAllSpeciesTaxonomy] Without genus:", withoutGenus.length);
  console.log("[debugAllSpeciesTaxonomy] Sample:", sample);

  return {
    total: count || 0,
    withGenus: withGenus.length,
    withoutGenus: withoutGenus.length,
    sample,
  };
}

/**
 * Get related species (same family), excluding the current species
 * Returns up to `limit` species with basic info for thumbnails
 */
export async function getRelatedSpecies(
  family: string,
  excludeSpeciesId: string,
  limit: number = 6
): Promise<{
  id: string;
  scientific_name: string;
  canonical_name: string | null;
  common_names: Record<string, string> | null;
  gbif_key: number | null;
}[]> {
  const supabase = await createClient();

  // Use explicit JSONB path filter: taxonomy->>family = 'FamilyName'
  const { data, error } = await supabase
    .from("species")
    .select("id, scientific_name, canonical_name, common_names, gbif_key")
    .neq("id", excludeSpeciesId)
    .filter("taxonomy->>family", "eq", family)
    .limit(limit);

  if (error) {
    console.error("[getRelatedSpecies] Error:", error);
    return [];
  }

  console.log(`[getRelatedSpecies] Found ${data?.length || 0} species in family "${family}"`);
  return data || [];
}

/**
 * Fix Dutch names for existing species using improved name selection
 * Re-selects the best Dutch name from stored gbif_data.vernacularNames
 * Returns count of updated species
 */
export async function fixDutchNames(): Promise<{
  updated: number;
  checked: number;
  changes: Array<{ scientific_name: string; old_name: string | null; new_name: string }>;
  errors: string[];
}> {
  const supabase = await createClient();
  let updated = 0;
  const changes: Array<{ scientific_name: string; old_name: string | null; new_name: string }> = [];
  const errors: string[] = [];

  // Find all GBIF species with vernacular names stored
  const { data: speciesWithGbifData } = await supabase
    .from("species")
    .select("id, scientific_name, common_names, gbif_data")
    .eq("source", "gbif")
    .not("gbif_data", "is", null);

  if (!speciesWithGbifData) {
    return { updated: 0, checked: 0, changes: [], errors: ["Could not fetch species"] };
  }

  for (const species of speciesWithGbifData) {
    const gbifData = species.gbif_data as { vernacularNames?: GBIFVernacularName[] } | null;
    const vernacularNames = gbifData?.vernacularNames;

    if (!vernacularNames || vernacularNames.length === 0) continue;

    // Use improved selection
    const bestDutchName = selectBestDutchName(vernacularNames);
    if (!bestDutchName) continue;

    const currentName = (species.common_names as { nl?: string })?.nl;
    const newName = bestDutchName.vernacularName;

    // Only update if the name is different
    if (currentName === newName) continue;

    const { error } = await supabase
      .from("species")
      .update({
        common_names: {
          ...(species.common_names as Record<string, string>),
          nl: newName,
        },
      })
      .eq("id", species.id);

    if (error) {
      errors.push(`Failed to update ${species.scientific_name}: ${error.message}`);
    } else {
      console.log(`[fixDutchNames] ${species.scientific_name}: "${currentName}" → "${newName}" (source: ${bestDutchName.source})`);
      changes.push({
        scientific_name: species.scientific_name,
        old_name: currentName || null,
        new_name: newName,
      });
      updated++;
    }
  }

  return {
    updated,
    checked: speciesWithGbifData.length,
    changes,
    errors,
  };
}

/**
 * Refresh Dutch names by fetching fresh vernacular names from GBIF
 * This is needed because old gbif_data may not have the 'preferred' flag
 */
export async function refreshDutchNamesFromGBIF(): Promise<{
  updated: number;
  checked: number;
  changes: Array<{ scientific_name: string; old_name: string | null; new_name: string; source: string }>;
  errors: string[];
}> {
  const supabase = await createClient();
  let updated = 0;
  const changes: Array<{ scientific_name: string; old_name: string | null; new_name: string; source: string }> = [];
  const errors: string[] = [];

  // Find all GBIF species with a gbif_key
  const { data: speciesWithGbifKey } = await supabase
    .from("species")
    .select("id, scientific_name, common_names, gbif_key, gbif_data")
    .eq("source", "gbif")
    .not("gbif_key", "is", null);

  if (!speciesWithGbifKey) {
    return { updated: 0, checked: 0, changes: [], errors: ["Could not fetch species"] };
  }

  for (const species of speciesWithGbifKey) {
    try {
      // Fetch fresh vernacular names from GBIF API
      const freshVernacularNames = await fetchGBIFVernacularNames(species.gbif_key!);

      if (freshVernacularNames.length === 0) continue;

      // Use improved selection with fresh data (includes 'preferred' flag)
      const bestDutchName = selectBestDutchName(freshVernacularNames);
      if (!bestDutchName) continue;

      const currentName = (species.common_names as { nl?: string })?.nl;
      const newName = bestDutchName.vernacularName;

      // Only update if the name is different
      if (currentName === newName) continue;

      // Update species with new name AND refresh gbif_data.vernacularNames
      const currentGbifData = species.gbif_data as Record<string, unknown> | null;
      const { error } = await supabase
        .from("species")
        .update({
          common_names: {
            ...(species.common_names as Record<string, string>),
            nl: newName,
          },
          gbif_data: {
            ...currentGbifData,
            vernacularNames: freshVernacularNames,
          },
        })
        .eq("id", species.id);

      if (error) {
        errors.push(`Failed to update ${species.scientific_name}: ${error.message}`);
      } else {
        console.log(`[refreshDutchNames] ${species.scientific_name}: "${currentName}" → "${newName}" (source: ${bestDutchName.source}, preferred: ${bestDutchName.preferred})`);
        changes.push({
          scientific_name: species.scientific_name,
          old_name: currentName || null,
          new_name: newName,
          source: bestDutchName.source || "unknown",
        });
        updated++;
      }
    } catch (err) {
      errors.push(`Error fetching vernacular names for ${species.scientific_name}: ${err}`);
    }
  }

  return {
    updated,
    checked: speciesWithGbifKey.length,
    changes,
    errors,
  };
}
