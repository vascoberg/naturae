# GBIF Media Learning Mode - Feature Document

> Leermodus waarbij random afbeeldingen/audio van GBIF worden getoond voor soorten die aan kaarten gekoppeld zijn.

## Doel

Gebruikers leren soorten herkennen aan de hand van gevarieerde, real-world afbeeldingen uit de GBIF database in plaats van steeds dezelfde foto te zien. Dit verbetert de leerervaring en zorgt voor betere herkenning in het veld.

---

## GBIF Occurrence Media API

### Endpoint

```
GET https://api.gbif.org/v1/occurrence/search
```

### Relevante Parameters

| Parameter | Type | Beschrijving | Voorbeeld |
|-----------|------|--------------|-----------|
| `taxonKey` | integer | GBIF species key (usageKey) | `2480528` |
| `scientificName` | string | Wetenschappelijke naam (URL encoded) | `Turdus%20merula` |
| `mediaType` | enum | Type media | `StillImage`, `Sound` |
| `license` | enum | Licentie filter | `CC0_1_0`, `CC_BY_4_0`, `CC_BY_NC_4_0` |
| `country` | string | ISO landcode | `NL`, `DE`, `GB` |
| `limit` | integer | Max resultaten (1-300) | `100` |
| `offset` | integer | Paginering | `0`, `100`, `200` |

### Licentie Opties

| Licentie | API Waarde | Commercieel | Attributie |
|----------|------------|-------------|------------|
| **CC0 1.0** (Public Domain) | `CC0_1_0` | Ja | Nee |
| **CC-BY 4.0** | `CC_BY_4_0` | Ja | Ja |
| **CC-BY-NC 4.0** | `CC_BY_NC_4_0` | Nee | Ja |

### Response Structuur

```json
{
  "offset": 0,
  "limit": 20,
  "endOfRecords": false,
  "count": 34210,
  "results": [
    {
      "gbifID": "5036845959",
      "scientificName": "Turdus merula Linnaeus, 1758",
      "decimalLatitude": 52.0907,
      "decimalLongitude": 5.1214,
      "country": "Netherlands",
      "eventDate": "2026-01-10T10:20:22",
      "media": [
        {
          "type": "StillImage",
          "format": "image/jpeg",
          "identifier": "https://inaturalist-open-data.s3.amazonaws.com/photos/462949962/original.jpg",
          "references": "https://www.inaturalist.org/photos/462949962",
          "license": "http://creativecommons.org/licenses/by/4.0/",
          "creator": "Paul Braun",
          "rightsHolder": "Paul Braun",
          "created": "2026-01-10T20:20:22.000+00:00"
        }
      ]
    }
  ]
}
```

### Beschikbaarheid (Voorbeeld: Merel - Turdus merula)

| Licentie | Afbeeldingen | Audio |
|----------|--------------|-------|
| CC0 (public domain) | 3+ | 0 |
| CC-BY 4.0 | 34.210 | 2 |
| CC-BY-NC 4.0 | ~200.000 | ~100 |
| **Totaal** | **233.794** | ~100 |

---

## Feature Specificatie

### User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECK PAGINA                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Nederlandse Vogels (98 kaarten)                                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Start met leren                                          │   │
│  │                                                           │   │
│  │  ○ Volgorde    - Kaarten in deck volgorde                │   │
│  │  ○ Shuffle     - Willekeurige volgorde                   │   │
│  │  ○ Slim leren  - FSRS spaced repetition                  │   │
│  │  ──────────────────────────────────────────────────────  │   │
│  │  ○ GBIF Variatie  - Random afbeeldingen uit GBIF   [NEW] │   │
│  │                                                           │   │
│  │  [Start sessie]                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Leermodus: GBIF Variatie

**Concept:**
- Voor kaarten met een gekoppelde species (`species_id` niet null)
- Haal random afbeelding op van GBIF occurrence API
- Toon afbeelding met attributie
- Antwoord = gekoppelde soort (species badge)

