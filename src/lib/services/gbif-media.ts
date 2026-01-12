/**
 * GBIF Media Service
 *
 * Service voor het ophalen van openbare foto's van soorten via de GBIF Occurrence API.
 * Alleen CC0 en CC-BY 4.0 licenties worden gebruikt (commercieel bruikbaar).
 */

export interface GBIFMediaResult {
  identifier: string; // Direct image URL
  license: string; // CC license URL
  licenseType: "CC0" | "CC-BY"; // Normalized type
  creator: string | null; // Photographer name
  references: string | null; // Source URL (iNaturalist, etc.)
  source: string; // Derived: "iNaturalist", "Flickr", etc.
}

export interface GBIFMediaOptions {
  gbifKey: number;
  mediaType?: "StillImage" | "Sound";
  limit?: number;
}

interface GBIFOccurrenceMedia {
  type: string;
  identifier: string;
  license?: string;
  creator?: string;
  rightsHolder?: string;
  references?: string;
}

interface GBIFOccurrenceResult {
  gbifID: string;
  scientificName: string;
  media: GBIFOccurrenceMedia[];
}

interface GBIFOccurrenceResponse {
  count: number;
  results: GBIFOccurrenceResult[];
}

const GBIF_API_BASE = "https://api.gbif.org/v1";
const REQUEST_TIMEOUT = 5000; // 5 seconds

/**
 * Bepaal bron uit URL
 */
export function getSourceFromUrl(url: string): string {
  if (url.includes("inaturalist")) return "iNaturalist";
  if (url.includes("flickr")) return "Flickr";
  if (url.includes("observation.org")) return "Observation.org";
  if (url.includes("waarneming.nl")) return "Waarneming.nl";
  if (url.includes("naturalis")) return "Naturalis";
  return "GBIF";
}

/**
 * Normaliseer licentie URL naar type
 */
export function getLicenseType(licenseUrl: string): "CC0" | "CC-BY" {
  if (
    licenseUrl.includes("publicdomain") ||
    licenseUrl.includes("cc0") ||
    licenseUrl.includes("CC0")
  ) {
    return "CC0";
  }
  return "CC-BY";
}

/**
 * Format licentie URL naar leesbaar formaat
 */
function formatLicense(licenseUrl: string): string {
  const type = getLicenseType(licenseUrl);
  return type === "CC0" ? "CC0" : "CC-BY";
}

/**
 * Fetch met timeout
 */
async function fetchWithTimeout(
  url: string,
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Haal occurrences op voor een soort met specifieke licentie
 */
async function fetchOccurrencesWithLicense(
  gbifKey: number,
  license: "CC0_1_0" | "CC_BY_4_0",
  mediaType: string = "StillImage",
  limit: number = 100
): Promise<GBIFOccurrenceResult[]> {
  const params = new URLSearchParams({
    taxonKey: gbifKey.toString(),
    mediaType,
    license,
    limit: limit.toString(),
  });

  const url = `${GBIF_API_BASE}/occurrence/search?${params}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.error(`GBIF API error: ${response.status}`);
      return [];
    }
    const data: GBIFOccurrenceResponse = await response.json();
    return data.results || [];
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("GBIF API request timed out");
    } else {
      console.error("GBIF API request failed:", error);
    }
    return [];
  }
}


/**
 * Extraheer media items uit occurrence resultaten
 */
function extractMediaFromOccurrences(
  occurrences: GBIFOccurrenceResult[]
): GBIFMediaResult[] {
  const mediaItems: GBIFMediaResult[] = [];

  for (const occurrence of occurrences) {
    if (!occurrence.media || occurrence.media.length === 0) continue;

    for (const media of occurrence.media) {
      if (media.type !== "StillImage" || !media.identifier) continue;

      const licenseUrl = media.license || "";
      // Only include CC0 or CC-BY licenses
      if (
        !licenseUrl.includes("publicdomain") &&
        !licenseUrl.includes("cc0") &&
        !licenseUrl.includes("CC0") &&
        !licenseUrl.includes("by/4.0") &&
        !licenseUrl.includes("by/3.0")
      ) {
        continue;
      }

      // Determine source from identifier or references URL
      const sourceUrl = media.references || media.identifier;

      const source = getSourceFromUrl(sourceUrl);
      console.log(`[GBIF] Found media from ${source}: ${media.identifier.substring(0, 80)}...`);

      mediaItems.push({
        identifier: media.identifier,
        license: licenseUrl,
        licenseType: getLicenseType(licenseUrl),
        creator: media.creator || media.rightsHolder || null,
        references: media.references || null,
        source,
      });
    }
  }

  return mediaItems;
}

/**
 * Haal random media op voor een soort via GBIF occurrence API
 * Alleen CC0 en CC-BY licenties (commercieel bruikbaar)
 */
export async function getRandomSpeciesMedia(
  options: GBIFMediaOptions
): Promise<GBIFMediaResult | null> {
  const { gbifKey, mediaType = "StillImage", limit = 100 } = options;

  // Fetch both CC0 and CC-BY occurrences in parallel
  const [cc0Occurrences, ccbyOccurrences] = await Promise.all([
    fetchOccurrencesWithLicense(gbifKey, "CC0_1_0", mediaType, limit),
    fetchOccurrencesWithLicense(gbifKey, "CC_BY_4_0", mediaType, limit),
  ]);

  // Extract media from all occurrences
  const allMedia = [
    ...extractMediaFromOccurrences(cc0Occurrences),
    ...extractMediaFromOccurrences(ccbyOccurrences),
  ];

  if (allMedia.length === 0) {
    return null;
  }

  // Return a random media item
  const randomIndex = Math.floor(Math.random() * allMedia.length);
  return allMedia[randomIndex];
}

/**
 * Haal meerdere random media op voor een lijst soorten
 * Geoptimaliseerd voor batch requests
 */
export async function getMediaForSpecies(
  speciesList: Array<{ gbifKey: number; cardId: string }>
): Promise<Map<string, GBIFMediaResult>> {
  const results = new Map<string, GBIFMediaResult>();

  // Process in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < speciesList.length; i += batchSize) {
    const batch = speciesList.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async ({ gbifKey, cardId }) => {
        const media = await getRandomSpeciesMedia({ gbifKey });
        return { cardId, media };
      })
    );

    for (const { cardId, media } of batchResults) {
      if (media) {
        results.set(cardId, media);
      }
    }
  }

  return results;
}

/**
 * Check of een soort openbare media beschikbaar heeft
 */
export async function hasPublicMedia(
  gbifKey: number
): Promise<{ available: boolean; count: number }> {
  const params = new URLSearchParams({
    taxonKey: gbifKey.toString(),
    mediaType: "StillImage",
    license: "CC_BY_4_0",
    limit: "1",
  });

  const url = `${GBIF_API_BASE}/occurrence/search?${params}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      return { available: false, count: 0 };
    }
    const data: GBIFOccurrenceResponse = await response.json();
    return {
      available: data.count > 0,
      count: data.count,
    };
  } catch {
    return { available: false, count: 0 };
  }
}

