# Openbare Foto's Leermodus - Feature Document

> Leermodus waarbij random afbeeldingen uit openbare databases (GBIF/iNaturalist) worden getoond voor soorten die aan kaarten gekoppeld zijn.

## Status: Geimplementeerd

**Implementatiedatum:** januari 2026

---

## Doel

Gebruikers leren soorten herkennen aan de hand van gevarieerde, real-world afbeeldingen in plaats van steeds dezelfde foto te zien. Dit verbetert de leerervaring en zorgt voor betere herkenning in het veld.

**Waarom "Openbare foto's"?**
- Duidelijke naam die beschrijft wat de modus doet
- Geen technisch jargon (GBIF kennen gebruikers niet)
- Impliceert dat foto's van anderen komen (community)

---

## User Flow

### Leermodus Selectie

De "Openbare foto's" modus verschijnt als optie in de sessie-modus selector, met uitleg over de werking:

```
┌─────────────────────────────────────────────────────────────────┐
│  Start met leren                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  📋 Volgorde    │  │  🔀 Shuffle     │  │  🧠 Slim leren  │  │
│  │                 │  │                 │  │                 │  │
│  │  98 kaarten     │  │  98 kaarten     │  │  12 te herhalen │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🌿 Openbare foto's                                        │  │
│  │                                                            │  │
│  │  Leer met gevarieerde natuurfoto's uit openbare databases │  │
│  │  Elke sessie andere afbeeldingen · 98 soorten beschikbaar │  │
│  │                                                            │  │
│  │  ℹ️ Foto's zijn beschikbaar onder CC0/CC-BY licentie       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│                                         [Start sessie]          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Slimme Detectie

De modus wordt alleen getoond als:
1. Deck heeft kaarten met `species_id` gekoppeld
2. Species hebben een geldige `gbif_key`

Als geen kaarten species hebben, wordt de modus niet getoond.

### Flashcard Weergave

**Voorkant:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │                    [Natuurfoto van soort]                 │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  📷 Paul Braun · CC-BY · iNaturalist                            │
│                                                                  │
│                      [Tik om te draaien]                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Achterkant:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                          Bruine kikker                          │
│                  Rana temporaria Linnaeus, 1758                 │
│                                                                  │
│         [Opnieuw]    [Moeilijk]    [Goed]                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

> **Let op:** De soortnaam komt uit het `back_text` veld van de kaart (de naam die de gebruiker heeft ingevoerd), niet uit GBIF. Dit zorgt ervoor dat gebruikers hun eigen naamgeving zien.

### Sessie Gedrag

- **Eén foto per kaart per sessie** - Als een kaart terugkomt (bijv. na "Opnieuw"), wordt dezelfde foto getoond
- **Nieuwe sessie = nieuwe foto's** - Bij volgende sessie worden nieuwe random foto's opgehaald
- **Geen FSRS tracking** - Dit is een oefenmodus, geen spaced repetition
- **Geen opslag** - Foto's en attributie worden niet opgeslagen in `card_media`, alleen in-memory tijdens sessie
- **Sessie statistieken** - Aan het eind: aantal bekeken, correct, opnieuw

### Attributie Afhandeling

De GBIF API levert attributie-informatie die we tonen tijdens de sessie:

| GBIF Veld | Weergave | Voorbeeld |
|-----------|----------|-----------|
| `creator` | Maker naam | "Paul Braun" |
| `license` | Licentie badge | "CC-BY" of "CC0" |
| `references` | Link naar bron | iNaturalist URL |

**Bron detectie uit URL:**
```typescript
function getSourceFromUrl(url: string): string {
  if (url.includes("inaturalist")) return "iNaturalist";
  if (url.includes("flickr")) return "Flickr";
  if (url.includes("observation.org")) return "Observation.org";
  if (url.includes("waarneming.nl")) return "Waarneming.nl";
  if (url.includes("naturalis")) return "Naturalis";
  return "GBIF";
}
```

**Weergave formaat:**
```
📷 Paul Braun · CC-BY · iNaturalist
📷 CC0 · iNaturalist (als geen creator)
```

De attributie is klikbaar als er een `references` URL beschikbaar is.

---

## GBIF Occurrence Media API

### Endpoint

```
GET https://api.gbif.org/v1/occurrence/search
```

### Parameters

| Parameter | Type | Beschrijving | Voorbeeld |
|-----------|------|--------------|-----------|
| `taxonKey` | integer | GBIF species key | `2480528` |
| `mediaType` | enum | Type media | `StillImage` |
| `license` | enum | Licentie filter | `CC0_1_0`, `CC_BY_4_0` |
| `limit` | integer | Max resultaten | `100` |

### Licentie Filtering

We gebruiken alleen **commercieel bruikbare** licenties:

| Licentie | API Waarde | Beschrijving |
|----------|------------|--------------|
| **CC0 1.0** | `CC0_1_0` | Public domain, geen attributie nodig |
| **CC-BY 4.0** | `CC_BY_4_0` | Vrij te gebruiken met attributie |
| **CC-BY 3.0** | - | Ook geaccepteerd in response filtering |

CC-BY-NC wordt **niet** gebruikt (non-commercial beperking).

### Response Structuur

```json
{
  "count": 34210,
  "results": [
    {
      "gbifID": "5036845959",
      "scientificName": "Turdus merula",
      "media": [
        {
          "type": "StillImage",
          "identifier": "https://inaturalist-open-data.s3.amazonaws.com/photos/462949962/original.jpg",
          "license": "http://creativecommons.org/licenses/by/4.0/",
          "creator": "Paul Braun",
          "rightsHolder": "Paul Braun",
          "references": "https://www.inaturalist.org/photos/462949962"
        }
      ]
    }
  ]
}
```

---

## Technische Implementatie

### Fase 1: GBIF Media Service ✅

**Bestand:** `src/lib/services/gbif-media.ts`

```typescript
export interface GBIFMediaResult {
  identifier: string;      // Direct image URL
  license: string;         // CC license URL (voor formattering)
  licenseType: "CC0" | "CC-BY";  // Genormaliseerd type
  creator: string | null;  // Naam van fotograaf
  references: string | null;  // Link naar bron (iNaturalist, etc.)
  source: string;          // Afgeleid: "iNaturalist", "Flickr", etc.
}

