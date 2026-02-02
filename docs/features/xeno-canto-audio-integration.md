# Xeno-canto Audio Integratie - Feature Document

> Integratie van vogelgeluiden en andere diergeluiden via de Xeno-canto API voor leren, quizzen en soortenpagina's.

## Status: Volledig Geïmplementeerd

| Fase | Status | Datum |
|------|--------|-------|
| Fase 1: Service file | ✅ Gereed | januari 2026 |
| Fase 2: Media picker | ✅ Gereed | februari 2026 |
| Fase 3: Server action | ✅ Gereed | februari 2026 |
| Fase 4: Soortenpagina | ✅ Gereed | februari 2026 |
| Fase 5: Quiz met geluiden | ✅ Gereed | februari 2026 |

---

## Doel

Gebruikers kunnen:
1. **Geluiden zoeken** in de media picker voor kaarten
2. **Audio samples** beluisteren op soortenpagina's
3. **Quiz met geluiden** spelen (herken de soort aan het geluid)

---

## Xeno-canto Overzicht

Xeno-canto is een database met wildlife geluiden, met focus op:
- Vogels (birds) - grootste collectie
- Sprinkhanen (grasshoppers)
- Vleermuizen (bats)
- Kikkers (frogs)
- Landzoogdieren (land mammals)

**Website:** https://xeno-canto.org
**API Documentatie:** https://xeno-canto.org/explore/api

---

## Licenties & Commercieel Gebruik

### Licentie Types

Elke opname heeft een door de opnemer gekozen Creative Commons licentie:

| Licentie | Code | Commercieel | Bewerkingen | Aanbevolen |
|----------|------|-------------|-------------|------------|
| **BY-SA** | `by-sa` | ✅ Ja | ✅ ShareAlike | Voor commercieel |
| **BY-NC-SA** | `by-nc-sa` | ❌ Nee | ✅ ShareAlike | Educatief |
| **BY-NC-ND** | `by-nc-nd` | ❌ Nee | ❌ Nee | Alleen afspelen |

### Besluit voor Naturae

**Huidige aanpak (gratis platform):**
- Alle licenties toegestaan met juiste attributie
- Consistent met GBIF-aanpak waar ook NC-licenties worden gebruikt

**Toekomstige overweging (betaalde accounts):**
- Filter op BY-SA licenties voor commercieel gebruik, OF
- NC-content alleen voor gratis accounts, OF
- Licentie-check per media item

> **Note:** Dit is dezelfde overweging als bij GBIF. Beide moeten samen bekeken worden wanneer betaalde accounts worden geïmplementeerd.

### Attributie Vereisten

Bij elke opname moet worden getoond:
1. Naam opnemer (`recordist`)
2. Licentie
3. XC-catalogusnummer (bijv. "XC123456")

**Formaat:** `Jan Jansen · CC BY-NC-SA 4.0 · Xeno-canto`

---

## Quality Ratings

Xeno-canto gebruikt een A-E kwaliteitssysteem:

| Rating | Betekenis | Gebruik |
|--------|-----------|---------|
| **A** | Luid en helder | Perfecte voorbeelden |
| **B** | Helder, dier wat verder weg of enige interferentie | Goede kwaliteit |
| **C** | Matig helder, of behoorlijk wat interferentie | Acceptabel |
| **D** | Zwakke opname, of veel interferentie | Alleen als niets anders |
| **E** | Nauwelijks hoorbaar | Niet gebruiken |

### Standaard Filter

**Minimum kwaliteit: B** (`q:>=B` in API query)

Dit zorgt voor:
- Goede audiokwaliteit voor leren
- Voldoende resultaten voor de meeste soorten
- Filter op A is te restrictief (weinig resultaten)

### Toekomstig: Moeilijkheidsgraden

De quality rating kan worden gebruikt voor quiz moeilijkheid:

| Niveau | Quality Filter | Beschrijving |
|--------|----------------|--------------|
| Makkelijk | `q:>=A` | Alleen perfecte opnames |
| Normaal | `q:>=B` | Goede kwaliteit |
| Moeilijk | `q:>=C` | Inclusief matige opnames |
| Expert | `q:>=D` | Veldwerk-achtige uitdaging |

