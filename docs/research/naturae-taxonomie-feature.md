# Taxonomie-integratie voor Naturae.app

## 1. Context & Doel

### Huidige situatie
Naturae.app is een leerplatform voor natuurherkenning waar gebruikers flashcard-sets kunnen aanmaken en delen. Sets bevatten kaarten met afbeeldingen en geluid om soorten te leren herkennen.

Op dit moment:
- Kunnen gebruikers vrij kaarten aanmaken zonder koppeling aan een taxonomisch systeem
- Is er een label-systeem voor categorisering (beheerd door admin)
- Is er geen gestandaardiseerde manier om soorten te identificeren across sets

### Waarom taxonomie?
Een taxonomisch systeem als ruggengraat maakt naturae.app onderscheidend van generieke flashcard-apps zoals Quizlet:

- **Consistentie**: "Paardenbijter" in set A is gegarandeerd dezelfde soort als in set B
- **Navigatie**: Gebruikers kunnen browsen via taxonomische hiërarchie (Insecten → Libellen → Glazenmakers)
- **Cross-set features**: Statistieken per soort, gerelateerde soorten, soorten die vaak verward worden
- **Fundament voor toekomstige features**: Soortpagina's, verspreidingskaarten, ecologische informatie

---

## 2. Kernbeslissingen

