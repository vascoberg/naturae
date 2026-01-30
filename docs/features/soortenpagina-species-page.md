# Soortenpagina (Species Page)

*Feature documentatie - januari 2026*

Dedicated pagina per soort met alle beschikbare informatie uit openbare bronnen.

---

## Status: Ontwerp

**Prioriteit:** Hoog
**Geschatte omvang:** Medium-Groot (16-24 uur)
**Route:** `/species/[speciesId]`

---

## 1. Concept

Een pagina waar gebruikers alles over een soort kunnen leren:
- Foto's in verschillende stadia (adult, juveniel, larve, etc.)
- Geluiden (na Xeno-canto integratie)
- Taxonomische informatie
- Wikipedia beschrijving
- Verwante soorten
- Externe links

### Toegangspunten

| Locatie | Book icon? | Gedrag |
|---------|------------|--------|
| **Quiz opties** | ✅ Ja | Sheet/modal (blijft in quiz) |
| **Flashcard back** | ✅ Ja | Sheet/modal |
| **Public photo flashcard** | ✅ Ja | Sheet/modal |
| **Card grid (deck overview)** | ✅ Ja | Sheet/modal |
| **Card editor** | ❌ Nee | n.v.t. |
| **Direct URL** | - | Volledige pagina |

### Link Gedrag: Sheet/Modal

De soortenpagina opent als **Sheet** (slide-up panel) zodat:
- Leerflow niet onderbroken wordt
- Gebruiker in context blijft
- Snel kan terugkeren naar quiz/flashcard
- Geen nieuwe pagina load nodig

```
┌─────────────────────────────────────────┐
│  Quiz vraag                       3/10  │
│  ┌─────────────────────────────────┐    │
│  │        [Foto]                   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Koolmees            [📖]       │    │  ← Book icon rechts
│  │ Parus major                     │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Pimpelmees           [📖]       │    │
│  │ Cyanistes caeruleus             │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘

        ↓ Klik op 📖 opent Sheet ↓

┌─────────────────────────────────────────┐
│  Quiz vraag (dimmed)              3/10  │
├─────────────────────────────────────────┤
│ ══════════════════════════════════════  │  ← Sheet schuift omhoog
│  Koolmees · Parus major           [✕]  │
│  ─────────────────────────────────────  │
│  [Foto carrousel]                       │
│  📷 J. Smith · CC-BY · iNaturalist      │
│                                         │
│  📖 Beschrijving                        │
│  De koolmees is een algemene...         │
│                                         │
│  👥 Verwante soorten                    │
│  [Pimpel] [Kuif] [Zwart]                │
│                                         │
└─────────────────────────────────────────┘
```

---

## 2. GBIF Metadata Uitbreiding

### Nieuwe velden uit GBIF Occurrence API

De GBIF API biedt meer metadata dan we nu gebruiken:

| Veld | Type | Beschrijving | Voorbeeldwaarden |
|------|------|--------------|------------------|
| `sex` | string | Geslacht | Male, Female, Hermaphrodite |
| `lifeStage` | string | Levensstadium | Adult, Juvenile, Larva, Pupa, Egg, Embryo |
| `eventDate` | string | Datum waarneming | "2024-05-15" |
| `country` | string | Land | "Netherlands" |
| `locality` | string | Locatie (optioneel) | "Amsterdam" |

### Interface Uitbreiding

```typescript
// src/lib/services/gbif-media.ts

export interface GBIFMediaResult {
  // Bestaande velden
  identifier: string;
  license: string;
  licenseType: "CC0" | "CC-BY" | "CC-BY-NC";
  creator: string | null;
  references: string | null;
  source: string;

  // Nieuwe velden
  sex?: "Male" | "Female" | "Hermaphrodite" | string;
  lifeStage?: "Adult" | "Juvenile" | "Larva" | "Pupa" | "Egg" | "Embryo" | "Spore" | string;
  eventDate?: string;
  country?: string;
  locality?: string;
}
```

### Implementatie in extractMediaFromOccurrences