---

## API Details

### Endpoint

```
GET https://xeno-canto.org/api/3/recordings?query=...&key=API_KEY
```

### Query Tags

De API v3 vereist tags in de query:

| Tag | Beschrijving | Voorbeeld |
|-----|--------------|-----------|
| `sp:` | Species (scientific name) | `sp:"Parus major"` |
| `q:` | Quality filter | `q:>=B` |
| `type:` | Sound type | `type:song` |
| `cnt:` | Country | `cnt:Netherlands` |
| `nr:` | Recording ID | `nr:123456` |

### Sound Types per Groep

**Vogels (birds):**
| Type | Beschrijving |
|------|--------------|
| `song` | Zang (territoriaal, balts) |
| `call` | Roep (contact, alarm) |
| `alarm call` | Alarmroep |
| `flight call` | Vluchtroep |

**Kikkers (frogs):**
| Type | Beschrijving |
|------|--------------|
| `advertisement call` | Baltsroep |
| `mating call` | Paringsroep |
| `territorial call` | Territoriumroep |
| `release call` | Loslaatroep |

**Sprinkhanen (grasshoppers):**
| Type | Beschrijving |
|------|--------------|
| `calling song` | Lokzang |
| `courtship song` | Baltszang |
| `rivalry song` | Rivaalzang |

**Vleermuizen (bats):**
| Type | Beschrijving |
|------|--------------|
| `echolocation` | Echolocatie |
| `social call` | Sociale roep |
| `feeding buzz` | Voedingsbuzz |

**Let op:** Multi-word types moeten in de API query tussen quotes staan, bijv. `type:"advertisement call"`

### Rate Limits

- **1000 requests per uur** per IP
- 429 response bij overschrijding
- Caching verplicht (1 uur in service)

### Response

```json
{
  "numRecordings": "1234",
  "numSpecies": "1",
  "page": 1,
  "numPages": 25,
  "recordings": [
    {
      "id": "123456",
      "gen": "Parus",
      "sp": "major",
      "en": "Great Tit",
      "rec": "Jan Jansen",
      "cnt": "Netherlands",
      "type": "song",
      "q": "A",
      "length": "0:29",
      "file": "https://xeno-canto.org/sounds/uploaded/...",
      "sono": {
        "small": "//xeno-canto.org/sounds/uploaded/.../small.png",
        "med": "//xeno-canto.org/sounds/uploaded/.../med.png"
      },
      "lic": "//creativecommons.org/licenses/by-nc-sa/4.0/"
    }
  ]
}
```

---

## Technische Implementatie

### Fase 1: Service File ✅

**Bestand:** `src/lib/services/xeno-canto.ts`

```typescript
export interface XenoCantoResult {
  id: string;
  scientificName: string;
  englishName: string;
  recordist: string;
  country: string;
  location: string;
  coordinates: { lat: number; lon: number } | null;
  type: string;        // "song", "call", etc.
  quality: string;     // A-E
  duration: string;    // "0:29"
  date: string;
  fileUrl: string;     // Direct download URL
  pageUrl: string;     // Xeno-canto page
  sonogramUrl: string; // Medium sonogram image
  license: string;     // "CC BY-NC-SA 4.0"
  licenseUrl: string;
  backgroundSpecies: string[];
}

export interface XenoCantoSearchOptions {
  limit?: number;
  quality?: "A" | "B" | "C" | "D" | "E";
  type?: "song" | "call" | "alarm call" | "flight call";
  country?: string;
}

export async function searchXenoCantoBySpecies(
  scientificName: string,
  options?: XenoCantoSearchOptions
): Promise<{ data: XenoCantoResult[]; total: number; error?: string }>;

export async function getXenoCantoRecording(
  recordingId: string
): Promise<{ data: XenoCantoResult | null; error?: string }>;

export function formatXenoCantoAttribution(result: XenoCantoResult): string;
```

**Configuratie:** API key in `.env.local`:
```
XENO_CANTO_API_KEY=your-api-key
```