### Databron: GBIF
We gebruiken de [GBIF (Global Biodiversity Information Facility)](https://www.gbif.org/) API als taxonomische backbone:
- Internationale standaard, breed gebruikt
- Gratis API zonder authenticatie voor basis-calls
- Bevat wetenschappelijke namen, synoniemen, Nederlandse namen, volledige hiërarchie
- Elke soort heeft een unieke `usageKey` (taxon ID)

### Koppelingsstrategie: Gestuurd, niet verplicht
- Bij het aanmaken van een kaart krijgt de gebruiker een autocomplete-suggestie voor soorten
- Koppeling is optioneel — kaarten zonder soortkoppeling blijven functioneren
- Dit zorgt voor backwards compatibility en lage drempel

### Species tabel als basis
Een centrale `species` tabel die gevuld wordt on-demand wanneer soorten voor het eerst gekoppeld worden.

---

## 3. Datamodel

### Onderzoeksvraag
> **Voor implementatie**: Breng de huidige database-structuur in kaart. Welke tabellen bestaan er voor decks, cards, labels? Wat zijn de primary keys en bestaande relaties?

### Voorstel: Species tabel

```sql
CREATE TABLE species (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gbif_key INTEGER UNIQUE NOT NULL,          -- GBIF usageKey
    scientific_name TEXT NOT NULL,              -- "Aeshna cyanea"
    canonical_name TEXT,                        -- "Aeshna cyanea" (zonder auteur)
    vernacular_name_nl TEXT,                    -- "Blauwe glazenmaker"
    
    -- Taxonomische hiërarchie
    kingdom TEXT,                               -- "Animalia"
    phylum TEXT,                                -- "Arthropoda"
    class TEXT,                                 -- "Insecta"
    "order" TEXT,                               -- "Odonata"
    family TEXT,                                -- "Aeshnidae"
    genus TEXT,                                 -- "Aeshna"
    
    -- GBIF keys voor hiërarchie (voor navigatie)
    family_key INTEGER,
    order_key INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Voorstel: Koppeling met kaarten

```sql
-- Optie A: Directe foreign key op cards tabel
ALTER TABLE cards ADD COLUMN species_id UUID REFERENCES species(id);

-- Optie B: Koppeltabel (als een kaart meerdere soorten kan bevatten)
CREATE TABLE card_species (
    card_id UUID REFERENCES cards(id),
    species_id UUID REFERENCES species(id),
    PRIMARY KEY (card_id, species_id)
);
```

> **Beslispunt**: Kan één kaart meerdere soorten bevatten, of is het altijd 1:1?

---

## 4. Implementatiestappen

### Fase 1: Basis infrastructuur
1. Species tabel aanmaken
2. GBIF service/utility bouwen voor API calls
3. Endpoint om soort op te zoeken/toe te voegen

### Fase 2: Koppeling UI
1. Autocomplete component bij kaart-aanmaak
2. Soortselectie opslaan bij kaart
3. Bestaande kaarten blijven werken (species_id nullable)

### Fase 3: Taxonomisch navigeren
1. Filter/zoek op soortgroep in discover-pagina
2. Tonen van taxonomische info bij sets/kaarten
3. "Bekijk alle sets met deze soort" functionaliteit

### Toekomstig (v2+)
- Soortpagina's met rijke informatie
- Verspreidingskaarten via GBIF occurrence data
- Geluidsintegratie via Xeno-canto API
- Cross-set leerstatistieken per soort

---

## 5. GBIF API Integratie

### Primaire endpoint: Species Match
```
GET https://api.gbif.org/v1/species/match?name={zoekterm}
```

Voorbeeld response:
```json
{
    "usageKey": 1428038,
    "scientificName": "Aeshna cyanea (Müller, 1764)",
    "canonicalName": "Aeshna cyanea",
    "rank": "SPECIES",
    "status": "ACCEPTED",
    "kingdom": "Animalia",
    "phylum": "Arthropoda",
    "class": "Insecta",
    "order": "Odonata",
    "family": "Aeshnidae",
    "genus": "Aeshna",
    "kingdomKey": 1,
    "phylumKey": 54,
    "classKey": 216,
    "orderKey": 789,
    "familyKey": 4209,
    "genusKey": 1428032,
    "speciesKey": 1428038
}
```

### Secundair: Suggest (voor autocomplete)
```
GET https://api.gbif.org/v1/species/suggest?q={zoekterm}
```

Geeft lijst van mogelijke matches — beter voor autocomplete UX.

### Vernacular names (Nederlandse namen)
```
GET https://api.gbif.org/v1/species/{usageKey}/vernacularNames
```

### Edge cases
- **Geen match**: Toon melding, sta toe om zonder koppeling door te gaan
- **Meerdere matches**: Toon lijst, laat gebruiker kiezen
- **Synoniemen**: GBIF resolved automatisch naar geaccepteerde naam

---

## 6. UX Overwegingen

### Autocomplete flow
1. Gebruiker begint te typen in soortnaam-veld
2. Na 2-3 karakters: call naar GBIF suggest endpoint
3. Toon dropdown met matches (wetenschappelijke + Nederlandse naam)
4. Gebruiker selecteert of typt verder
5. Bij selectie: haal volledige soortinfo op en sla op in species tabel (indien nieuw)

### Geen koppeling
- Duidelijk maken dat koppeling optioneel is
- Kaarten zonder koppeling werken normaal
- Eventueel later: prompt om alsnog te koppelen

### Backwards compatibility
- Bestaande kaarten krijgen `species_id = NULL`
- Alle huidige functionaliteit blijft werken
- Taxonomie-features alleen beschikbaar voor gekoppelde kaarten

---

## 7. Toekomstige mogelijkheden

Deze taxonomie-basis maakt mogelijk:

| Feature | Beschrijving | Benodigde data |
|---------|--------------|----------------|
| Soortpagina's | Overzicht van soort met foto's, geluid, ecologie | species tabel + externe APIs |
| Verspreidingskaarten | Waar komt de soort voor? | GBIF occurrence API |
| Geluidsintegratie | Zang/roep per soort | Xeno-canto API |
| "Lijkt op" suggesties | Soorten die vaak verward worden | Handmatig of ML |
| Leerstatistieken per soort | "Je herkent glazenmakers goed" | species_id op cards + user progress |
| Taxonomische browser | Navigeer als boomstructuur | family_key, order_key relaties |

---

## 8. Beslissingen (januari 2026)

### ✅ Afgehandelde vragen

| Vraag | Beslissing | Toelichting |
|-------|------------|-------------|
| **Huidige database schema** | ✅ In kaart gebracht | `species` tabel bestaat al met JSONB velden |
| **1 soort per kaart of meerdere?** | **1 soort per kaart** | Simpeler, past bij flashcard model |
| **Frontend of backend GBIF calls?** | **Backend via Server Actions** | Veilig, caching mogelijk, consistent met rest van app |
| **Caching strategie?** | **Database caching** | Soort opslaan in `species` tabel na eerste GBIF lookup |
| **Soorten niet in GBIF?** | **Handmatige toevoeging mogelijk** | `gbif_key` is nullable, `source` veld voor herkomst |
| **Nederlandse namen apart ophalen?** | **Nee** | GBIF match response bevat vaak al vernacular names |

### Implementatie details

#### Backend GBIF calls (Server Actions)
Waarom backend i.p.v. frontend:
- ✅ API keys veilig op server
- ✅ Caching op server niveau mogelijk
- ✅ Rate limiting beheersbaar
- ✅ Data transformatie voordat het naar client gaat
- ✅ Consistent met andere Server Actions in de app

#### Database caching strategie
```
1. User zoekt "merel"
2. Check eerst eigen `species` tabel (WHERE scientific_name ILIKE '%merel%' OR common_names->>'nl' ILIKE '%merel%')
3. Niet gevonden? → GBIF API call
4. User selecteert soort → Opslaan in `species` tabel
5. Volgende keer: direct uit eigen database
```

#### Handmatige soorten (niet in GBIF)
- `gbif_key = NULL` voor handmatig toegevoegde soorten
- `source` veld: `'gbif'` of `'manual'`
- Handmatige soorten kunnen later aan GBIF gekoppeld worden

---

## 9. Bestaand Database Schema

### Huidige species tabel (uit 001_initial_schema.sql)
```sql
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scientific_name TEXT NOT NULL UNIQUE,
  common_names JSONB NOT NULL DEFAULT '{}',     -- {"nl": "Merel", "en": "Blackbird"}
  taxonomy JSONB DEFAULT '{}',                   -- {"kingdom": "Animalia", ...}
  descriptions JSONB DEFAULT '{}',
  facts JSONB DEFAULT '{}',
  external_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users ON DELETE SET NULL
);
```

### Bestaande relaties
- `cards.species_id` → Foreign key naar species (nullable)
- `card_media.species_id` → Foreign key naar species (nullable)

### Benodigde uitbreidingen
De bestaande tabel is goed opgezet met JSONB voor flexibiliteit. We voegen toe:

| Kolom | Type | Doel |
|-------|------|------|
| `gbif_key` | INTEGER UNIQUE | GBIF usageKey voor koppeling |
| `canonical_name` | TEXT | Naam zonder auteur |
| `source` | TEXT | `'gbif'` of `'manual'` |
| `gbif_data` | JSONB | Ruwe GBIF response voor toekomstig gebruik |

De `taxonomy` JSONB blijft behouden (flexibeler dan aparte kolommen).

---

## 10. Migratieplan

### Stap 1: Schema uitbreiden
```sql
ALTER TABLE species
  ADD COLUMN gbif_key INTEGER UNIQUE,
  ADD COLUMN canonical_name TEXT,
  ADD COLUMN source TEXT DEFAULT 'manual',
  ADD COLUMN gbif_data JSONB;