```typescript
function extractMediaFromOccurrences(
  occurrences: GBIFOccurrenceResult[]
): GBIFMediaResult[] {
  const mediaItems: GBIFMediaResult[] = [];

  for (const occurrence of occurrences) {
    // ... bestaande media extractie ...

    mediaItems.push({
      identifier: media.identifier,
      license: licenseUrl,
      licenseType: getLicenseType(licenseUrl),
      creator: media.creator || media.rightsHolder || null,
      references: media.references || null,
      source,
      // Nieuwe velden uit occurrence (niet uit media)
      sex: occurrence.sex || undefined,
      lifeStage: occurrence.lifeStage || undefined,
      eventDate: occurrence.eventDate || undefined,
      country: occurrence.country || undefined,
      locality: occurrence.locality || occurrence.verbatimLocality || undefined,
    });
  }

  return mediaItems;
}
```

### Geen Database Wijzigingen Nodig

GBIF foto's worden dynamisch opgehaald, niet opgeslagen. De metadata komt mee met elke API call.

---

## 3. UI Design

### Mockup: Soortenpagina

```
┌─────────────────────────────────────────────────────────────┐
│  ← Terug                                    🔗 Delen        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │              [Foto carrousel]                         │  │
│  │               ← 1/12 →                                │  │
│  │                                                       │  │
│  │   📷 J. Smith · CC-BY · iNaturalist                   │  │
│  │   🏷️ Adult · ♂ Male · 🇳🇱 Netherlands · 15 mei 2024   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Foto's filteren:                                   │    │
│  │  [Alle] [Adult] [Juveniel] [♂] [♀]                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Koolmees                                                   │
│  Parus major · Familie: Paridae (Mezen)                     │
│                                                             │
│  📖 Beschrijving                                            │
│  ─────────────────────────────────────────────────────────  │
│  De koolmees is een algemene standvogel in Nederland.       │
│  Het is de grootste mees van Europa met een zwarte kop      │
│  en witte wangen...                                         │
│  [Meer lezen op Wikipedia →]                                │
│                                                             │
│  🔊 Geluiden (na Xeno-canto integratie)                     │
│  ─────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────┐                │
│  │  [▶]  ═══════════○═══  0:42             │                │
│  │  Zang · R. de Vries · Xeno-canto        │                │
│  └─────────────────────────────────────────┘                │
│                                                             │
│  👥 Verwante soorten (zelfde familie)                       │
│  ─────────────────────────────────────────────────────────  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                           │
│  │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │                           │
│  │Pimpel│ │Kuif │ │Zwart│ │Glans│                           │
│  └─────┘ └─────┘ └─────┘ └─────┘                           │
│                                                             │
│  🔗 Externe links                                           │
│  ─────────────────────────────────────────────────────────  │
│  • Waarneming.nl                                            │
│  • GBIF                                                     │
│  • Wikipedia                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Foto Carrousel met Metadata

Elke foto toont:
- **Attributie:** Fotograaf · Licentie · Bron
- **Tags:** Levensstadium · Geslacht · Land · Datum

### Filter UI

Gebruikers kunnen foto's filteren op:
- **Levensstadium:** Alle / Adult / Juveniel / Larve / Ei
- **Geslacht:** Alle / ♂ Male / ♀ Female

Dit helpt bij het leren van:
- Verschil tussen volwassen en juveniele vogels
- Sexueel dimorfisme (verschil ♂/♀)
- Metamorfose bij insecten/amfibieën

---

## 4. Foto Picker Uitbreiding

De GBIF foto picker in de kaart editor kan ook profiteren van deze metadata:

### Mockup: Verbeterde Foto Picker

```
┌─────────────────────────────────────────────────────────────┐
│  GBIF Foto's voor: Koolmees (Parus major)                   │
├─────────────────────────────────────────────────────────────┤
│  Filters: [Alle stadia ▼] [Alle geslachten ▼]               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   📷    │ │   📷    │ │   📷    │ │   📷    │           │
│  │         │ │         │ │         │ │         │           │
│  │ Adult ♂ │ │ Adult ♀ │ │ Juveniel│ │ Adult ♂ │           │
│  │ 🇳🇱      │ │ 🇩🇪      │ │ 🇬🇧      │ │ 🇧🇪      │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  [Meer laden...]                                            │
└─────────────────────────────────────────────────────────────┘
```

### Voordelen voor Educatie

Bij het maken van leersets kan de gebruiker:
1. **Gericht zoeken** naar foto's van specifieke stadia
2. **Variatie toevoegen** - verschillende perspectieven van dezelfde soort
3. **Didactisch ordenen** - eerst adult, dan juveniel

---

## 5. Databronnen

| Sectie | Primaire Bron | Status |
|--------|---------------|--------|
| **Foto's + metadata** | GBIF Occurrence API | ✅ Uitbreiden |
| **Nederlandse namen** | `species.common_names` | ✅ Beschikbaar |
| **Taxonomie** | `species.taxonomy` | ✅ Beschikbaar |
| **Beschrijving** | Wikipedia API | 🆕 Nieuw |
| **Geluiden** | Xeno-canto API | ⏳ Na integratie |
| **Verwante soorten** | GBIF (zelfde familie) | ✅ Query mogelijk |

### Wikipedia API

```typescript
const WIKIPEDIA_API = "https://nl.wikipedia.org/api/rest_v1/page/summary";