/**
 * Format attribution string voor weergave
 * Returns: "📷 Paul Braun · CC-BY · iNaturalist" of "📷 CC0 · iNaturalist"
 */
export function formatAttribution(media: GBIFMediaResult): string {
  const parts: string[] = [];

  if (media.creator) {
    parts.push(media.creator);
  }

  parts.push(formatLicense(media.license));
  parts.push(media.source);

  return `📷 ${parts.join(" · ")}`;
}

/**
 * Haal een lijst van media op voor een soort (voor de card editor picker)
 * Ondersteunt paginatie voor "meer laden" functionaliteit
 */
export async function getSpeciesMediaList(
  options: GBIFMediaOptions & { offset?: number }
): Promise<{ media: GBIFMediaResult[]; hasMore: boolean; total: number }> {
  const { gbifKey, mediaType = "StillImage", limit = 20, offset = 0 } = options;

  // Fetch CC0 en CC-BY apart en combineer
  const [cc0Response, ccbyResponse] = await Promise.all([
    fetchOccurrencesWithLicenseAndCount(gbifKey, "CC0_1_0", mediaType, limit, offset),
    fetchOccurrencesWithLicenseAndCount(gbifKey, "CC_BY_4_0", mediaType, limit, offset),
  ]);

  // Extract media from all occurrences
  const allMedia = [
    ...extractMediaFromOccurrences(cc0Response.results),
    ...extractMediaFromOccurrences(ccbyResponse.results),
  ];

  // Deduplicate by identifier URL
  const uniqueMedia = Array.from(
    new Map(allMedia.map(m => [m.identifier, m])).values()
  );

  const totalCount = cc0Response.count + ccbyResponse.count;
  const hasMore = offset + limit < totalCount;

  return {
    media: uniqueMedia,
    hasMore,
    total: totalCount,
  };
}

/**
 * Fetch occurrences met count voor paginatie
 */
async function fetchOccurrencesWithLicenseAndCount(
  gbifKey: number,
  license: "CC0_1_0" | "CC_BY_4_0",
  mediaType: string = "StillImage",
  limit: number = 20,
  offset: number = 0
): Promise<{ results: GBIFOccurrenceResult[]; count: number }> {
  const params = new URLSearchParams({
    taxonKey: gbifKey.toString(),
    mediaType,
    license,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const url = `${GBIF_API_BASE}/occurrence/search?${params}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.error(`GBIF API error: ${response.status}`);
      return { results: [], count: 0 };
    }
    const data: GBIFOccurrenceResponse = await response.json();
    return { results: data.results || [], count: data.count };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("GBIF API request timed out");
    } else {
      console.error("GBIF API request failed:", error);
    }
    return { results: [], count: 0 };
  }
}
