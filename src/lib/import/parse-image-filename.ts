/**
 * Parse image filename to extract metadata
 * Supports various formats commonly used for species images
 */

export interface ParsedImageFilename {
  position: number;
  group: string | null;
  subgroup: string | null;
  dutchName: string;
  scientificName: string | null;
}

/**
 * Common suffixes that indicate metadata, not part of species name
 * These will be stripped from the end of filenames
 */
const METADATA_SUFFIXES = [
  // Life stages
  "adult", "juvenile", "larva", "larve", "imago", "nimf", "pop", "pupa", "ei", "egg",
  // Sex
  "male", "female", "man", "vrouw", "m", "f",
  // Variants
  "var", "variant", "form", "forma",
  // Numbers (handled separately)
];

/**
 * Check if a name looks like a scientific name
 * Supports: "Genus species", "Genus species subspecies", "Genus cf. species", "Genus sp."
 */
function looksLikeScientificName(name: string): boolean {
  // Standard binomial: "Genus species" or "Genus species subspecies"
  const standardPattern = /^[A-Z][a-z]+\s+[a-z]+(\s+[a-z]+)?$/;

  // With cf. (confer): "Genus cf. species"
  const cfPattern = /^[A-Z][a-z]+\s+cf\.\s+[a-z]+$/;

  // With sp. (unknown species): "Genus sp." or "Genus spp."
  const spPattern = /^[A-Z][a-z]+\s+sp+\.?$/;

  return standardPattern.test(name) || cfPattern.test(name) || spPattern.test(name);
}

/**
 * Check if a name could be a scientific name but in lowercase
 * e.g., "aeshna cyanea" → should be "Aeshna cyanea"
 */
function looksLikeLowercaseScientificName(name: string): boolean {
  // Two or three lowercase words, first should be genus (capitalized in proper form)
  const pattern = /^[a-z]+\s+[a-z]+(\s+[a-z]+)?$/;
  if (!pattern.test(name)) return false;

  // Additional check: genus should be at least 3 chars, species at least 2
  const parts = name.split(/\s+/);
  return parts[0].length >= 3 && parts[1].length >= 2;
}

/**
 * Capitalize first letter of each word for proper scientific name format
 * "aeshna cyanea" → "Aeshna cyanea" (only first word capitalized for scientific names)
 */
function toScientificNameFormat(name: string): string {
  const parts = name.split(/\s+/);
  if (parts.length === 0) return name;

  // Capitalize only the genus (first word)
  parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();

  // Rest stays lowercase
  for (let i = 1; i < parts.length; i++) {
    parts[i] = parts[i].toLowerCase();
  }

  return parts.join(" ");
}

/**
 * Normalize a filename by:
 * - Converting underscores and hyphens to spaces
 * - Removing duplicate spaces
 * - Trimming whitespace
 */
function normalizeFilename(name: string): string {
  return name
    .replace(/[_-]/g, " ")    // Replace underscores and hyphens with spaces
    .replace(/\s+/g, " ")     // Collapse multiple spaces
    .trim();
}

/**
 * Strip leading numbers/prefixes from filename
 * e.g., "001_aeshna_cyanea" → "aeshna_cyanea"
 * e.g., "IMG_1234_aeshna" → "aeshna" (if IMG pattern detected)
 */
function stripLeadingNumbers(name: string): { position: number; name: string } {
  // Pattern: leading numbers with optional separator
  // "001_name", "001-name", "001 name", "01. name"
  const leadingNumberPattern = /^(\d+)[._\-\s]+(.+)$/;
  const match = name.match(leadingNumberPattern);

  if (match) {
    return {
      position: parseInt(match[1], 10),
      name: match[2],
    };
  }

  return { position: 0, name };
}

/**
 * Strip trailing metadata suffixes and numbers
 * e.g., "aeshna_cyanea_male" → "aeshna_cyanea"
 * e.g., "aeshna_cyanea_1" → "aeshna_cyanea"
 * e.g., "aeshna_cyanea_adult_2" → "aeshna_cyanea"
 */
function stripTrailingMetadata(name: string): string {
  let result = name;
  let changed = true;

  // Keep stripping until no more changes (handles multiple suffixes)
  while (changed) {
    changed = false;

    // Strip trailing number with separator
    const trailingNumberPattern = /^(.+)[_\-\s]+(\d+)$/;
    const numberMatch = result.match(trailingNumberPattern);
    if (numberMatch && numberMatch[1].length > 3) {
      result = numberMatch[1];
      changed = true;
      continue;
    }

    // Strip trailing metadata suffix
    for (const suffix of METADATA_SUFFIXES) {
      const suffixPattern = new RegExp(`^(.+)[_\\-\\s]+${suffix}$`, "i");
      const suffixMatch = result.match(suffixPattern);
      if (suffixMatch && suffixMatch[1].length > 3) {
        result = suffixMatch[1];
        changed = true;
        break;
      }
    }
  }

  return result;
}

/**
 * Split CamelCase into separate words
 * e.g., "AeshnaCyanea" → "Aeshna Cyanea"
 */
