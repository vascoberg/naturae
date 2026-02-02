/**
 * Xeno-canto API v3 Service
 *
 * Xeno-canto is een database met vogelgeluiden (en andere diergeluiden).
 * API documentatie: https://xeno-canto.org/explore/api
 *
 * Vereist: API key (gratis na registratie)
 */

const XENO_CANTO_API = "https://xeno-canto.org/api/3/recordings";

// API Response types
interface XenoCantoApiResponse {
  numRecordings: string;
  numSpecies: string;
  page: number;
  numPages: number;
  recordings: XenoCantoApiRecording[];
}

interface XenoCantoApiRecording {
  id: string;
  gen: string; // Genus (bijv. "Parus")
  sp: string; // Species (bijv. "major")
  ssp: string; // Subspecies
  grp: string; // Group (bijv. "birds")
  en: string; // English name
  rec: string; // Recordist
  cnt: string; // Country
  loc: string; // Location
  lat: string; // Latitude
  lon: string; // Longitude
  alt: string; // Altitude
  type: string; // Sound type (bijv. "song", "call")
  sex: string; // Sex
  stage: string; // Life stage
  method: string; // Recording method
  url: string; // Page URL (zonder protocol)
  file: string; // Download URL
  "file-name": string; // Filename
  sono: {
    small: string;
    med: string;
    large: string;
    full: string;
  };
  osci: {
    small: string;
    med: string;
    large: string;
  };
  lic: string; // License URL
  q: string; // Quality (A-E)
  length: string; // Duration (bijv. "0:29")
  time: string; // Recording time
  date: string; // Recording date
  uploaded: string; // Upload date
  also: string[]; // Background species
  rmk: string; // Remarks
  "animal-seen": string;
  "playback-used": string;
  temp: string; // Temperature
  regnr: string; // Registration number
  auto: string; // Auto-detected
  dvc: string; // Device
  mic: string; // Microphone
  smp: string; // Sample rate
}

// Simplified result type for use in the app
export interface XenoCantoResult {
  id: string;
  scientificName: string; // "Parus major"
  englishName: string;
  recordist: string;
  country: string;
  location: string;
  coordinates: { lat: number; lon: number } | null;
  type: string; // "song", "call", etc.
  quality: string; // A-E
  duration: string; // "0:29"
  date: string;
  fileUrl: string; // Direct download URL
  pageUrl: string; // Xeno-canto page
  sonogramUrl: string; // Medium sonogram image
  license: string;
  licenseUrl: string;
  backgroundSpecies: string[];
}

export interface XenoCantoSearchOptions {
  limit?: number; // Default: 10, max: 500
  quality?: "A" | "B" | "C" | "D" | "E"; // Minimum quality
  type?: "song" | "call" | "alarm call" | "flight call"; // Sound type
  country?: string; // Country code (bijv. "Netherlands")
}

/**
 * Zoek vogelgeluiden op wetenschappelijke naam
 */