async function getWikipediaSummary(speciesName: string): Promise<string | null> {
  // Probeer eerst wetenschappelijke naam
  let response = await fetch(`${WIKIPEDIA_API}/${encodeURIComponent(speciesName)}`);

  if (!response.ok) {
    // Fallback naar Nederlandse naam
    response = await fetch(`${WIKIPEDIA_API}/${encodeURIComponent(dutchName)}`);
  }

  if (!response.ok) return null;

  const data = await response.json();
  return data.extract; // Plain text samenvatting
}
```

---

## 6. Book Icon Implementatie

### Icon: Lucide `BookOpen`

```tsx
import { BookOpen } from "lucide-react";

// In quiz-question.tsx
<Button
  variant="ghost"
  className="..."
  onClick={(e) => {
    e.stopPropagation(); // Voorkom antwoord selectie
    onSpeciesClick(option.speciesId);
  }}
>
  <div className="flex-1">
    <p className="font-medium">{option.name}</p>
    <p className="text-xs italic">{option.scientificName}</p>
  </div>
  <BookOpen
    className="h-4 w-4 text-muted-foreground hover:text-primary"
    onClick={(e) => {
      e.stopPropagation();
      openSpeciesSheet(option.speciesId);
    }}
  />
</Button>
```

### stopPropagation Aanpak

**Probleem:** Book icon zit IN de answer button. Klikken mag niet het antwoord selecteren.

**Oplossing:** `e.stopPropagation()` op de icon click handler.

```tsx
// Twee click zones in één button:
<Button onClick={selectAnswer}>
  <span>Koolmees</span>
  <BookOpen onClick={(e) => {
    e.stopPropagation(); // Stop event bubbling
    openSheet();         // Open species sheet
  }} />
</Button>
```

**Test scenario's:**
1. ✅ Klik op naam → selecteert antwoord
2. ✅ Klik op book icon → opent sheet, selecteert NIET
3. ✅ Touch op naam → selecteert antwoord
4. ✅ Touch op book icon → opent sheet, selecteert NIET
5. ✅ Keyboard Enter op button → selecteert antwoord (icon niet focusable)

### Sheet Component

Gebruik shadcn Sheet component:

```tsx
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";

<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent side="bottom" className="h-[85vh]">
    <SheetHeader>
      <SheetTitle>{species.displayName}</SheetTitle>
    </SheetHeader>
    <SpeciesContent species={species} />
  </SheetContent>