---

### Fase 2: Media Picker Uitbreiding ✅

**Doel:** Xeno-canto geluiden zoeken in de card editor

**Bestanden:**
- `src/components/deck/xeno-canto-media-picker.tsx` - Picker dialog component
- `src/app/api/xeno-canto/audio/route.ts` - API route voor zoeken
- `src/app/api/xeno-canto/stream/[id]/route.ts` - Proxy voor audio streaming (CORS)

**Component:** `XenoCantoMediaPicker`

```typescript
interface XenoCantoMediaPickerProps {
  scientificName: string;
  speciesName: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (recording: XenoCantoResult) => void;
}
```

**Geïmplementeerde features:**
- Grid met sonogrammen als thumbnails
- Inline audio preview met play/pause
- Filters:
  - **Kwaliteit:** Alle (B+), Alleen A
  - **Type:** Alle, Zang, Roep
  - **Land:** Nederland (standaard), België, Duitsland, VK, Frankrijk, Alle landen
- Licentie badges met kleurcodering (groen=CC0, blauw=BY, oranje=NC)
- Attributie weergave bij selectie

**CORS oplossing:**
Audio streaming via proxy endpoint om CORS-restricties te omzeilen:
```
/api/xeno-canto/stream/[id] → https://xeno-canto.org/{id}/download
```

---

### Fase 3: Server Action voor Audio ✅

**Bestand:** `src/lib/actions/decks.ts`

```typescript
export async function addXenoCantoAudioToCard(
  cardId: string,
  deckId: string,
  data: {
    xenoCantoId: string;
    audioUrl: string;
    sonogramUrl: string;
    position: "front" | "back" | "both";
    recordist: string;
    license: string;
    pageUrl: string;
  }
): Promise<{ id: string; url: string }>;
```

**Gekozen implementatie:** Audio wordt via de proxy gestreamd (`/api/xeno-canto/stream/[id]`).
Dit zorgt voor:
- Geen CORS-problemen
- Caching op server-niveau (24 uur)
- Geen extra opslagkosten

**CardSideEditor integratie:**
- Xeno-canto knop verschijnt alleen als species is geselecteerd
- Na selectie wordt audio toegevoegd aan card_media met type "audio"
- Attributie wordt automatisch ingevuld (recordist, licentie, bron)

---

### Fase 4: Soortenpagina Audio ✅

**Component:** `SpeciesAudioPlayer`

**Locatie:** `src/components/species/species-audio-player.tsx`

```typescript
interface SpeciesAudioPlayerProps {
  scientificName: string;
  taxonomyClass?: string;   // Voor groep-detectie (Aves, Amphibia, etc.)
  taxonomyOrder?: string;   // Voor specifiekere detectie (Orthoptera, Chiroptera)
  compact?: boolean;        // Start in compact mode (3 opnames)
}
```

**Gebruik:**
- Species Page (`/species/[speciesId]`): Volledige weergave
- Species Sheet (dialog): Compact mode met `compact` prop

**Compact vs Expanded Mode:**
```
Compact (3 opnames):           Expanded (6 opnames + filters):
┌─────────────────┐            ┌─────────────────────────────┐
│  🎵 Geluiden    │            │  🎵 Geluiden     54 opnames │
├─────────────────┤            ├─────────────────────────────┤
│ [■][■][■]       │            │  Kwaliteit: [B+] [A]        │
│                 │  click →   │  Type: [Alle] [Balts]       │
│ [Meer geluiden] │            │  Land: [Nederland ▼]        │
└─────────────────┘            ├─────────────────────────────┤
                               │ [■][■][■]                   │
                               │ [■][■][■]                   │
                               │                             │
                               │    [Minder tonen]           │
                               └─────────────────────────────┘
```

**Groep-specifieke Type Filters:**

De component detecteert automatisch de soortengroep op basis van taxonomie en toont relevante filters:

