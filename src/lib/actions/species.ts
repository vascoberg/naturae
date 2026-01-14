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

  // 1. Search local database first (scientific names + all vernacular names in gbif_data)
  const { data: localSpecies, error: dbError } = await supabase
    .from("species")
    .select("id, scientific_name, canonical_name, common_names, taxonomy, gbif_key, source, gbif_data")
    .or(
      `scientific_name.ilike.%${query}%,canonical_name.ilike.%${query}%,common_names->nl.ilike.%${query}%`
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

    // 3. Fetch Dutch vernacular name
    const vernacularNames = await fetchGBIFVernacularNames(gbifKey);
    const dutchName = vernacularNames.find((v) => v.language === "nld" || v.language === "nl");

    // 4. Create species in local database
    const { data: newSpecies, error: insertError } = await supabase
      .from("species")
      .insert({
        scientific_name: gbifData.scientificName,
        canonical_name: gbifData.canonicalName,
        common_names: dutchName ? { nl: dutchName.vernacularName } : {},
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