**Flashcard Weergave:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         VOORKANT                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │                    [GBIF Afbeelding]                      │   │
│  │                                                           │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  📷 Paul Braun · CC-BY 4.0 · iNaturalist                        │
│                                                                  │
│                      [Tik om te draaien]                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         ACHTERKANT                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                          Merel                                   │
│                     Turdus merula                                │
│                                                                  │
│  ───────────────────────────────────────────────────────────    │
│                                                                  │
│  Let op de oranje snavel en het gele oogring                    │
│  bij mannetjes.                                  (back_text)    │
│                                                                  │
│         [Opnieuw]    [Moeilijk]    [Goed]                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Vereisten

**Must Have:**
- [ ] Kaart moet `species_id` hebben met geldige `gbif_key`
- [ ] Minimaal 1 afbeelding beschikbaar in GBIF
- [ ] Attributie tonen (creator, license)
- [ ] Fallback naar eigen media als geen GBIF resultaten

**Should Have:**
- [ ] Licentie filter (alleen CC0/CC-BY voor commercieel gebruik)
- [ ] Caching van GBIF responses (voorkomen rate limiting)
- [ ] Preloaden van volgende afbeelding
- [ ] Land filter optie (bijv. alleen Europese waarnemingen)

**Could Have:**
- [ ] Audio modus (GBIF Sound media)
- [ ] Mix modus (eigen media + GBIF)
- [ ] Kwaliteitsfilter (research-grade only)

---

## Technische Implementatie

### Fase 1: GBIF Media Service

**Nieuw bestand:** `src/lib/services/gbif-media.ts`

```typescript
export interface GBIFMediaResult {
  identifier: string;      // Direct image URL
  format: string;          // "image/jpeg"
  license: string;         // CC license URL
  creator: string | null;
  rightsHolder: string | null;
  references: string | null;  // Link naar bron (iNaturalist, etc.)
  created: string | null;
}

export interface GBIFMediaOptions {
  gbifKey: number;
  mediaType: "StillImage" | "Sound";
  license?: "CC0_1_0" | "CC_BY_4_0" | "CC_BY_NC_4_0";
  country?: string;
  limit?: number;
}

/**
 * Haal random media op voor een soort via GBIF occurrence API
 */
export async function getRandomSpeciesMedia(
  options: GBIFMediaOptions
): Promise<GBIFMediaResult | null> {
  const { gbifKey, mediaType, license, country, limit = 100 } = options;

  // Build query URL
  const params = new URLSearchParams({
    taxonKey: gbifKey.toString(),
    mediaType,
    limit: limit.toString(),
  });

  if (license) params.append("license", license);
  if (country) params.append("country", country);

  const url = `https://api.gbif.org/v1/occurrence/search?${params}`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  if (data.count === 0 || data.results.length === 0) return null;

  // Random occurrence selecteren
  const randomIndex = Math.floor(Math.random() * data.results.length);
  const occurrence = data.results[randomIndex];

  // Random media uit occurrence selecteren
  const mediaItems = occurrence.media?.filter(
    (m: any) => m.type === mediaType && m.identifier
  );

  if (!mediaItems || mediaItems.length === 0) return null;

  const randomMedia = mediaItems[Math.floor(Math.random() * mediaItems.length)];

  return {
    identifier: randomMedia.identifier,
    format: randomMedia.format || "image/jpeg",
    license: randomMedia.license || "",
    creator: randomMedia.creator || null,
    rightsHolder: randomMedia.rightsHolder || null,
    references: randomMedia.references || null,
    created: randomMedia.created || null,
  };
}

/**
 * Check of een soort GBIF media beschikbaar heeft
 */