</Sheet>
```

---

## 7. Implementatie Fases

### Fase 1: Basis Pagina & Sheet ✅ AFGEROND

**Taken:**
- [x] Route `/species/[speciesId]` aanmaken (volledige pagina)
- [x] `SpeciesSheet` component (herbruikbaar)
- [x] Species data ophalen uit database
- [x] Basis UI: naam, wetenschappelijke naam, taxonomie
- [x] GBIF foto carrousel met bestaande service
- [x] Externe links gebruiken `canonical_name` (fix: "Turdus merula" i.p.v. "Turdus merula Linnaeus, 1758")

**Geïmplementeerde bestanden:**
- `src/app/(public)/species/[speciesId]/page.tsx` - Volledige pagina route
- `src/app/api/species/[id]/route.ts` - API endpoint voor Sheet
- `src/components/species/species-sheet.tsx` - Sheet component
- `src/components/species/species-photo-carousel.tsx` - Foto carrousel

**✅ Checkpoint Fase 1:** (getest 30-01-2026)
```
✓ /species/[id] URL werkt en toont species info
✓ Sheet component bestaat (integratie in Fase 2)
✓ GBIF foto's laden in carrousel
✓ Navigeren door foto's werkt (< 1/5 >)
✓ Geen errors in console
✓ Externe links werken correct (canonical_name)
```

---

### Fase 2: Book Icon Integratie ✅ AFGEROND

**Taken:**
- [x] Book icon toevoegen aan quiz opties (quiz-question.tsx, quiz-audio-question.tsx)
- [x] Book icon toevoegen aan flashcard back (flashcard.tsx)
- [x] Book icon toevoegen aan public photo flashcard (public-photo-flashcard.tsx)
- [x] Book icon toevoegen aan card grid (card-grid-view.tsx)
- [x] stopPropagation implementeren en testen
- [x] QuizOption interface uitgebreid met `speciesId`

**Geïmplementeerde wijzigingen:**
- `src/lib/actions/quiz.ts` - speciesId toegevoegd aan QuizOption
- `src/components/study/quiz-question.tsx` - BookOpen icon + SpeciesSheet
- `src/components/study/quiz-audio-question.tsx` - BookOpen icon + SpeciesSheet
- `src/components/flashcard/flashcard.tsx` - BookOpen icon + SpeciesSheet (species.id in interface)
- `src/components/study/public-photo-flashcard.tsx` - BookOpen icon + SpeciesSheet
- `src/components/deck/card-grid-view.tsx` - BookOpen icon + SpeciesSheet

**✅ Checkpoint Fase 2:** (getest 30-01-2026)
```
✓ Book icon zichtbaar in quiz opties (alle 4 antwoorden)
✓ Book icon zichtbaar op flashcard back
✓ Book icon zichtbaar in public photo flashcard
✓ Book icon zichtbaar in card grid (grid + list view)
✓ Klikken op icon opent sheet ZONDER antwoord te selecteren (stopPropagation)
⏳ Touch op mobile werkt correct (test op echte device) - nog te testen
✓ Icon hover state werkt (text-muted-foreground → text-primary)
```

---

### Fase 3: GBIF Metadata ✅ AFGEROND

**Taken:**
- [x] `GBIFMediaResult` interface uitbreiden (sex, lifeStage, etc.)
- [x] `extractMediaFromOccurrences` aanpassen
- [x] Metadata badges weergeven bij foto's
- [x] Filter UI voor lifeStage/sex

**Geïmplementeerde wijzigingen:**
- `src/lib/services/gbif-media.ts` - Interface uitgebreid met sex, lifeStage, eventDate, country, locality
- `src/components/species/species-photo-carousel.tsx` - Metadata badges + filter UI toegevoegd

**Testen:**
| Test | Locatie | Verwacht resultaat |
|------|---------|-------------------|
| Metadata beschikbaar | Foto met lifeStage | Badge "Volwassen" zichtbaar |
| Metadata ontbreekt | Foto zonder lifeStage | Geen badge, geen error |
| Filter Volwassen | Filter chip | Alleen adult foto's |
| Filter combinatie | Volwassen + ♂ | Intersection van filters |

**✅ Checkpoint Fase 3:** (getest 30-01-2026)
```
✓ Foto's tonen metadata badges (Volwassen, ♂ Man, Netherlands, datum)
✓ Foto's zonder metadata tonen geen lege badges
✓ Filter chips werken (Alle / Volwassen / Juveniel / ♂ / ♀)
✓ Filters combineren correct (AND logica)
✓ Console toont geen "undefined" voor ontbrekende velden
✓ "Geen foto's gevonden" message bij lege filter resultaten
```

---

### Fase 4: Wikipedia & Externe Links ✅ AFGEROND

**Taken:**
- [x] Wikipedia API service
- [x] Beschrijving sectie in dialog
- [x] Externe links (GBIF, Waarneming.nl, Wikipedia) - clean tekstlinks zoals BirdID
- [x] Verwante soorten component (zelfde familie) - clickable chips

**Geïmplementeerde wijzigingen:**
- `src/lib/services/wikipedia.ts` - Wikipedia API service (NL + EN fallback)
- `src/app/api/wikipedia/[name]/route.ts` - API endpoint voor Wikipedia
- `src/app/api/species/[id]/route.ts` - Uitgebreid met wikipedia + relatedSpecies
- `src/lib/actions/species.ts` - `getRelatedSpecies()` functie toegevoegd
- `src/components/species/species-sheet.tsx` - BirdID-geïnspireerd design

**Design keuzes (geïnspireerd door BirdID):**
- Clean, minimale UI zonder visuele noise
- "Beschrijving" sectie met Wikipedia extract + "Meer op Wikipedia" link
- "Verwante soorten" als clickable chips (opent in zelfde dialog)
- "Links" sectie met eenvoudige tekstlinks + korte beschrijving

**Testen:**
| Test | Locatie | Verwacht resultaat |
|------|---------|-------------------|
| Wikipedia hit NL | "Koolmees" | Nederlandse beschrijving |
| Wikipedia hit EN | Obscure soort | Engelse beschrijving met (EN) label |
| Wikipedia miss | Zeer obscure soort | Geen beschrijving sectie (graceful) |
| Verwante soorten | Familie Paridae | Chips: Pimpelmees, Kuifmees, etc. |
| Klik verwante soort | Op chip klikken | Laadt die soort in dezelfde dialog |

**✅ Checkpoint Fase 4:** (getest 30-01-2026)
```
✓ Wikipedia beschrijving laadt voor bekende soorten (Koolmees, Merel)
✓ Engelse fallback werkt met (EN) indicator
✓ Onbekende soorten tonen geen beschrijving sectie (geen error)
✓ Externe links openen in nieuw tabblad
✓ Verwante soorten sectie toont soorten uit zelfde familie
✓ Klikken op verwante soort opent die soort in dialog (activeSpeciesId fix)
✓ Design is clean en overzichtelijk (zoals BirdID)
```

---

### Fase 5: Foto Picker Uitbreiding ✅ AFGEROND

**Taken:**
- [x] Metadata weergeven in GBIF foto picker
- [x] Filters toevoegen aan picker
- [x] Selectie behouden met metadata

**Geïmplementeerde wijzigingen:**
- `src/components/deck/gbif-media-picker.tsx` - Metadata badges + filter chips toegevoegd

**Nieuwe functionaliteit:**
- Metadata badges onder elke foto (Volwassen, ♂, ♀)
- Filter chips bovenaan (Alle / Volwassen / Juveniel / ♂ / ♀)
- Geselecteerde foto toont metadata in footer
- CC-BY-NC krijgt oranje badge (onderscheid van CC-BY)

**Testen:**
| Test | Locatie | Verwacht resultaat |
|------|---------|-------------------|
| Metadata in picker | GBIF foto selectie | Badge "Volwassen ♂" onder foto |
| Filter chips | Picker header | Gefilterde resultaten |
| Selectie info | Footer bij selectie | Metadata in beschrijving |

**✅ Checkpoint Fase 5:** (getest 30-01-2026)
```
✓ GBIF foto picker toont metadata badges onder elke foto
✓ Filter chips werken (Alle / Volwassen / Juveniel / ♂ / ♀)
✓ Geselecteerde foto toont metadata in footer
✓ Bestaande picker functionaliteit blijft werken
✓ "Geen foto's gevonden" bij lege filter resultaten
```

---

## 8. Totaal Checkpoint (Feature Complete) ✅

Alle fases zijn afgerond op 30-01-2026:

```
✓ Species sheet opent vanuit quiz, flashcard, en card grid
✓ Book icon klikken selecteert NOOIT per ongeluk een antwoord
✓ Foto carrousel met metadata en filters werkt
✓ Wikipedia beschrijving laadt (met fallback)
✓ Verwante soorten zijn klikbaar (navigatie binnen dialog)
✓ Externe links werken
✓ Foto picker is uitgebreid met metadata
✓ Geen console errors
⏳ Mobile (touch) werkt correct - nog te testen op echte device
✓ Performance acceptabel (sheet opent < 1s)
```

---

## 9. Technische Details

### Route Structuur

```
src/app/(public)/species/[speciesId]/page.tsx  # Volledige pagina (SEO)
src/components/species/species-sheet.tsx        # Sheet component (herbruikbaar)
src/components/species/species-content.tsx      # Shared content
```

### Component Architectuur

```
SpeciesPage (route)
└── SpeciesContent (shared)
    ├── PhotoCarousel
    ├── MetadataFilters
    ├── WikipediaSection
    ├── RelatedSpecies
    └── ExternalLinks