export async function searchXenoCantoBySpecies(
  scientificName: string,
  options: XenoCantoSearchOptions = {}
): Promise<{ data: XenoCantoResult[]; total: number; error?: string }> {
  const apiKey = process.env.XENO_CANTO_API_KEY;

  if (!apiKey) {
    return {
      data: [],
      total: 0,
      error: "XENO_CANTO_API_KEY niet geconfigureerd",
    };
  }

  const { limit = 10, quality, type, country } = options;

  // Valideer scientificName
  const trimmedName = scientificName.trim();
  if (!trimmedName) {
    console.error("[Xeno-canto Service] Empty scientificName provided");
    return {
      data: [],
      total: 0,
      error: "Geen wetenschappelijke naam opgegeven",
    };
  }

  // Strip auteur-citatie van wetenschappelijke naam
  // "Parus major Linnaeus, 1758" -> "Parus major"
  // "Parus major (Linnaeus, 1758)" -> "Parus major"
  // Auteur begint meestal met hoofdletter na het species epitheton (dat met kleine letter is)
  const cleanedName = trimmedName
    .replace(/\s*\([^)]*\)\s*$/, "") // Verwijder (Author, Year) aan het einde
    .replace(/\s+[A-Z][a-zA-Z]*[,.]?\s*\d{4}.*$/, "") // Verwijder "Author, 1758" patroon
    .replace(/\s+[A-Z][a-zA-Z]*\s*$/, "") // Verwijder trailing author name zonder jaar
    .trim();

  // Split scientific name into genus and species
  // "Parus major" -> gen:Parus sp:major
  const nameParts = cleanedName.split(/\s+/);
  const genus = nameParts[0];

  // Controleer of genus niet leeg is
  if (!genus) {
    console.error("[Xeno-canto Service] Could not extract genus from:", scientificName);
    return {
      data: [],
      total: 0,
      error: "Ongeldige wetenschappelijke naam",
    };
  }

  // Species is het tweede woord (moet met kleine letter beginnen)
  // Negeer alles na het species dat met een hoofdletter begint (auteursnaam)
  let species = "";
  if (nameParts.length > 1 && /^[a-z]/.test(nameParts[1])) {
    species = nameParts[1];
  }

  // Bouw query string met tags
  const queryParts: string[] = [`gen:${genus}`];
  if (species) {
    queryParts.push(`sp:${species}`);
  }

  if (quality) {
    // q_gt:X means "quality greater than X"
    // So for "B or better" (A and B), use q_gt:C
    // For "A only", use q_gt:B
    const qualityMap: Record<string, string> = {
      A: "q_gt:B", // Only A
      B: "q_gt:C", // A and B
      C: "q_gt:D", // A, B, and C
      D: "q_gt:E", // A, B, C, and D
      E: "",       // All (no filter)
    };
    const qualityFilter = qualityMap[quality];
    if (qualityFilter) {
      queryParts.push(qualityFilter);
    }
  }

  if (type) {
    // Types with spaces need quotes in the API query
    const typeValue = type.includes(" ") ? `"${type}"` : type;
    queryParts.push(`type:${typeValue}`);
  }

  if (country) {
    // Countries with spaces need quotes in the API query
    const countryValue = country.includes(" ") ? `"${country}"` : country;
    queryParts.push(`cnt:${countryValue}`);
  }

  const query = queryParts.join(" ");

  try {
    const params = new URLSearchParams({
      query,
      key: apiKey,
      per_page: Math.min(limit, 500).toString(),
    });

    const response = await fetch(`${XENO_CANTO_API}?${params}`, {
      next: { revalidate: 3600 }, // Cache 1 uur
    });

    const data = await response.json();

    // Xeno-canto kan een 200 status geven maar toch een error in de body
    if (data.error) {
      return {
        data: [],
        total: 0,
        error: data.message || data.error,
      };
    }

    if (!response.ok) {
      return {
        data: [],
        total: 0,
        error: data.message || `API error: ${response.status}`,
      };
    }

    const results: XenoCantoResult[] = data.recordings.map((rec: XenoCantoApiRecording) => ({
      id: rec.id,
      scientificName: `${rec.gen} ${rec.sp}`.trim(),
      englishName: rec.en,
      recordist: rec.rec,
      country: rec.cnt,
      location: rec.loc,
      coordinates:
        rec.lat && rec.lon
          ? { lat: parseFloat(rec.lat), lon: parseFloat(rec.lon) }
          : null,
      type: rec.type,
      quality: rec.q,
      duration: rec.length,
      date: rec.date,
      fileUrl: rec.file,
      pageUrl: `https:${rec.url}`,
      sonogramUrl: `https:${rec.sono.med}`,
      license: parseLicenseFromUrl(rec.lic),
      licenseUrl: `https:${rec.lic}`,
      backgroundSpecies: rec.also || [],
    }));

    return {
      data: results,
      total: parseInt(data.numRecordings, 10),
    };
  } catch (error) {
    console.error("Xeno-canto API error:", error);
    return {
      data: [],
      total: 0,
      error: "Fout bij ophalen van geluiden",
    };
  }
}

/**
 * Haal een specifieke opname op via ID
 */
export async function getXenoCantoRecording(
  recordingId: string
): Promise<{ data: XenoCantoResult | null; error?: string }> {
  const apiKey = process.env.XENO_CANTO_API_KEY;

  if (!apiKey) {
    return {
      data: null,
      error: "XENO_CANTO_API_KEY niet geconfigureerd",
    };
  }

  try {
    const params = new URLSearchParams({
      query: `nr:${recordingId}`,
      key: apiKey,
    });

    const response = await fetch(`${XENO_CANTO_API}?${params}`, {
      next: { revalidate: 86400 }, // Cache 24 uur
    });

    if (!response.ok) {
      return {
        data: null,
        error: `API error: ${response.status}`,
      };
    }

    const data: XenoCantoApiResponse = await response.json();

    if (data.recordings.length === 0) {
      return {
        data: null,
        error: "Opname niet gevonden",
      };
    }

    const rec = data.recordings[0];

    return {
      data: {
        id: rec.id,
        scientificName: `${rec.gen} ${rec.sp}`.trim(),
        englishName: rec.en,
        recordist: rec.rec,
        country: rec.cnt,
        location: rec.loc,
        coordinates:
          rec.lat && rec.lon
            ? { lat: parseFloat(rec.lat), lon: parseFloat(rec.lon) }
            : null,
        type: rec.type,
        quality: rec.q,
        duration: rec.length,
        date: rec.date,
        fileUrl: rec.file,
        pageUrl: `https:${rec.url}`,
        sonogramUrl: `https:${rec.sono.med}`,
        license: parseLicenseFromUrl(rec.lic),
        licenseUrl: `https:${rec.lic}`,
        backgroundSpecies: rec.also || [],
      },
    };
  } catch (error) {
    console.error("Xeno-canto API error:", error);
    return {
      data: null,
      error: "Fout bij ophalen van opname",
    };
  }
}

/**
 * Parse license name from Creative Commons URL
 */
function parseLicenseFromUrl(licenseUrl: string): string {
  // "//creativecommons.org/licenses/by-nc-sa/4.0/" -> "CC BY-NC-SA 4.0"
  const match = licenseUrl.match(/\/licenses\/([^/]+)\/([^/]+)/);
  if (match) {
    const [, type, version] = match;
    return `CC ${type.toUpperCase()} ${version}`;
  }
  return "Unknown";
}

/**
 * Format attribution string voor weergave
 */
export function formatXenoCantoAttribution(result: XenoCantoResult): string {
  return `${result.recordist} · ${result.license} · Xeno-canto`;
}