export async function hasGBIFMedia(
  gbifKey: number,
  mediaType: "StillImage" | "Sound" = "StillImage"
): Promise<{ available: boolean; count: number }> {
  const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=${gbifKey}&mediaType=${mediaType}&limit=0`;

  const response = await fetch(url);
  if (!response.ok) return { available: false, count: 0 };

  const data = await response.json();
  return {
    available: data.count > 0,
    count: data.count,
  };
}
```

### Fase 2: Server Action

**Uitbreiding:** `src/lib/actions/study.ts`

```typescript
import { getRandomSpeciesMedia } from "@/lib/services/gbif-media";

export interface GBIFStudyCard {
  cardId: string;
  speciesId: string;
  gbifKey: number;
  speciesName: string;
  scientificName: string;
  backText: string | null;
  gbifMedia: {
    imageUrl: string;
    creator: string | null;
    license: string;
    source: string | null;
  } | null;
}

export async function getGBIFStudyCards(
  deckId: string,
  options?: { license?: string; shuffle?: boolean }
): Promise<{ data: GBIFStudyCard[]; error?: string }> {
  const supabase = await createClient();

  // Haal kaarten met species koppeling
  const { data: cards, error } = await supabase
    .from("cards")
    .select(`
      id,
      back_text,
      species:species_id (
        id,
        gbif_key,
        canonical_name,
        scientific_name,
        common_names
      )
    `)
    .eq("deck_id", deckId)
    .not("species_id", "is", null)
    .is("deleted_at", null);

  if (error) return { data: [], error: error.message };

  // Filter kaarten zonder gbif_key
  const validCards = cards.filter(c => c.species?.gbif_key);

  // Optioneel shufflen
  if (options?.shuffle) {
    for (let i = validCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validCards[i], validCards[j]] = [validCards[j], validCards[i]];
    }
  }

  // GBIF media ophalen per kaart
  const studyCards: GBIFStudyCard[] = await Promise.all(
    validCards.map(async (card) => {
      const species = card.species;
      const dutchName = species.common_names?.nl || species.canonical_name;

      // Haal random GBIF afbeelding
      const media = await getRandomSpeciesMedia({
        gbifKey: species.gbif_key,
        mediaType: "StillImage",
        license: options?.license as any,
      });

      return {
        cardId: card.id,
        speciesId: species.id,
        gbifKey: species.gbif_key,
        speciesName: dutchName,
        scientificName: species.scientific_name,
        backText: card.back_text,
        gbifMedia: media ? {
          imageUrl: media.identifier,
          creator: media.creator,
          license: media.license,
          source: media.references,
        } : null,
      };
    })
  );

  // Filter kaarten zonder GBIF media (of gebruik fallback)
  return { data: studyCards.filter(c => c.gbifMedia !== null) };
}
```

### Fase 3: Study Page Uitbreiding

**Route:** `/study/[deckId]?mode=gbif`

**Nieuwe component:** `src/components/study/gbif-flashcard.tsx`

```typescript
interface GBIFFlashcardProps {
  imageUrl: string;
  speciesName: string;
  scientificName: string;
  backText: string | null;
  attribution: {
    creator: string | null;
    license: string;
    source: string | null;
  };
  isFlipped: boolean;
  onFlip: () => void;
}

export function GBIFFlashcard({
  imageUrl,
  speciesName,
  scientificName,
  backText,
  attribution,
  isFlipped,
  onFlip,
}: GBIFFlashcardProps) {
  return (
    <div onClick={onFlip} className="cursor-pointer">
      {/* Front: GBIF Image */}
      <Card className={cn(!isFlipped ? "block" : "hidden")}>
        <CardContent className="p-4">
          <div className="relative aspect-[4/3] mb-4">
            <img
              src={imageUrl}
              alt="Soort afbeelding"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          {/* Attribution */}
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Camera className="w-3 h-3" />
            <span>{attribution.creator || "Onbekend"}</span>
            <span>·</span>
            <span>{formatLicense(attribution.license)}</span>
            {attribution.source && (
              <>
                <span>·</span>
                <a href={attribution.source} target="_blank" className="underline">
                  Bron
                </a>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Back: Species answer */}
      <Card className={cn(isFlipped ? "block" : "hidden")}>
        <CardContent className="p-8 text-center">
          <p className="text-2xl font-semibold text-primary">{speciesName}</p>
          <p className="text-base italic text-muted-foreground mt-1">
            {scientificName}
          </p>

          {backText && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground">{backText}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatLicense(licenseUrl: string): string {
  if (licenseUrl.includes("cc0") || licenseUrl.includes("publicdomain")) {
    return "CC0";
  }
  if (licenseUrl.includes("by-nc")) return "CC-BY-NC";
  if (licenseUrl.includes("by/4")) return "CC-BY";
  return "©";
}
```

### Fase 4: Caching Strategie

**Optie A: In-memory cache (simpel)**

```typescript
// Simple LRU cache voor GBIF responses
const gbifCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuten

function getCachedOrFetch(key: string, fetcher: () => Promise<any>) {
  const cached = gbifCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetcher();
  gbifCache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

**Optie B: Database cache (robuuster)**

```sql
-- Nieuwe tabel voor GBIF media cache
CREATE TABLE gbif_media_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gbif_key INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  license TEXT,
  results JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',

  UNIQUE(gbif_key, media_type, license)
);