export interface GBIFMediaOptions {
  gbifKey: number;
  mediaType?: "StillImage" | "Sound";
  limit?: number;
}

export async function getRandomSpeciesMedia(options: GBIFMediaOptions): Promise<GBIFMediaResult | null>;
export async function getMediaForSpecies(speciesList: Array<{ gbifKey: number; cardId: string }>): Promise<Map<string, GBIFMediaResult>>;
export async function hasPublicMedia(gbifKey: number): Promise<{ available: boolean; count: number }>;
export function getSourceFromUrl(url: string): string;
export function getLicenseType(licenseUrl: string): "CC0" | "CC-BY";
export function formatAttribution(media: GBIFMediaResult): string;
```

**Implementatie details:**
- Query met `license=CC0_1_0` + aparte query met `license=CC_BY_4_0` (parallel)
- Random selectie uit resultaten
- Timeout van 5 seconden per request
- Batch processing in groepen van 5 om API niet te overbelasten
- Bron detectie uit `identifier` of `references` URL
- Licentie normalisatie naar "CC0" of "CC-BY"
- Console logging voor debugging (`[GBIF] Found media from {source}: {url}...`)

---

### Fase 2: Server Action ✅

**Bestand:** `src/lib/actions/study.ts`

```typescript
export interface PublicPhotoStudyCard {
  cardId: string;
  speciesId: string;
  /** Naam van de soort (back_text van de kaart, of GBIF naam als fallback) */
  speciesName: string;
  scientificName: string;
  backText: string | null;
  photo: {
    url: string;
    creator: string | null;
    license: "CC0" | "CC-BY";
    source: string;
    references: string | null;
  } | null;
}

export async function getPublicPhotoStudyCards(
  deckId: string,
  options?: { shuffle?: boolean }
): Promise<{ data: PublicPhotoStudyCard[]; error?: string }>;

