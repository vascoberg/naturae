/**
 * Types for bulk import functionality
 */

export type MediaType = "audio" | "image" | "mixed";

/**
 * Status van species matching tijdens import preview
 */
export type SpeciesMatchStatus =
  | "pending"      // Nog niet gezocht
  | "searching"    // Bezig met zoeken
  | "matched"      // Exacte match gevonden
  | "suggested"    // Suggesties gevonden, user moet kiezen
  | "not_found"    // Geen match gevonden
  | "skipped";     // Geen herkenbare naam in bestandsnaam

/**
 * Species match resultaat voor import preview
 */
export interface SpeciesMatch {
  speciesId: string;
  scientificName: string;
  dutchName: string | null;
  englishName?: string | null;
  gbifKey: number | null;
  confidence: "exact" | "high" | "low" | "manual";
}

export interface ImportCardPreview {
  id: string; // temporary client-side ID
  filename: string;
  position: number;
  dutchName: string;
  scientificName: string | null;
  group: string | null;
  subgroup: string | null;

  // Media files (at least one must be present)
  audioFile: File | null;
  imageFile: File | null;
  imagePreviewUrl: string | null;

  // Metadata from ID3 tags (audio only)
  artist: string | null;
  copyright: string | null;
  sourceUrl: string | null;

  // Species matching
  speciesMatchStatus: SpeciesMatchStatus;
  speciesMatch: SpeciesMatch | null;
  speciesSuggestions: SpeciesMatch[];

  // Status
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export interface ImportProgress {
  current: number;
  total: number;
  status: "idle" | "processing" | "uploading" | "done" | "error";
  message?: string;
}

export interface ImportResult {
  position: number;
  frontText: string;
  backText: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  audioUrl: string | null;
  // Species koppeling
  speciesId: string | null;
  // Metadata
  artist: string | null;
  copyright: string | null;
  sourceUrl: string | null;
}

/**
 * Import Settings - Configuratie voor bulk import
 */
export type PhotoPosition = "front" | "back";
export type NameLanguage = "nl" | "scientific" | "en" | "nl_scientific";
export type NamePosition = "front" | "back" | "both";

export interface ImportSettings {
  photoPosition: PhotoPosition;
  nameLanguage: NameLanguage;
  namePosition: NamePosition;
}

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  photoPosition: "front",
  nameLanguage: "nl",
  namePosition: "back",
};
