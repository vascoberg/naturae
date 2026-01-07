/**
 * Types for bulk import functionality
 */

export type MediaType = "audio" | "image" | "mixed";

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
  dutchName: string;
  scientificName: string | null;
  artist: string | null;
  copyright: string | null;
  sourceUrl: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
}