CREATE INDEX idx_gbif_cache_lookup
ON gbif_media_cache(gbif_key, media_type, license)
WHERE expires_at > NOW();
```

---

## UI/UX Overwegingen

### Attributie Weergave

Volgens Creative Commons moet attributie bevatten:
1. **Creator** naam
2. **Licentie** type
3. **Link naar bron** (indien beschikbaar)

```
📷 Paul Braun · CC-BY 4.0 · iNaturalist
```

### Loading States

- Skeleton loader tijdens GBIF fetch
- Fallback naar eigen media bij timeout (3s)
- Error state: "Geen afbeelding beschikbaar"

### Fallback Logica

```
1. Probeer GBIF afbeelding ophalen
2. Bij falen: gebruik eigen card_media (indien aanwezig)
3. Bij geen media: skip kaart of toon placeholder
```

---

## Beperkingen & Aandachtspunten

### Rate Limiting

- GBIF API heeft geen gedocumenteerde rate limits
- Aanbeveling: max 10 requests/seconde
- Implementeer exponential backoff bij 429 errors

### Externe URLs

- GBIF host geen media zelf
- URLs wijzen naar iNaturalist, Flickr, etc.
- Mogelijke broken links (afbeeldingen verwijderd)

### Kwaliteit

- Geen garantie op fotokwaliteit
- Sommige afbeeldingen ongeschikt voor leren
- Optie: filter op "research grade" observations

### Geografische Variatie

- Afbeeldingen van over de hele wereld
- Sommige soorten zien er anders uit per regio
- Optie: filter op `country=NL` of continent

---

## Implementatie Fasen

### Fase 1: Basis GBIF Media Service
- [ ] `gbif-media.ts` service met `getRandomSpeciesMedia`
- [ ] `hasGBIFMedia` check functie
- [ ] Unit tests met mock responses

### Fase 2: Server Action & Data Layer
- [ ] `getGBIFStudyCards` server action
- [ ] Integratie met bestaande study flow
- [ ] Error handling en logging

### Fase 3: UI Components
- [ ] `GBIFFlashcard` component
- [ ] Attribution component
- [ ] Loading/error states

### Fase 4: Study Mode Integratie
- [ ] "GBIF Variatie" optie in SessionModeSelector
- [ ] `/study/[deckId]?mode=gbif` route
- [ ] Sessie statistieken

### Fase 5: Optimalisatie
- [ ] Caching implementeren
- [ ] Preloading volgende afbeelding
- [ ] Licentie filter UI
- [ ] Land filter UI

---

## Bronnen

- [GBIF Occurrence API Documentation](https://techdocs.gbif.org/en/openapi/v1/occurrence)
- [GBIF Species Media Links](https://www.gbif.org/news/82350/species-records-now-include-multimedia-links)
- [GBIF Multimedia Blog](https://data-blog.gbif.org/post/gbif-multimedia/)
- [GBIF License Processing](https://data-blog.gbif.org/post/gbif-occurrence-license-processing/)
- [Creative Commons Attribution Requirements](https://creativecommons.org/use-remix/)

---

*Document aangemaakt: januari 2026*