CREATE INDEX idx_species_gbif_key ON species(gbif_key) WHERE gbif_key IS NOT NULL;
CREATE INDEX idx_species_canonical_name ON species(canonical_name);
```

### Stap 2: GBIF Service
Server Action met functies:
- `searchGBIF(query)` - Zoek in GBIF + eigen database
- `getOrCreateSpecies(gbifKey)` - Haal op of maak aan

### Stap 3: UI Component
Autocomplete component voor kaart-editor:
- Debounced search (300ms)
- Toont wetenschappelijke + Nederlandse naam
- "Niet gevonden? Voeg handmatig toe" optie

---

## 11. User Flow Documentatie

### Kaart Editor Flow

De soort-selector wordt toegevoegd als apart veld onder de voor/achterkant editors:

```
┌─────────────────────────────────────────────────────────────────┐
│                    KAART EDITOR                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │     VOORKANT        │  │     ACHTERKANT      │               │
│  │  [foto's/audio]     │  │  [foto's/audio]     │               │
│  │  [vrije tekst]      │  │  [vrije tekst]      │               │
│  └─────────────────────┘  └─────────────────────┘               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Soort (optioneel):                                          ││
│  │ [🔍 Zoek soort...                                    ▼    ] ││
│  │                                                             ││
│  │   Merel (Turdus merula)                              ✓     ││
│  │   Koolmees (Parus major)                                   ││
│  │   ───────────────────────────────                          ││
│  │   Niet gevonden? Voeg handmatig toe...                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Soort tonen op: ○ Voorkant  ● Achterkant  ○ Beide  ○ Geen     │
│                                                                  │
│  [Annuleren]                                    [Opslaan]       │
└─────────────────────────────────────────────────────────────────┘
```

### Study Sessie Weergave

Als een kaart een gekoppelde soort heeft, wordt deze getoond als badge:

```
┌────────────────────────────────────────┐
│  [foto's]                              │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ 🦅 Merel                         │  │  ← Soort badge
│  │   Turdus merula                  │  │    (Nederlandse naam + wetenschappelijk)
│  └──────────────────────────────────┘  │
│                                        │
│  Let op de oranje snavel en           │  ← Vrije tekst (back_text)
│  het gele oogring bij mannetjes.      │
└────────────────────────────────────────┘
```

**Weergave volgorde:**
1. Media (foto's/audio)
2. Soort badge (indien gekoppeld en `species_display` dit toestaat)
3. Vrije tekst (`front_text` of `back_text`)

### Species Display Opties

| Waarde | Betekenis |
|--------|-----------|
| `'back'` | Soort badge alleen op achterkant (default) |
| `'front'` | Soort badge alleen op voorkant |
| `'both'` | Soort badge op beide kanten |
| `'none'` | Soort gekoppeld maar niet zichtbaar |

### Database Wijziging

Nieuw veld op `cards` tabel:
```sql
ALTER TABLE cards
  ADD COLUMN species_display TEXT DEFAULT 'back';

ALTER TABLE cards
  ADD CONSTRAINT cards_species_display_check
  CHECK (species_display IS NULL OR species_display IN ('front', 'back', 'both', 'none'));
```

---

## 12. Bulk Import Aanpassingen

### Bestandsnaam → Soort Koppeling

| Scenario | Voorbeeld | Actie |
|----------|-----------|-------|
| Wetenschappelijke naam aanwezig | `001_Merel_Turdus-merula.mp3` | GBIF exacte match → auto-koppel |
| Alleen Nederlandse naam | `001_Merel.mp3` | GBIF suggest → toon in preview |
| Geen herkenbare naam | `IMG_22213.jpg` | Skip lookup, `species_id = NULL` |

### Import Preview met Soort Status

```
┌─────────────────────────────────────────────────────────────────┐
│ Preview (5 kaarten)                                             │
├─────────────────────────────────────────────────────────────────┤
│ 1. [🎵] Merel           Turdus merula        ✓ Gekoppeld        │
│ 2. [🎵] Koolmees        Parus major          ✓ Gekoppeld        │
│ 3. [🎵] Roodborst       ?                    ⚠ Zoeken...        │
│ 4. [📷] vogel_foto.jpg  -                    ○ Geen soort       │
│ 5. [📷] IMG_22213.jpg   -                    ○ Geen soort       │
└─────────────────────────────────────────────────────────────────┘

[Alle soorten zoeken]  [5 kaarten importeren]  [Annuleren]
```

### Import Logica

```typescript
// Pseudocode voor import flow
for (card of importCards) {
  if (card.scientificName) {
    // Exacte match proberen
    const species = await matchSpeciesByScientificName(card.scientificName);
    if (species) card.speciesId = species.id;
  } else if (card.dutchName && !looksLikeFilename(card.dutchName)) {
    // Nederlandse naam proberen (optioneel, user kan bevestigen)
    const suggestions = await searchSpecies(card.dutchName);
    if (suggestions.length === 1 && suggestions[0].confidence > 0.9) {
      card.speciesId = suggestions[0].id;
    } else {
      card.speciesSuggestions = suggestions; // Toon in preview
    }
  }
  // Anders: geen species lookup, user kan later handmatig koppelen
}
```

---

## 13. Implementatie Fase 1: Server Actions (Voltooid)

**Datum:** januari 2026
**Status:** ✅ Voltooid en getest

### Gemaakte bestanden

| Bestand | Beschrijving |
|---------|--------------|
| `src/types/species.ts` | TypeScript types voor Species, GBIF responses, search results |
| `src/lib/actions/species.ts` | Server Actions voor GBIF integratie |
| `src/app/(main)/test-species/page.tsx` | Test pagina (te verwijderen na implementatie) |

### Server Actions

```typescript
// Zoek soorten (lokaal + GBIF)
searchSpecies(query: string): Promise<{ data: SpeciesSearchResult[]; error?: string }>

// Haal soort op of maak aan vanuit GBIF key
getOrCreateSpecies(gbifKey: number): Promise<{ data: Species | null; error?: string }>

// Maak handmatige soort aan (niet in GBIF)
createManualSpecies(input: CreateManualSpeciesInput): Promise<{ data: Species | null; error?: string }>

// Haal soort op via ID
getSpeciesById(id: string): Promise<{ data: Species | null; error?: string }>

// Match soort op wetenschappelijke naam (voor bulk import)
matchSpeciesByName(scientificName: string): Promise<{ data: Species | null; error?: string }>
```

### Zoekstrategie

De `searchSpecies` functie zoekt in drie stappen:

1. **Lokale database (primair)** - wetenschappelijke namen + Nederlandse namen in `common_names`
2. **Lokale vernacular search** - doorzoekt alle talen in `gbif_data.vernacularNames`
3. **GBIF API (parallel)**:
   - `/species/suggest?q=` - wetenschappelijke namen
   - `/species/search?q=` - zoekt ook in vernacular names

### GBIF API Learnings

| Endpoint | Werkt voor | Notitie |
|----------|------------|---------|
| `/species/suggest?q=` | Wetenschappelijke namen | Snel, maar geen vernacular search |
| `/species/search?q=` | Beide | Langzamer, maar vindt "huismus" → Passer domesticus |
| `/species/search?vernacularName=` | ❌ Werkt niet | Geeft willekeurige resultaten |
| `/species/{key}` | Volledige soort data | Inclusief taxonomie |
| `/species/{key}/vernacularNames` | Alle vertalingen | Nederlands = `language: "nld"` |

### Database Caching

Bij selectie van een GBIF soort:
1. Check of `gbif_key` al bestaat in `species` tabel
2. Zo niet: fetch volledige data + vernacular names van GBIF
3. Sla op met `source: 'gbif'` en alle vernacular names in `gbif_data`
4. Volgende keer: direct uit lokale database (sneller + offline beschikbaar)

### Test Resultaten

| Zoekterm | Verwacht | Resultaat |
|----------|----------|-----------|
| "merel" | Turdus merula | ✅ Gevonden (lokaal na eerste selectie) |
| "Turdus merula" | Turdus merula | ✅ Gevonden |
| "huismus" | Passer domesticus | ✅ Gevonden via GBIF search |
| "blackbird" | Turdus merula | ✅ Gevonden via Engelse naam |

---

## 14. Implementatie Fase 2: SpeciesSelector Component (Voltooid)

**Datum:** januari 2026
**Status:** ✅ Voltooid

### Gemaakte bestanden

| Bestand | Beschrijving |
|---------|--------------|
| `src/components/species/species-selector.tsx` | Autocomplete component voor soort selectie |
| `src/components/species/index.ts` | Barrel export |

### Component Features

- **Debounced search** (300ms) voorkomt te veel API calls
- **Lokaal vs GBIF badges** toont bron van elke zoekresultaat
- **Inline loading state** tijdens zoeken
- **Clear button** om selectie te wissen
- **Keyboard navigatie** volledig ondersteund

### Props Interface

```typescript
interface SpeciesSelectorProps {
  value: string | null;           // species ID
  onChange: (speciesId: string | null, species: Species | null) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

---

## 15. Implementatie Fase 3: Card Editor Integratie (Voltooid)

**Datum:** januari 2026
**Status:** ✅ Voltooid

### Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/actions/decks.ts` | `updateCard` ondersteunt nu `speciesId` en `speciesDisplay` |
| `src/app/(main)/decks/[id]/edit/page.tsx` | Haalt species data op via Supabase join |
| `src/components/deck/deck-editor.tsx` | Geeft species props door aan WysiwygCardEditor |
| `src/components/deck/wysiwyg-card-editor.tsx` | Toont SpeciesSelector + display opties |

### UI Flow

1. Gebruiker klikt op een kaart om te bewerken
2. Onder de voor/achterkant editors verschijnt de SpeciesSelector
3. Zoeken op Nederlandse of wetenschappelijke naam
4. Bij selectie verschijnen radio buttons voor display locatie
5. Opslaan stuurt `speciesId` en `speciesDisplay` naar de server

### Supabase Query Handling

Supabase retourneert foreign key joins soms als array, soms als object. De code handelt dit af:

```typescript
const speciesData = Array.isArray(card.species)
  ? card.species[0]
  : card.species;
```

---

## 16. Implementatie Fase 4: Study Sessie Badge (Voltooid)

**Datum:** januari 2026
**Status:** ✅ Voltooid

### Aangepaste bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/actions/study.ts` | `getStudyCards` haalt species data op |
| `src/app/(public)/study/[deckId]/page.tsx` | Geeft species data door aan Flashcard |
| `src/components/flashcard/flashcard.tsx` | Toont species badge op basis van `speciesDisplay` |

### Badge Weergave

De badge toont:
- Nederlandse naam (indien beschikbaar) of canonieke naam
- Wetenschappelijke naam cursief tussen haakjes (indien anders dan display naam)

```tsx
<div className="mt-4 pt-3 border-t border-border/50">
  <div className="text-sm text-muted-foreground">
    <span className="font-medium">{displayName}</span>
    <span className="italic ml-1.5">({scientificName})</span>
  </div>
</div>
```

### Display Logic

| `speciesDisplay` | Voorkant | Achterkant |
|------------------|----------|------------|
| `'front'` | ✅ | ❌ |
| `'back'` (default) | ❌ | ✅ |
| `'both'` | ✅ | ✅ |
| `'none'` | ❌ | ❌ |

---

## 17. Layout Verbetering: Soort als Primair Antwoord (Voltooid)

**Datum:** januari 2026
**Status:** ✅ Voltooid

### Probleem

De originele layout behandelde de soort als secundaire informatie:
- In de editor stond "Soort koppelen" onderaan als apart veld
- In de leermodus werd de vrije tekst (backText) groot getoond, met de soort klein eronder

Dit is niet ideaal voor een flashcard app gericht op soortherkenning, waar de **soort** het primaire antwoord zou moeten zijn.

### Oplossing

#### Editor Layout (wysiwyg-card-editor.tsx)

De CardSideEditor component combineert media én tekst in één card-preview. Dit geeft gebruikers een WYSIWYG-ervaring die overeenkomt met hoe de flashcard eruit zal zien.

**Voor:**
```
┌─────────────────────┐  ┌─────────────────────┐
│ Voorkant            │  │ Achterkant          │
│ [media + tekst]     │  │ [media + tekst]     │
└─────────────────────┘  └─────────────────────┘

Soort koppelen (optioneel): [selector]

[Opslaan] [Annuleren]
```

**Na:**
```
┌─────────────────────┐  ┌─────────────────────┐
│ Voorkant            │  │ Achterkant          │
│ [media + tekst]     │  │ [media + tekst]     │
│ placeholder: "Vraag │  │ placeholder: "Extra │
│ hint of context"    │  │ informatie"         │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────────────────────────────┐
│ Soort (primair antwoord)                   │  ← Prominent styling
│ [🔍 Zoek op Nederlandse of wetenschappe...] │
│ Tonen op: ● Achterkant ○ Voorkant ○ Beide  │
└─────────────────────────────────────────────┘

[Opslaan] [Annuleren]
```

**Wijzigingen:**
- Soort selector krijgt prominente styling (`bg-primary/5 border-primary/20 rounded-lg p-4`)
- Label veranderd naar "Soort (primair antwoord)" met `font-semibold`
- Achterkant tekstveld placeholder veranderd naar "Extra informatie (optioneel)"

#### Leermodus Weergave (flashcard.tsx)

**Voor (achterkant):**
```
[Media]
Alpenwatersalamander          ← backText groot, primary color
──────────────────────
Alpenwatersalamander          ← Species klein, muted
(Ichthyosaura alpestris)
```

**Na (achterkant):**
```
[Media]
Alpenwatersalamander          ← Species groot, primary color
Ichthyosaura alpestris        ← Wetenschappelijke naam cursief
──────────────────────
Leeft in berggebieden...      ← backText kleiner, als extra info
```

**Wijzigingen:**
- Nieuwe functie `renderSpeciesPrimary()` voor prominente weergave
- Als `showSpeciesOnBack` true is: species = primair, backText = secundair
- Als geen species: backText blijft primair (backwards compatible)
- Zelfde logica voor voorkant wanneer `speciesDisplay === 'front' | 'both'`

### Weergave Hiërarchie

| Element | Met Species | Zonder Species |
|---------|-------------|----------------|
| **Primair** | Soort (groot, primary) | backText (groot, primary) |
| **Secundair** | backText (kleiner, muted) | - |
| **Wetenschappelijk** | Cursief onder primair | - |

---

## 18. Fase 5: Bulk Import Species Matching (Voltooid)

**Datum:** januari 2026
**Status:** ✅ Voltooid

### Overzicht

Bij het importeren van bestanden worden nu automatisch soorten herkend uit bestandsnamen en gekoppeld aan de GBIF taxonomie.

### Nieuwe Types

```typescript
// src/lib/import/types.ts

type SpeciesMatchStatus =
  | "pending"      // Nog niet gezocht
  | "searching"    // Bezig met zoeken
  | "matched"      // Exacte match gevonden
  | "suggested"    // Suggesties gevonden, user moet kiezen
  | "not_found"    // Geen match gevonden
  | "skipped";     // Geen herkenbare naam (bijv. IMG_1234)

interface SpeciesMatch {
  speciesId: string;
  scientificName: string;
  dutchName: string | null;
  gbifKey: number | null;
  confidence: "exact" | "high" | "low";
}

// Uitbreiding ImportCardPreview
interface ImportCardPreview {
  // ... bestaande velden
  speciesMatchStatus: SpeciesMatchStatus;
  speciesMatch: SpeciesMatch | null;
  speciesSuggestions: SpeciesMatch[];
}

// Uitbreiding ImportResult
interface ImportResult {
  // ... bestaande velden
  speciesId: string | null;
}
```

### UI Workflow

1. **Bestanden selecteren** - Gebruiker sleept bestanden naar import zone
2. **"Soorten zoeken" knop** - Start automatische matching:
   - Wetenschappelijke naam in bestandsnaam → Exacte GBIF match
   - Nederlandse naam → Zoek in lokale DB + GBIF
   - Bestandsnaam-patronen (IMG_1234) worden geskipt
3. **Preview met status icons**:
   - ✅ Groen: Gekoppeld (automatisch of handmatig bevestigd)
   - ⚠️ Amber: Suggesties beschikbaar (klik om te kiezen)
   - ⚪ Grijs: Niet gevonden / overgeslagen
4. **Import** - Soorten worden automatisch gekoppeld aan kaarten

### Visuele Preview

```
┌─────────────────────────────────────────────────────────────────┐
│ Soorten koppelen                          [🔍 Soorten zoeken]   │
│ Automatisch soorten herkennen uit bestandsnamen                 │
│                                                                 │
│ ✅ 12 gekoppeld  ⚠️ 3 suggesties  ⚪ 2 niet gevonden            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Preview (17 kaarten)                                            │
├─────────────────────────────────────────────────────────────────┤
│ 1. [🎵] Merel                                              ✅   │
│        [Turdus merula] ✕                                        │
│                                                                 │
│ 2. [🎵] Roodborst                                          ⚠️   │
│        Kies een soort: [Roodborst] [Europese roodborst]         │
│                                                                 │
│ 3. [📷] IMG_22213.jpg                                      ⚪   │
└─────────────────────────────────────────────────────────────────┘
```

### Matching Logica

```typescript
// 1. Bestandsnaam check - skip camera patronen
if (looksLikeFilename(name)) {
  status = "skipped";
  return;
}

// 2. Wetenschappelijke naam in bestandsnaam → exacte match
if (scientificName) {
  const result = await matchSpeciesByName(scientificName);
  if (result.data) {
    status = "matched";
    confidence = "exact";
  }
}

// 3. Nederlandse naam → zoek suggesties
if (!match && dutchName) {
  const results = await searchSpecies(dutchName);

  // Exacte Nederlandse naam match → auto-koppel
  if (results[0].dutch_name === dutchName) {
    status = "matched";
    confidence = "exact";
  } else if (results.length > 0) {
    status = "suggested";
    suggestions = results.slice(0, 5);
  } else {
    status = "not_found";
  }
}
```

### Backend Aanpassingen

```typescript
// src/lib/actions/import.ts - addCardsToDeck()

const cardsToInsert = cards.map((card, index) => ({
  deck_id: deckId,
  front_text: null,
  back_text: card.dutchName,
  position: startPosition + card.position + index,
  species_id: card.speciesId || null,           // Nieuw
  species_display: card.speciesId ? "back" : null,  // Nieuw
}));
```

### Bestanden Aangepast

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/import/types.ts` | Nieuwe types voor species matching |
| `src/app/(main)/decks/import/page.tsx` | Species matching UI en logica |
| `src/components/deck/bulk-import-form.tsx` | Species velden toegevoegd |
| `src/lib/actions/import.ts` | species_id opslaan bij import |

---

*Alle fasen voltooid: januari 2026*