| Groep | Detectie | Type Filters |
|-------|----------|--------------|
| Vogels | `class = Aves` | Alle, Zang, Roep |
| Sprinkhanen | `order = Orthoptera` | Alle, Lokzang, Balts, Rivaal |
| Vleermuizen | `order = Chiroptera` | Alle, Echolocatie, Sociaal |
| Kikkers | `class = Amphibia` | Alle, Balts, Paring, Territoriaal |
| Zoogdieren | `class = Mammalia` | Alle, Roep, Sociaal |

**Land Filter met Fallback:**

Standaard filtert de component op Nederland. Als er geen Nederlandse opnames zijn:
1. Automatisch fallback naar "Alle landen"
2. Melding wordt getoond: "Geen opnames uit Nederland beschikbaar. Geluiden uit andere landen worden getoond."

Dit voorkomt dat soorten zonder Nederlandse opnames (bijv. zeldzame trekvogels) "Geen geluiden" tonen terwijl er wel internationale opnames zijn.

**Geïmplementeerde features:**
- Compact mode: 3 opnames preview, expand button
- Expanded mode: 6 opnames met filters
- Groep-specifieke type filters (vogels, kikkers, vleermuizen, sprinkhanen, zoogdieren)
- Land filter met intelligente fallback
- Inline audio afspelen met play/pause toggle
- Badges voor kwaliteit en licentie (kleurcodering)
- Metadata: recordist, duur, type, land
- Loading states en error handling
- Automatische cleanup bij unmount

---

### Fase 5: Quiz met Xeno-canto Geluiden ✅

**Status:** Geïmplementeerd (februari 2026)

**Doel:** Quiz waarbij de gebruiker een geluid uit Xeno-canto hoort en de soort moet raden. Verschil met bestaande audio quiz (die eigen uploads gebruikt).

**Flow:**
1. Speel audio fragment uit Xeno-canto af
2. Toon 4 antwoordopties (soortnamen met wetenschappelijke naam)
3. Sonogram wordt als visuele hint getoond
4. Reveal correct antwoord na selectie

