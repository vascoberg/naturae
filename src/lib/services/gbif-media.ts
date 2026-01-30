/**
 * GBIF Media Service
 *
 * Service voor het ophalen van openbare foto's van soorten via de GBIF Occurrence API.
 * Ondersteunt CC0, CC-BY en CC-BY-NC licenties.
 * Prioriteert Waarneming.nl/Observation.org boven iNaturalist voor betere kwaliteit.
 */

export interface GBIFMediaResult {
  identifier: string; // Direct image URL
  license: string; // CC license URL
  licenseType: "CC0" | "CC-BY" | "CC-BY-NC"; // Normalized type
  creator: string | null; // Photographer name
  references: string | null; // Source URL (iNaturalist, etc.)
  source: string; // Derived: "iNaturalist", "Flickr", etc.

  // Metadata uit occurrence (optioneel - niet alle occurrences hebben dit)
  sex?: "Male" | "Female" | "Hermaphrodite" | string;
  lifeStage?: "Adult" | "Juvenile" | "Larva" | "Pupa" | "Egg" | "Embryo" | "Spore" | string;
  eventDate?: string;
  country?: string;
  locality?: string;
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
  // Metadata velden (optioneel - uit occurrence, niet uit media)
  sex?: string;
  lifeStage?: string;
  eventDate?: string;
  country?: string;
  locality?: string;
  verbatimLocality?: string;
}

interface GBIFOccurrenceResponse {
  count: number;
  results: GBIFOccurrenceResult[];
}

const GBIF_API_BASE = "https://api.gbif.org/v1";
const REQUEST_TIMEOUT = 5000; // 5 seconds

// Dataset keys voor specifieke bronnen
// Observation.org / Waarneming.nl - Prioritaire bron voor betere fotokwaliteit
const OBSERVATION_ORG_DATASET_KEY = "8a863029-f435-446a-821e-275f4f641165";
// iNaturalist Research-Grade: alleen waarnemingen bevestigd door minimaal 2 mensen
const INATURALIST_RESEARCH_GRADE_DATASET_KEY = "50c9509d-22c7-4a22-a47d-8c48425ef4a7";

// Supported license types in GBIF API
type GBIFLicenseType = "CC0_1_0" | "CC_BY_4_0" | "CC_BY_NC_4_0";

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
 * Wrap image URL met proxy als nodig (voor bronnen zonder CORS headers)
 * Observation.org en Waarneming.nl hebben geen CORS, dus we proxyen die
 */
function getProxiedImageUrl(url: string): string {
  // Check of de URL een proxy nodig heeft
  const needsProxy =
    url.includes("observation.org") ||
    url.includes("waarneming.nl");

  if (needsProxy) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
}

/**
 * Normaliseer licentie URL naar type
 */
export function getLicenseType(licenseUrl: string): "CC0" | "CC-BY" | "CC-BY-NC" {
  const lower = licenseUrl.toLowerCase();
  if (
    lower.includes("publicdomain") ||
    lower.includes("cc0") ||
    lower.includes("/zero/")
  ) {
    return "CC0";
  }
  if (lower.includes("by-nc") || lower.includes("by_nc")) {
    return "CC-BY-NC";
  }
  return "CC-BY";
}

/**
 * Format licentie URL naar leesbaar formaat
 */