export async function checkPublicPhotosAvailability(
  deckId: string
): Promise<{ available: boolean; speciesCount: number }>;
```

**Logica:**
1. Check deck toegang (openbaar of eigenaar)
2. Haal alle kaarten met `species_id` uit deck
3. Filter op kaarten met geldige `gbif_key`
4. Batch-request naar GBIF voor alle soorten
5. Map foto's naar kaarten
6. **Soortnaam prioriteit:** `back_text` → GBIF common_names.nl → canonical_name → scientific_name
7. Filter kaarten zonder beschikbare foto's
8. Optioneel shufflen (standaard aan)

---

### Fase 3: UI Components ✅

**Flashcard:** `src/components/study/public-photo-flashcard.tsx`

```typescript
interface PublicPhotoFlashcardProps {
  photoUrl: string;
  speciesName: string;
  scientificName: string;
  backText: string | null;
  attribution: {
    creator: string | null;
    license: "CC0" | "CC-BY";
    source: string;
    references?: string | null;
  };
  isFlipped: boolean;
  onFlip: () => void;
}
```

Features:
- Skeleton loader tijdens laden
- Error state met "Foto kon niet geladen worden" melding
- State reset bij nieuwe kaart (`useEffect` op `photoUrl`)
- Console logging bij success/failure
- `unoptimized` prop op Next.js Image voor externe URLs

**Attribution:** `src/components/ui/photo-attribution.tsx`

```typescript
interface PhotoAttributionProps {
  creator: string | null;
  license: "CC0" | "CC-BY";
  source: string;
  references?: string | null;
}
```

Features:
- Format: `📷 Creator · License · Source`
- Klikbaar als `references` URL beschikbaar is
- Camera icoon van Lucide

---

### Fase 4: Study Mode Integratie ✅

**Wijzigingen:**

1. **SessionModeSelector** (`src/components/study/session-mode-selector.tsx`)
   - Nieuwe "Openbare foto's" optie met groen thema
   - Alleen getoond als `speciesCardsCount > 0`
   - Beschrijving: "Leer met gevarieerde natuurfoto's uit openbare databases"

2. **Study page** (`src/app/(public)/study/[deckId]/page.tsx`)
   - Nieuwe `PhotoStudySession` component
   - Route: `/study/[deckId]?mode=photos`
   - Aparte sessie statistieken (geen FSRS)

3. **Deck page** (`src/app/(public)/decks/[id]/page.tsx`)
   - Tel kaarten met GBIF-gekoppelde soorten
   - Pass `speciesCardsCount` naar `StartStudyButton`

4. **StartStudyButton** (`src/components/deck/start-study-button.tsx`)
   - Nieuwe `speciesCardsCount` prop

---

### Fase 5: Caching & Optimalisatie ✅

**Preloading:**
```typescript
// Laad volgende 2 foto's alvast
useEffect(() => {
  const nextCards = cards.slice(currentIndex + 1, currentIndex + 3);
  nextCards.forEach(card => {
    if (card.photo?.url) {
      const img = new window.Image();
      img.src = card.photo.url;
    }
  });
}, [currentIndex, cards]);
```

**Error handling:**
- Timeout (5s): API request faalt gracefully
- Broken image URL: toon placeholder met melding, state reset bij volgende kaart
- Geen foto's beschikbaar: filter kaart uit sessie

**Next.js Image configuratie** (`next.config.ts`):
```typescript
images: {
  remotePatterns: [
    // iNaturalist
    { protocol: "https", hostname: "inaturalist-open-data.s3.amazonaws.com", pathname: "/photos/**" },
    { protocol: "https", hostname: "static.inaturalist.org", pathname: "/photos/**" },
    // Flickr
    { protocol: "https", hostname: "live.staticflickr.com" },
    { protocol: "https", hostname: "farm*.staticflickr.com" },
  ],
}
```

> **Let op:** Afbeeldingen gebruiken `unoptimized={true}` omdat niet alle GBIF bronnen voorspelbare URL-patronen hebben.

---

## Vereisten Status

### Must Have ✅
- [x] Alleen CC0 en CC-BY licenties gebruiken
- [x] Attributie tonen (creator, licentie, bron)
- [x] Zelfde foto binnen één sessie
- [x] Modus alleen tonen als deck species-kaarten heeft

### Should Have ✅
- [x] Preloading van volgende afbeeldingen
- [x] Skeleton loader tijdens laden
- [x] Graceful fallback bij failures
- [x] Sessie statistieken (bekeken, correct, opnieuw)

### Could Have (niet geïmplementeerd)
- [ ] Filter op land/regio
- [ ] Audio modus (GBIF Sound media)
- [x] Shuffle optie binnen openbare foto's modus (altijd aan)

---

## Problemen & Oplossingen

### 1. Soortnaam toonde "back" in plaats van de echte naam

**Probleem:** De achterkant van de kaart toonde letterlijk "back" als soortnaam.

**Oorzaak:** Het veld `species_display` is een enum (`"front" | "back" | "both" | "none"`) die aangeeft WAAR de species info getoond wordt, niet een weergavenaam. De code gebruikte dit veld verkeerd als naam.

**Oplossing:** De soortnaam wordt nu bepaald uit `back_text` (de naam die de gebruiker heeft ingevoerd), met fallback naar GBIF namen:
```typescript
const speciesName =
  card.back_text ||
  species.common_names?.nl ||
  species.canonical_name ||
  species.scientific_name;
