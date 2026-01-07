/**
 * Parse audio filename to extract metadata
 *
 * Supported formats:
 * - "{nr}. {groep} - {subgroep} - {naam} - {wetenschappelijke naam}.mp3"
 * - "{nr}. {groep} - {wetenschappelijke naam} - {naam}.wav"
 * - "{nr}. {groep} - {subgroep} - {wetenschappelijke naam} - {naam}.mp3" (trekvogels)
 */

export interface ParsedFilename {
  position: number;
  group: string | null;
  subgroup: string | null;
  dutchName: string;
  scientificName: string | null;
}

export function parseAudioFilename(filename: string): ParsedFilename | null {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(mp3|wav|ogg|webm)$/i, "");

  // Try to extract position number at start
  const positionMatch = nameWithoutExt.match(/^(\d+)\.\s*/);
  const position = positionMatch ? parseInt(positionMatch[1], 10) : 0;
  const nameAfterPosition = positionMatch
    ? nameWithoutExt.slice(positionMatch[0].length)
    : nameWithoutExt;

  // Split by " - " to get parts
  const parts = nameAfterPosition.split(" - ").map(p => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  // Try different parsing strategies based on number of parts
  if (parts.length >= 4) {
    // Format: "Zangvogels - Gierzwaluwen - Gierzwaluw - Apus apus"
    // or: "Sabelsprinkhanen - Phaneroptera falcata - Sikkelsprinkhaan"

    // Check if second-to-last part looks like scientific name (contains lowercase after uppercase)
    const secondToLast = parts[parts.length - 2];
    const last = parts[parts.length - 1];

    const isScientificName = (str: string) => /^[A-Z][a-z]+ [a-z]+/.test(str);

    if (isScientificName(secondToLast)) {
      // Format: groep - subgroep - wetenschappelijk - nederlands
      return {
        position,
        group: parts[0],
        subgroup: parts.length > 3 ? parts[1] : null,
        scientificName: secondToLast,
        dutchName: last,
      };
    } else if (isScientificName(last)) {
      // Format: groep - subgroep - nederlands - wetenschappelijk
      return {
        position,
        group: parts[0],
        subgroup: parts.length > 3 ? parts[1] : null,
        dutchName: secondToLast,
        scientificName: last,
      };
    }
  }

  if (parts.length === 3) {
    // Format: "groep - wetenschappelijk - nederlands" or "groep - nederlands - wetenschappelijk"
    const isScientific = (str: string) => /^[A-Z][a-z]+ [a-z]+/.test(str);

    if (isScientific(parts[1])) {
      return {
        position,
        group: parts[0],
        subgroup: null,
        scientificName: parts[1],
        dutchName: parts[2],
      };
    } else if (isScientific(parts[2])) {
      return {
        position,
        group: parts[0],
        subgroup: null,
        dutchName: parts[1],
        scientificName: parts[2],
      };
    }

    // No clear scientific name, assume last is dutch name
    return {
      position,
      group: parts[0],
      subgroup: parts[1],
      dutchName: parts[2],
      scientificName: null,
    };
  }

  if (parts.length === 2) {
    // Format: "groep - naam"
    return {
      position,
      group: parts[0],
      subgroup: null,
      dutchName: parts[1],
      scientificName: null,
    };
  }

  // Single part - just use as name
  return {
    position,
    group: null,
    subgroup: null,
    dutchName: parts[0],
    scientificName: null,
  };
}