function formatLicense(licenseUrl: string): string {
  return getLicenseType(licenseUrl);
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
 * datasetKey kan worden meegegeven om te restricten tot een specifieke dataset
 */
async function fetchOccurrencesWithLicense(
  gbifKey: number,
  license: GBIFLicenseType,
  mediaType: string = "StillImage",
  limit: number = 100,
  datasetKey?: string
): Promise<GBIFOccurrenceResult[]> {
  const params = new URLSearchParams({
    taxonKey: gbifKey.toString(),
    mediaType,
    license,
    limit: limit.toString(),
  });

  // Optioneel restricten tot specifieke dataset
  if (datasetKey) {
    params.set("datasetKey", datasetKey);
  }

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
 * Accepteert CC0, CC-BY en CC-BY-NC licenties
 */
function extractMediaFromOccurrences(
  occurrences: GBIFOccurrenceResult[],
  mediaType: string = "StillImage"
): GBIFMediaResult[] {
  const mediaItems: GBIFMediaResult[] = [];

  for (const occurrence of occurrences) {
    if (!occurrence.media || occurrence.media.length === 0) continue;

    for (const media of occurrence.media) {
      if (media.type !== mediaType || !media.identifier) continue;

      const licenseUrl = (media.license || "").toLowerCase();
      // Include CC0, CC-BY en CC-BY-NC licenses
      const isValidLicense =
        licenseUrl.includes("publicdomain") ||
        licenseUrl.includes("cc0") ||
        licenseUrl.includes("/zero/") ||
        licenseUrl.includes("by/4.0") ||
        licenseUrl.includes("by/3.0") ||
        licenseUrl.includes("by-nc/4.0") ||
        licenseUrl.includes("by-nc/3.0");

      if (!isValidLicense) {
        continue;
      }

      // Determine source from identifier or references URL
      const sourceUrl = media.references || media.identifier;
      const source = getSourceFromUrl(sourceUrl);

      // Proxy de image URL als nodig (voor bronnen zonder CORS)
      const proxiedUrl = getProxiedImageUrl(media.identifier);

      console.log(`[GBIF] Found media from ${source}: ${media.identifier.substring(0, 80)}...`);

      mediaItems.push({
        identifier: proxiedUrl,
        license: media.license || "",
        licenseType: getLicenseType(media.license || ""),
        creator: media.creator || media.rightsHolder || null,
        references: media.references || null,
        source,
        // Metadata uit occurrence (niet uit media)
        sex: occurrence.sex || undefined,
        lifeStage: occurrence.lifeStage || undefined,
        eventDate: occurrence.eventDate || undefined,
        country: occurrence.country || undefined,
        locality: occurrence.locality || occurrence.verbatimLocality || undefined,
      });
    }
  }

  return mediaItems;
}

/**
 * Sorteer media met Waarneming.nl/Observation.org als prioriteit
 */
function sortMediaBySource(media: GBIFMediaResult[]): GBIFMediaResult[] {
  return media.sort((a, b) => {
    // Prioriteit: Waarneming.nl/Observation.org > andere bronnen > iNaturalist
    const getPriority = (source: string): number => {
      if (source === "Waarneming.nl" || source === "Observation.org") return 0;
      if (source === "iNaturalist") return 2;
      return 1; // Andere bronnen zoals Flickr, Naturalis
    };
    return getPriority(a.source) - getPriority(b.source);
  });
}

/**
 * Haal random media op voor een soort via GBIF occurrence API
 * Ondersteunt CC0, CC-BY en CC-BY-NC licenties
 * Prioriteert Waarneming.nl/Observation.org boven iNaturalist door EERST van dat dataset te fetchen
 */
export async function getRandomSpeciesMedia(
  options: GBIFMediaOptions
): Promise<GBIFMediaResult | null> {
  const { gbifKey, mediaType = "StillImage", limit = 100 } = options;

  // STRATEGIE: Fetch eerst van Observation.org (prioriteit), dan van alle bronnen
  // Dit zorgt ervoor dat we altijd Observation.org foto's hebben als ze beschikbaar zijn
  const [
    // Observation.org photos (prioriteit) - alleen CC-BY-NC want dat is wat ze hebben
    obsOrgOccurrences,
    // All sources fallback
    cc0Occurrences,
    ccbyOccurrences,
    ccbyncOccurrences,
  ] = await Promise.all([
    // Observation.org dataset - meeste foto's zijn CC-BY-NC
    fetchOccurrencesWithLicense(gbifKey, "CC_BY_NC_4_0", mediaType, Math.min(limit, 50), OBSERVATION_ORG_DATASET_KEY),
    // All sources (zonder dataset restrictie)
    fetchOccurrencesWithLicense(gbifKey, "CC0_1_0", mediaType, limit),
    fetchOccurrencesWithLicense(gbifKey, "CC_BY_4_0", mediaType, limit),
    fetchOccurrencesWithLicense(gbifKey, "CC_BY_NC_4_0", mediaType, limit),
  ]);

  // Extract media - Observation.org eerst (prioriteit)
  const obsOrgMedia = extractMediaFromOccurrences(obsOrgOccurrences, mediaType);
  const otherMedia = [
    ...extractMediaFromOccurrences(cc0Occurrences, mediaType),
    ...extractMediaFromOccurrences(ccbyOccurrences, mediaType),
    ...extractMediaFromOccurrences(ccbyncOccurrences, mediaType),
  ];

  // Deduplicate other media (observation.org kan ook in general results zitten)
  const obsOrgUrls = new Set(obsOrgMedia.map(m => m.identifier));
  const uniqueOtherMedia = otherMedia.filter(m => !obsOrgUrls.has(m.identifier));

  // Combineer: Observation.org eerst, dan de rest gesorteerd
  const sortedOtherMedia = sortMediaBySource(uniqueOtherMedia);
  const allMedia = [...obsOrgMedia, ...sortedOtherMedia];

  if (allMedia.length === 0) {
    return null;
  }

  // Als we Observation.org media hebben, kies daaruit met 70% kans
  if (obsOrgMedia.length > 0 && Math.random() < 0.7) {
    const randomIndex = Math.floor(Math.random() * obsOrgMedia.length);
    return obsOrgMedia[randomIndex];
  }

  // Anders kies uit alle media (gesorteerd met Observation.org eerst)
  const topCount = Math.max(1, Math.ceil(allMedia.length * 0.3));
  const randomIndex = Math.floor(Math.random() * topCount);
  return allMedia[randomIndex];
}

/**
 * Haal meerdere random media op voor een lijst soorten
 * Alle requests worden parallel uitgevoerd voor maximale snelheid
 */
export async function getMediaForSpecies(
  speciesList: Array<{ gbifKey: number; cardId: string }>
): Promise<Map<string, GBIFMediaResult>> {
  const results = new Map<string, GBIFMediaResult>();

  // Voer ALLE requests parallel uit
  // Elke getRandomSpeciesMedia doet intern al 2 parallelle calls (CC0 + CC-BY)
  const allResults = await Promise.all(
    speciesList.map(async ({ gbifKey, cardId }) => {
      const media = await getRandomSpeciesMedia({ gbifKey, limit: 20 }); // Kleinere limit per soort
      return { cardId, media };
    })
  );

  for (const { cardId, media } of allResults) {
    if (media) {
      results.set(cardId, media);
    }
  }

  return results;
}

/**
 * Check of een soort openbare media beschikbaar heeft
 * Controleert CC0, CC-BY en CC-BY-NC licenties
 */
export async function hasPublicMedia(
  gbifKey: number
): Promise<{ available: boolean; count: number }> {
  // Check meest voorkomende licentie eerst (CC-BY)
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

    if (data.count > 0) {
      return { available: true, count: data.count };
    }

    // Als geen CC-BY, check ook CC-BY-NC
    const ncParams = new URLSearchParams({
      taxonKey: gbifKey.toString(),
      mediaType: "StillImage",
      license: "CC_BY_NC_4_0",
      limit: "1",
    });
    const ncResponse = await fetchWithTimeout(`${GBIF_API_BASE}/occurrence/search?${ncParams}`);
    if (ncResponse.ok) {
      const ncData: GBIFOccurrenceResponse = await ncResponse.json();
      if (ncData.count > 0) {
        return { available: true, count: ncData.count };
      }
    }

    return { available: false, count: 0 };
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
 * Prioriteert Waarneming.nl/Observation.org boven iNaturalist
 */
export async function getSpeciesMediaList(
  options: GBIFMediaOptions & { offset?: number }
): Promise<{ media: GBIFMediaResult[]; hasMore: boolean; total: number }> {
  const { gbifKey, mediaType = "StillImage", limit = 20, offset = 0 } = options;

  // Fetch van Observation.org (prioriteit) en alle bronnen
  const [obsOrgResponse, cc0Response, ccbyResponse, ccbyncResponse] = await Promise.all([
    fetchOccurrencesWithLicenseAndCount(gbifKey, "CC_BY_NC_4_0", mediaType, limit, offset, OBSERVATION_ORG_DATASET_KEY),
    fetchOccurrencesWithLicenseAndCount(gbifKey, "CC0_1_0", mediaType, limit, offset),
    fetchOccurrencesWithLicenseAndCount(gbifKey, "CC_BY_4_0", mediaType, limit, offset),
    fetchOccurrencesWithLicenseAndCount(gbifKey, "CC_BY_NC_4_0", mediaType, limit, offset),
  ]);

  // Extract media - Observation.org eerst
  const obsOrgMedia = extractMediaFromOccurrences(obsOrgResponse.results, mediaType);
  const otherMedia = [
    ...extractMediaFromOccurrences(cc0Response.results, mediaType),
    ...extractMediaFromOccurrences(ccbyResponse.results, mediaType),
    ...extractMediaFromOccurrences(ccbyncResponse.results, mediaType),
  ];

  // Deduplicate
  const obsOrgUrls = new Set(obsOrgMedia.map(m => m.identifier));
  const uniqueOtherMedia = otherMedia.filter(m => !obsOrgUrls.has(m.identifier));
  const sortedOtherMedia = sortMediaBySource(uniqueOtherMedia);

  // Combineer: Observation.org eerst
  const allMedia = [...obsOrgMedia, ...sortedOtherMedia];

  // Deduplicate opnieuw (voor het geval er nog duplicaten zijn)
  const uniqueMedia = Array.from(
    new Map(allMedia.map(m => [m.identifier, m])).values()
  );

  const totalCount = obsOrgResponse.count + cc0Response.count + ccbyResponse.count + ccbyncResponse.count;
  const hasMore = offset + limit < totalCount;

  return {
    media: uniqueMedia,
    hasMore,
    total: totalCount,
  };
}

/**
 * Fetch occurrences met count voor paginatie
 * datasetKey kan worden meegegeven om te restricten tot een specifieke dataset
 */
async function fetchOccurrencesWithLicenseAndCount(
  gbifKey: number,
  license: GBIFLicenseType,
  mediaType: string = "StillImage",
  limit: number = 20,
  offset: number = 0,
  datasetKey?: string
): Promise<{ results: GBIFOccurrenceResult[]; count: number }> {
  const params = new URLSearchParams({
    taxonKey: gbifKey.toString(),
    mediaType,
    license,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (datasetKey) {
    params.set("datasetKey", datasetKey);
  }

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