SpeciesSheet (trigger van quiz/flashcard/grid)
└── Sheet (shadcn)
    └── SpeciesContent (zelfde als page)
```

### Data Fetching

**Volledige pagina (Server Component):**
```typescript
export default async function SpeciesPage({ params }) {
  const species = await getSpeciesById(params.speciesId);
  const photos = await getSpeciesMediaList({ gbifKey: species.gbif_key });
  const description = await getWikipediaSummary(species.canonical_name);
  const related = await getRelatedSpecies(species.taxonomy.family);

  return <SpeciesContent ... />;
}
```

**Sheet (Client Component met SWR/React Query):**
```typescript
function SpeciesSheet({ speciesId, isOpen }) {
  const { data: species } = useSWR(`/api/species/${speciesId}`);
  const { data: photos } = useSWR(species?.gbif_key && `/api/gbif-media/${species.gbif_key}`);

  return (
    <Sheet open={isOpen}>
      <SheetContent>
        <SpeciesContent species={species} photos={photos} />
      </SheetContent>
    </Sheet>
  );
}
```

### API Routes (voor Sheet)

```
src/app/api/species/[id]/route.ts       # Species data
src/app/api/gbif-media/[gbifKey]/route.ts  # GBIF foto's met metadata
src/app/api/wikipedia/[name]/route.ts   # Wikipedia samenvatting
```

### Caching

| Data | Cache duur | Methode |
|------|-----------|---------|
| Species (DB) | 5 min | SWR stale-while-revalidate |
| GBIF foto's | 1 uur | Next.js revalidate |
| Wikipedia | 24 uur | Next.js revalidate |
| Verwante soorten | 1 uur | Next.js revalidate |

---

## 10. Referentie: BirdID

Zie [docs/research/Reference/](../research/Reference/) voor BirdID screenshots:

| Screenshot | Relevante elementen |
|------------|---------------------|
| BirdID-02-SoundQuizQuestionInterfaceQuestion.PNG | **Book icon bij elke quiz optie** (rechts uitgelijnd) |
| BirdID-04-SpeciesExplanation1.PNG | Foto carrousel met annotaties |
| BirdID-04-SpeciesExplanation2.PNG | Beschrijving en geluiden |
| BirdID-04-SpeciesExplanation3.PNG | Facts en distribution |
| BirdID-04-SpeciesExplanation4.PNG | Similar species |

---

## 11. Samenvatting Beslissingen

| Beslissing | Keuze | Rationale |
|------------|-------|-----------|
| Link gedrag | Sheet/Modal | Leerflow niet onderbreken |
| Icon | Lucide `BookOpen` | Consistent met shadcn/lucide |
| Quiz icon click | stopPropagation | Voorkom per ongeluk antwoord selecteren |
| Card grid | ✅ Book icon | Overzichtspagina, handig voor leren |
| Card editor | ❌ Geen icon | Editor context, niet leren |
| Database wijzigingen | Geen | GBIF data is dynamisch |

---

*Laatste update: 30 januari 2026*
