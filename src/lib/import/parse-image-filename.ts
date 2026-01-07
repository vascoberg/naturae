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
 * Parse an image filename to extract structured metadata
 *
 * Supported formats:
 * - "{nr}. {groep} - {subgroep} - {naam} - {wetenschappelijke naam}.jpg"
 * - "{nr}. {naam} - {wetenschappelijke naam}.png"
 * - "{nr}. {naam}.jpeg"
 * - "{naam} ({wetenschappelijke naam}).webp"
 * - "{naam}.jpg"
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

  // Pattern 6: Just a name
  return {
    position: 0,
    group: null,
    subgroup: null,
    dutchName: baseName.trim(),
    scientificName: null,
  };
}
