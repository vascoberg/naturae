// Species types for GBIF integration

/**
 * Species record from our database
 */
export interface Species {
  id: string;
  scientific_name: string;
  canonical_name: string | null;
  common_names: {
    nl?: string;
    en?: string;
    [key: string]: string | undefined;
  };
  taxonomy: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
  };
  gbif_key: number | null;
  source: "gbif" | "manual";
  gbif_data: GBIFSpeciesData | null;
  created_at: string;
  updated_at: string;
}

/**
 * GBIF Species Suggest API response item
 */
export interface GBIFSuggestResult {
  key: number;
  scientificName: string;
  canonicalName: string;
  rank: string;
  status: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  kingdomKey?: number;
  phylumKey?: number;
  classKey?: number;
  orderKey?: number;
  familyKey?: number;
  genusKey?: number;
  speciesKey?: number;
}

/**
 * GBIF Species Match API response
 */
export interface GBIFMatchResult extends GBIFSuggestResult {
  confidence: number;
  matchType: "EXACT" | "FUZZY" | "HIGHERRANK" | "NONE";
  synonym?: boolean;
  usageKey?: number;
}

/**
 * GBIF Vernacular Names API response item
 */
export interface GBIFVernacularName {
  vernacularName: string;
  language: string;
  country?: string;
  source?: string;
  /** GBIF marks official/preferred names with this flag */
  preferred?: boolean;
}

/**
 * Raw GBIF data stored in species.gbif_data
 */
export interface GBIFSpeciesData {
  key: number;
  scientificName: string;
  canonicalName: string;
  rank: string;
  status: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  vernacularNames?: GBIFVernacularName[];
}

/**
 * Search result combining local DB and GBIF results
 */
export interface SpeciesSearchResult {
  // Unique identifier - either UUID (local) or "gbif-{key}" (GBIF only)
  id: string;
  scientific_name: string;
  canonical_name: string | null;
  dutch_name: string | null;
  // Source indicator
  source: "local" | "gbif";
  // GBIF key if available
  gbif_key: number | null;
  // Full taxonomy for display
  taxonomy?: {
    family?: string;
    order?: string;
  };
}

/**
 * Input for creating a manual species (not in GBIF)
 */
export interface CreateManualSpeciesInput {
  scientific_name: string;
  dutch_name?: string;
  taxonomy?: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
  };
}

/**
 * Species display options for cards
 */
export type SpeciesDisplayOption = "front" | "back" | "both" | "none";
