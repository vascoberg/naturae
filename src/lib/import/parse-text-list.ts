/**
 * Bulk Text Import - Parsing Utility
 *
 * Parses text lists (copied from Excel, Word, etc.) into card data.
 * Auto-detects separator (tab, comma, semicolon).
 */

export type Separator = "\t" | "," | ";";

export interface ParsedRow {
  front: string;
  back: string;
}

export interface ParseResult {
  rows: ParsedRow[];
  detectedSeparator: Separator;
  errors: string[];
}

/**
 * Detects the most likely separator used in the text.
 * Priority: tab > semicolon > comma (tab is most common from Excel)
 */
function detectSeparator(text: string): Separator {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return "\t";

  const firstLine = lines[0];

  // Tab is most common from Excel copy/paste
  if (firstLine.includes("\t")) {
    return "\t";
  }

  // Semicolon is common in European locales
  if (firstLine.includes(";")) {
    return ";";
  }

  // Comma as fallback
  if (firstLine.includes(",")) {
    return ",";
  }

  // Default to tab if no separator found
  return "\t";
}

/**
 * Parses a text list into rows of front/back pairs.
 *
 * @param text - The raw text input (copy/pasted from Excel, etc.)
 * @returns ParseResult with rows, detected separator, and any errors
 */
export function parseTextList(text: string): ParseResult {
  const lines = text
    .trim()
    .split("\n")
    .filter((line) => line.trim());

  if (lines.length === 0) {
    return {
      rows: [],
      detectedSeparator: "\t",
      errors: ["Geen tekst gevonden om te importeren"],
    };
  }

  const separator = detectSeparator(text);
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(separator).map((p) => p.trim());

    if (parts.length < 2) {
      // Only front text, no back
      if (parts[0]) {
        rows.push({ front: parts[0], back: "" });
      }
    } else {
      // Use first two columns (ignore additional columns)
      rows.push({ front: parts[0], back: parts[1] });
    }
  }

  return { rows, detectedSeparator: separator, errors };
}

/**
 * Swaps front and back for all rows.
 * Useful when user wants to flip the columns.
 */
export function swapColumns(rows: ParsedRow[]): ParsedRow[] {
  return rows.map((row) => ({
    front: row.back,
    back: row.front,
  }));
}

/**
 * Returns a human-readable name for the separator.
 */
export function getSeparatorName(separator: Separator): string {
  switch (separator) {
    case "\t":
      return "tab";
    case ",":
      return "komma";
    case ";":
      return "puntkomma";
    default:
      return "onbekend";
  }
}
