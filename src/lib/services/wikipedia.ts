/**
 * Wikipedia API Service
 *
 * Haalt samenvattingen op van Wikipedia voor soorten.
 * Probeert eerst de wetenschappelijke naam, dan de Nederlandse naam.
 */

const WIKIPEDIA_API_NL = "https://nl.wikipedia.org/api/rest_v1/page/summary";
const WIKIPEDIA_API_EN = "https://en.wikipedia.org/api/rest_v1/page/summary";

export interface WikipediaSummary {
  title: string;
  extract: string; // Plain text samenvatting
  pageUrl: string; // Link naar volledige pagina
  thumbnail?: string; // Optionele thumbnail URL
  language: "nl" | "en";
}

/**
 * Haal Wikipedia samenvatting op voor een soort
 * Probeert eerst NL Wikipedia met wetenschappelijke naam,
 * dan NL met Nederlandse naam, dan EN als fallback.
 */
export async function getWikipediaSummary(
  scientificName: string,
  dutchName?: string | null
): Promise<WikipediaSummary | null> {
  // Stap 1: Probeer NL Wikipedia met wetenschappelijke naam
  const nlScientific = await fetchWikipediaSummary(scientificName, "nl");
  if (nlScientific) return nlScientific;

  // Stap 2: Probeer NL Wikipedia met Nederlandse naam
  if (dutchName) {
    const nlDutch = await fetchWikipediaSummary(dutchName, "nl");
    if (nlDutch) return nlDutch;
  }

  // Stap 3: Fallback naar EN Wikipedia met wetenschappelijke naam
  const enScientific = await fetchWikipediaSummary(scientificName, "en");
  if (enScientific) return enScientific;

  return null;
}

/**
 * Fetch van specifieke Wikipedia API
 */
async function fetchWikipediaSummary(
  title: string,
  language: "nl" | "en"
): Promise<WikipediaSummary | null> {
  const apiBase = language === "nl" ? WIKIPEDIA_API_NL : WIKIPEDIA_API_EN;
  const url = `${apiBase}/${encodeURIComponent(title)}`;

  try {
    const response = await fetch(url, {
      headers: {
        // Wikipedia API vereist User-Agent
        "User-Agent": "Naturae/1.0 (https://naturae.app; contact@naturae.app)",
      },
      // Cache voor 24 uur
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      // 404 is normaal - artikel bestaat niet
      if (response.status !== 404) {
        console.error(`Wikipedia API error: ${response.status} for "${title}"`);
      }
      return null;
    }

    const data = await response.json();

    // Check of we een echte pagina hebben (niet een disambiguation)
    if (data.type === "disambiguation" || data.type === "not_found") {
      return null;
    }

    // Filter te korte extracten (waarschijnlijk stub artikelen)
    if (!data.extract || data.extract.length < 50) {
      return null;
    }

    return {
      title: data.title,
      extract: data.extract,
      pageUrl: data.content_urls?.desktop?.page || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      thumbnail: data.thumbnail?.source,
      language,
    };
  } catch (error) {
    console.error(`Wikipedia fetch failed for "${title}":`, error);
    return null;
  }
}

/**
 * Kort een Wikipedia extract in tot een maximum aantal karakters
 * Breekt af op een volledige zin
 */
export function truncateExtract(extract: string, maxLength: number = 300): string {
  if (extract.length <= maxLength) return extract;

  // Vind de laatste punt voor maxLength
  const truncated = extract.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");

  if (lastPeriod > maxLength * 0.5) {
    // Breek af op de laatste punt als die niet te vroeg is
    return truncated.substring(0, lastPeriod + 1);
  }

  // Anders breek af op het laatste woord
  const lastSpace = truncated.lastIndexOf(" ");
  return truncated.substring(0, lastSpace) + "...";
}