```

### 2. Foto's laadden niet na de eerste paar kaarten

**Probleem:** Na een foto die niet kon laden, laadden alle volgende foto's ook niet meer.

**Oorzaak:** De `imageLoaded` en `imageError` state werden niet gereset wanneer de kaart veranderde.

**Oplossing:** State resetten bij nieuwe `photoUrl`:
```typescript
useEffect(() => {
  setImageLoaded(false);
  setImageError(false);
}, [photoUrl]);
```

### 3. Sommige GBIF bronnen laden niet

**Probleem:** Niet alle GBIF afbeelding-URLs zijn bereikbaar (CORS, hotlink protection, verwijderde foto's).

**Observaties uit testing:**
- ✅ **iNaturalist** - Werkt betrouwbaar
- ✅ **Flickr** - Werkt betrouwbaar
- ⚠️ **GBIF (andere bronnen)** - Soms broken URLs (bijv. archive.org links)
- ⚠️ **Observation.org / Waarneming.nl** - Mogelijk CORS issues

**Oplossing:**
- Console logging toegevoegd om bronnen te monitoren
- Graceful fallback met "Foto kon niet geladen worden" melding
- Kaart kan nog steeds omgedraaid worden om het antwoord te zien

### 4. GBIF data kwaliteit

**Observatie:** GBIF aggregeert data van vele bronnen zonder content validatie. Dit betekent:
- Sommige foto's zijn van lage kwaliteit
- Sommige determinaties kunnen incorrect zijn
- Foto's kunnen meerdere soorten bevatten

**Toekomstige verbetering:** Filter op "research grade" observations van iNaturalist.

---

## Debugging

Console logging is ingebouwd voor debugging:

```
[GBIF] Found media from iNaturalist: https://inaturalist-open-data.s3.amazonaws.com/photos/...
[Photo] Successfully loaded from iNaturalist: https://inaturalist-open-data.s3.amazonaws.com/photos/...
[Photo] Failed to load from GBIF: http://www.archive.org/stream/...
```

---

## Bronnen

- [GBIF Occurrence API Documentation](https://techdocs.gbif.org/en/openapi/v1/occurrence)
- [GBIF Multimedia Blog](https://data-blog.gbif.org/post/gbif-multimedia/)
- [GBIF License Processing](https://data-blog.gbif.org/post/gbif-occurrence-license-processing/)
- [Creative Commons Attribution Requirements](https://creativecommons.org/use-remix/)

---

*Document aangemaakt: januari 2026*
*Laatste update: januari 2026 - Implementatie voltooid*