function splitCamelCase(name: string): string {
  // Only apply if it looks like CamelCase (no spaces/separators, multiple capitals)
  if (/\s/.test(name) || !/[a-z][A-Z]/.test(name)) {
    return name;
  }

  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

/**
 * Parse an image filename to extract structured metadata
 *
 * Supported formats:
 * - "{nr}. {groep} - {subgroep} - {naam} - {wetenschappelijke naam}.jpg"
 * - "{nr}. {naam} - {wetenschappelijke naam}.png"
 * - "{nr}. {naam}.jpeg"
 * - "{naam} ({wetenschappelijke naam}).webp"
 * - "{naam}.jpg"
 * - "001_aeshna_cyanea.jpg" (leading numbers, underscores)
 * - "aeshna-cyanea-male.jpg" (hyphens, trailing metadata)
 * - "AeshnaCyanea.jpg" (CamelCase)
 */
export function parseImageFilename(filename: string): ParsedImageFilename | null {
  // Remove extension
  const baseName = filename.replace(/\.(jpe?g|png|gif|webp|bmp|svg)$/i, "");

  if (!baseName) {
    return null;
  }

  // Pattern 1: "{nr}. {groep} - {subgroep} - {naam} - {wetenschappelijke naam}"
  const fullPattern = /^(\d+)\.\s*([^-]+)\s*-\s*([^-]+)\s*-\s*([^-]+)\s*-\s*(.+)$/;
  const fullMatch = baseName.match(fullPattern);
  if (fullMatch) {
    return {
      position: parseInt(fullMatch[1], 10),
      group: fullMatch[2].trim(),
      subgroup: fullMatch[3].trim(),
      dutchName: fullMatch[4].trim(),
      scientificName: fullMatch[5].trim(),
    };
  }

  // Pattern 2: "{nr}. {groep} - {naam} - {wetenschappelijke naam}"
  const threePartPattern = /^(\d+)\.\s*([^-]+)\s*-\s*([^-]+)\s*-\s*(.+)$/;
  const threeMatch = baseName.match(threePartPattern);
  if (threeMatch) {
    return {
      position: parseInt(threeMatch[1], 10),
      group: threeMatch[2].trim(),
      subgroup: null,
      dutchName: threeMatch[3].trim(),
      scientificName: threeMatch[4].trim(),
    };
  }

  // Pattern 3: "{nr}. {naam} - {wetenschappelijke naam}"
  const numberedPattern = /^(\d+)\.\s*([^-]+)\s*-\s*(.+)$/;
  const numberedMatch = baseName.match(numberedPattern);
  if (numberedMatch) {
    return {
      position: parseInt(numberedMatch[1], 10),
      group: null,
      subgroup: null,
      dutchName: numberedMatch[2].trim(),
      scientificName: numberedMatch[3].trim(),
    };
  }

  // Pattern 4: "{nr}. {naam}"
  const simpleNumberedPattern = /^(\d+)\.\s*(.+)$/;
  const simpleNumberedMatch = baseName.match(simpleNumberedPattern);
  if (simpleNumberedMatch) {
    return {
      position: parseInt(simpleNumberedMatch[1], 10),
      group: null,
      subgroup: null,
      dutchName: simpleNumberedMatch[2].trim(),
      scientificName: null,
    };
  }

  // Pattern 5: "{naam} ({wetenschappelijke naam})"
  const parenPattern = /^(.+?)\s*\(([^)]+)\)$/;
  const parenMatch = baseName.match(parenPattern);
  if (parenMatch) {
    return {
      position: 0,
      group: null,
      subgroup: null,
      dutchName: parenMatch[1].trim(),
      scientificName: parenMatch[2].trim(),
    };
  }

  // Pattern 6: Flexible parsing for various formats
  // Strip leading numbers first
  const { position, name: nameWithoutLeading } = stripLeadingNumbers(baseName);

  // Strip trailing metadata (male, female, numbers, etc.)
  const nameWithoutTrailing = stripTrailingMetadata(nameWithoutLeading);

  // Handle CamelCase
  const nameWithSpaces = splitCamelCase(nameWithoutTrailing);

  // Normalize (underscores, hyphens → spaces)
  const normalizedName = normalizeFilename(nameWithSpaces);

  // Check if it looks like a scientific name (properly capitalized)
  if (looksLikeScientificName(normalizedName)) {
    return {
      position,
      group: null,
      subgroup: null,
      dutchName: normalizedName,
      scientificName: normalizedName,
    };
  }

  // Check if it looks like a lowercase scientific name
  if (looksLikeLowercaseScientificName(normalizedName)) {
    const properName = toScientificNameFormat(normalizedName);
    return {
      position,
      group: null,
      subgroup: null,
      dutchName: properName,
      scientificName: properName,
    };
  }

  // Default: just use the normalized name as Dutch name
  return {
    position,
    group: null,
    subgroup: null,
    dutchName: normalizedName,
    scientificName: null,
  };
}