**Sonogram als Hint:**
```
┌─────────────────────────────────────────────────────────────┐
│                    Welke soort hoor je?                     │
│                                                              │
│  ▶ [====●================] 0:12 / 0:29                       │
│                                                              │
│  [💡 Toon hint]                                              │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│
│  │  Koolmees │  │  Pimpel-  │  │   Kuif-   │  │   Zwarte  ││
│  │           │  │   mees    │  │   mees    │  │   mees    ││
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘│
└─────────────────────────────────────────────────────────────┘

↓ Klik op "Toon hint"

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [Sonogram afbeelding]                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Distractor generatie:**
- Gebruik bestaande distractor logica uit quiz implementatie (`src/lib/actions/quiz.ts`)
- Selecteer vergelijkbare soorten (zelfde genus → familie → orde)

**Verschil met bestaande Audio Quiz:**

| Aspect | Eigen Audio Quiz | Xeno-canto Quiz |
|--------|------------------|-----------------|
| **Bron** | Eigen uploads (`card_media`) | Xeno-canto API |
| **Beschikbaarheid** | Alleen kaarten met audio | Alle soorten met GBIF key |
| **Kwaliteitscontrole** | Door gebruiker | A/B filter |
| **Licentie** | Eigen verantwoordelijkheid | CC met attributie |
| **Route** | `?mode=quiz&source=own&mediaType=audio` | `?mode=quiz&source=xeno-canto` |

**Geïmplementeerde componenten:**

| Component | Bestand | Beschrijving |
|-----------|---------|--------------|
| `getQuizCardsWithXenoCantoMedia` | `src/lib/actions/quiz.ts` | Haalt random geluiden op van Xeno-canto per soort |
| SessionModeSelector update | `src/components/study/session-mode-selector.tsx` | Nieuwe `source=xeno-canto` optie toegevoegd |
| Study page routing | `src/app/(public)/study/[deckId]/page.tsx` | Ondersteuning voor xeno-canto source |

**Quiz bron selectie UI:**

```
┌─────────────────────────────────────────────────┐
│  Kies een methode:                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Eigen media │ │ GBIF foto's │ │ Xeno-canto  ││
│  │    12       │ │     18      │ │     18      ││
│  └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────┘
```

**URL Parameters:**
```
/study/[deckId]?mode=quiz&source=xeno-canto&limit=10
```

**Technische werking:**
1. `getQuizCardsWithXenoCantoMedia` haalt voor elke soort in het deck een random geluid op
2. Kwaliteitsfilter: alleen opnames met rating B of hoger
3. Distractors worden gegenereerd met de bestaande 8-niveau taxonomische logica
4. Audio wordt via de proxy gestreamd (`/api/xeno-canto/stream/[id]`)
5. Sonogram URL wordt meegestuurd voor visuele weergave

---

## Database Wijzigingen

### card_media tabel

Bestaande kolommen zijn voldoende:
- `type`: "audio"
- `url`: Xeno-canto audio URL of lokale URL
- `attribution_name`: Recordist
- `attribution_source`: "Xeno-canto"
- `attribution_url`: Xeno-canto page URL
- `license`: CC licentie

**Nieuwe kolom (optioneel):**
```sql
ALTER TABLE card_media ADD COLUMN sonogram_url TEXT;
```

---

## Toekomstige Ideeën

### 1. Moeilijkheidsgraden op basis van Quality
- Gebruiker kiest moeilijkheid
- Quality filter past zich aan
- Zie "Quality Ratings" sectie hierboven

### 2. Sound Type Filter in Quiz
- "Zang Quiz" - alleen songs
- "Roepen Quiz" - alleen calls
- "Mix" - alles door elkaar

### 3. Regionale Filter
- Filter op land (bijv. alleen Nederlandse opnames)
- Relevanter voor lokale herkenning

### 4. Seizoensgebonden Geluiden
- Filter op opnamedatum
- Voorjaarsgeluiden vs. jaarrond

### 5. Audio Vergelijking
- Twee soorten naast elkaar
- "Welke is de Koolmees?"

### 6. Playback Speed
- Langzamer afspelen voor moeilijke geluiden
- Sneller voor experts

### 7. Loop Mode
- Herhaal fragment automatisch
- Handig voor leren

### 8. Spectogram Analyse
- Interactieve sonogram
- Hover voor frequentie info

---

## Implementatie Volgorde

### MVP (Fase 1-3) ✅ Voltooid
1. ✅ Service file (`src/lib/services/xeno-canto.ts`)
2. ✅ Xeno-canto picker in media editor (`src/components/deck/xeno-canto-media-picker.tsx`)
3. ✅ Server action voor audio toevoegen (`src/lib/actions/decks.ts`)

### Uitbreiding (Fase 4-5)
4. ✅ Soortenpagina audio sectie (`src/components/species/species-audio-player.tsx`)
5. ✅ Quiz met geluiden (`src/lib/actions/quiz.ts`, `getQuizCardsWithXenoCantoMedia`)

### Nice-to-have
6. ⬜ Moeilijkheidsgraden (quality-based difficulty)
7. ✅ Sound type filters (geïmplementeerd in picker en species page)
8. ✅ Regionale filters (land filter met Nederland als standaard)

---

## API Key Setup

### Lokale ontwikkeling
1. Registreer gratis op https://xeno-canto.org
2. Ga naar je account pagina
3. Kopieer je API key
4. Voeg toe aan `.env.local`:
   ```
   XENO_CANTO_API_KEY=your-api-key
   ```

### Productie (Vercel)
Voeg de API key toe via Vercel Dashboard:
1. Ga naar Project Settings → Environment Variables
2. Voeg `XENO_CANTO_API_KEY` toe met je API key
3. Selecteer alle environments (Production, Preview, Development)
4. Redeploy de applicatie

---

## Bronnen

- [Xeno-canto API v3 Documentation](https://xeno-canto.org/explore/api)
- [Xeno-canto Terms of Use](https://xeno-canto.org/about/terms)
- [Xeno-canto FAQ - Quality Ratings](https://xeno-canto.org/help/FAQ#rating)
- [Creative Commons Licenses](https://creativecommons.org/licenses/)

---

*Document aangemaakt: januari 2026*
*Laatst bijgewerkt: februari 2026 (Alle 5 fasen voltooid)*
