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
