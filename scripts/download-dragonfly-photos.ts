/**
 * Download dragonfly (Odonata) photos from GBIF for species occurring in the Netherlands
 *
 * Usage: npx tsx scripts/download-dragonfly-photos.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const GBIF_API_BASE = "https://api.gbif.org/v1";
const OUTPUT_DIR = "./dragonfly-photos";

// Odonata order key in GBIF
const ODONATA_ORDER_KEY = 789; // Odonata (dragonflies & damselflies)

interface GBIFSpecies {
  key: number;
  scientificName: string;
  canonicalName?: string;
  vernacularName?: string;
}

interface GBIFOccurrenceMedia {
  type: string;
  identifier: string;
  license?: string;
  creator?: string;
}

interface GBIFOccurrenceResult {
  media: GBIFOccurrenceMedia[];
}

interface GBIFOccurrenceResponse {
  count: number;
  results: GBIFOccurrenceResult[];
}

interface GBIFSpeciesFacetResponse {
  count: number;
  facets: Array<{
    field: string;
    counts: Array<{
      name: string;
      count: number;
    }>;
  }>;
}

/**
 * Fetch JSON from URL
 */
async function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      res.on("error", reject);
    }).on("error", reject);
  });
}

/**
 * Download file from URL
 */
async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    const makeRequest = (requestUrl: string) => {
      protocol.get(requestUrl, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirectUrl = res.headers.location;
          if (redirectUrl) {
            makeRequest(redirectUrl);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: ${res.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(outputPath);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
        fileStream.on("error", reject);
      }).on("error", reject);
    };

    makeRequest(url);
  });
}

/**
 * Get all Odonata species with occurrences in Netherlands
 */
async function getDutchDragonflySpecies(): Promise<GBIFSpecies[]> {
  console.log("Fetching dragonfly species occurring in the Netherlands...");

  // Use faceted search to get unique species keys
  const facetUrl = `${GBIF_API_BASE}/occurrence/search?orderKey=${ODONATA_ORDER_KEY}&country=NL&limit=0&facet=speciesKey&facetLimit=500`;
  const facetResponse = await fetchJson<GBIFSpeciesFacetResponse>(facetUrl);

  const speciesKeys = facetResponse.facets?.[0]?.counts?.map(c => parseInt(c.name)) || [];
  console.log(`Found ${speciesKeys.length} species with occurrences in NL`);

  // Fetch species details for each key
  const species: GBIFSpecies[] = [];
  for (const key of speciesKeys) {
    try {
      const speciesUrl = `${GBIF_API_BASE}/species/${key}`;
      const speciesData = await fetchJson<GBIFSpecies>(speciesUrl);
      species.push(speciesData);

      // Also try to get Dutch vernacular name
      try {
        const vernacularUrl = `${GBIF_API_BASE}/species/${key}/vernacularNames?language=nld&limit=1`;
        const vernacularData = await fetchJson<{ results: Array<{ vernacularName: string }> }>(vernacularUrl);
        if (vernacularData.results?.[0]) {
          speciesData.vernacularName = vernacularData.results[0].vernacularName;
        }
      } catch {
        // No Dutch name available
      }
    } catch (e) {
      console.error(`Failed to fetch species ${key}:`, e);
    }
  }

  return species;
}

/**
 * Get a photo URL for a species
 */
async function getSpeciesPhotoUrl(gbifKey: number): Promise<string | null> {
  // Try CC-BY license first (most common)
  const licenses = ["CC_BY_4_0", "CC_BY_NC_4_0", "CC0_1_0"];

  for (const license of licenses) {
    const url = `${GBIF_API_BASE}/occurrence/search?taxonKey=${gbifKey}&mediaType=StillImage&license=${license}&limit=1`;

    try {
      const response = await fetchJson<GBIFOccurrenceResponse>(url);

      if (response.results?.length > 0) {
        const occurrence = response.results[0];
        const photo = occurrence.media?.find(m => m.type === "StillImage" && m.identifier);
        if (photo) {
          return photo.identifier;
        }
      }
    } catch {
      // Try next license
    }
  }

  return null;
}

/**
 * Sanitize filename
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

/**
 * Get file extension from URL
 */
function getExtension(url: string): string {
  const urlPath = new URL(url).pathname;
  const ext = path.extname(urlPath).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
    return ext;
  }
  return ".jpg"; // Default
}

/**
 * Main function
 */
async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Get all Dutch dragonfly species
  const species = await getDutchDragonflySpecies();

  console.log("\n--- Species List ---");
  species.forEach((s, i) => {
    const name = s.vernacularName
      ? `${s.canonicalName || s.scientificName} (${s.vernacularName})`
      : s.canonicalName || s.scientificName;
    console.log(`${i + 1}. ${name}`);
  });

  console.log(`\n--- Downloading photos for ${species.length} species ---\n`);

  let downloaded = 0;
  let failed = 0;

  for (const sp of species) {
    const name = sp.canonicalName || sp.scientificName;
    const displayName = sp.vernacularName
      ? `${name} (${sp.vernacularName})`
      : name;

    process.stdout.write(`Downloading: ${displayName}... `);

    try {
      const photoUrl = await getSpeciesPhotoUrl(sp.key);

      if (!photoUrl) {
        console.log("❌ No photo found");
        failed++;
        continue;
      }

      const ext = getExtension(photoUrl);
      const filename = `${sanitizeFilename(name)}${ext}`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      await downloadFile(photoUrl, outputPath);
      console.log(`✅ ${filename}`);
      downloaded++;

      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 200));

    } catch (e) {
      console.log(`❌ Error: ${e instanceof Error ? e.message : e}`);
      failed++;
    }
  }

  console.log(`\n--- Done ---`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
}

main().catch(console.error);
