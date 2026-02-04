# Bulk Import Configuratie Opties

> Feature voor het configureren van bulk media import.

**Status:** ✅ Geïmplementeerd (4 februari 2026)
**Prioriteit:** Medium
**Gerelateerd:** [Bulk Media Import Verbeteringen](bulk-media-import-improvements.md)

---

## Overzicht

Gebruikers willen meer controle over hoe bestanden worden geïmporteerd. Dit omvat:

1. **Globale import instellingen** - Bovenaan de import configureren
2. **Handmatige soort zoeken** - Voor niet-herkende kaarten

---

## 1. Globale Import Instellingen

### UI Design

Een instellingen-paneel bovenaan de import flow, **na** het selecteren van bestanden:

```
┌─────────────────────────────────────────────────────────────┐
│  Import instellingen                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Foto positie:        ◉ Voorkant    ○ Achterkant            │
│                                                             │
│  Naam tonen als:      ◉ Nederlands                          │
│                       ○ Latijn (wetenschappelijk)            │
│                       ○ Engels                               │
│                       ○ Nederlands + Latijn                  │
│                                                             │
│  Naam plaatsen op:    ◉ Voorkant tekst                      │
│                       ○ Achterkant tekst                     │
│                       ○ Beide (voor/achter gespiegeld)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Configuratie Opties

| Optie | Waarden | Default | Beschrijving |
|-------|---------|---------|--------------|
| `photoPosition` | `"front"` \| `"back"` | `"front"` | Waar de foto wordt geplaatst |
| `nameLanguage` | `"nl"` \| `"scientific"` \| `"en"` \| `"nl_scientific"` | `"nl"` | Welke naam wordt getoond |
| `namePosition` | `"front"` \| `"back"` \| `"both"` | `"front"` | Waar de naam tekst komt |

### Gedrag per Combinatie

| Photo | Name Position | Resultaat |
|-------|---------------|-----------|
| Front | Front | Foto + naam op voorkant, achterkant leeg |
| Front | Back | Foto op voorkant, naam op achterkant |
| Front | Both | Foto + naam voorkant, naam achterkant |
| Back | Front | Naam op voorkant, foto op achterkant |
| Back | Back | Leeg voorkant, foto + naam op achterkant |
| Back | Both | Naam voorkant, foto + naam achterkant |

### Typische Use Cases

1. **Soorten leren (foto → naam)**
   - Photo: Front, Name: Back
   - "Welke soort is dit?" → toont foto, antwoord is naam

2. **Namen leren (naam → foto)**
   - Photo: Back, Name: Front
   - "Hoe ziet [soort] eruit?" → toont naam, antwoord is foto

3. **Beide kanten met info**
   - Photo: Front, Name: Both
   - Foto met naam op voorkant, naam alleen op achterkant

---

## 2. Handmatige Soort Zoeken

### Huidige Situatie

Als een bestandsnaam niet wordt herkend (`speciesMatchStatus: "not_found"`), is er geen optie om handmatig een soort te zoeken.

### Gewenste Situatie

Per kaart moet een "Zoek soort..." knop verschijnen waarmee de gebruiker handmatig kan zoeken, vergelijkbaar met de SpeciesSelector in de deck editor.

### UI Design

Bij een kaart met status "not_found" of "suggested" verschijnt een extra zoekoptie:

```
┌─────────────────────────────────────────────────────────────┐
│ [Thumbnail] Onbekend bestand                       [⚠️] [...] │
│             aeshna_xyz.jpg                                   │
│                                                              │
│             [🔍 Zoek soort...]                               │
│                                                              │
│             of kies suggestie:                               │
│             [Aeshna cyanea] [Aeshna grandis] [+2 meer]       │
└─────────────────────────────────────────────────────────────┘
```

Wanneer "Zoek soort..." wordt geklikt, opent een inline search popover:

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍 Zoek op naam (NL/wetenschappelijk)...              ]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Blauwe glazenmaker                     [Lokaal]             │
│ Aeshna cyanea                                               │
│                                                             │
│ Smaragdlibel                           [Lokaal]             │
│ Cordulia aenea                                              │
│                                                             │
│ Grote keizerlibel                      [GBIF]               │
│ Anax imperator                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technische Implementatie

### Nieuwe Bestanden

| Bestand | Doel |
|---------|------|
| `src/components/deck/import-settings.tsx` | Settings panel component |

### Aan te Passen Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/deck/bulk-import-form.tsx` | Settings state, inline SpeciesSelector |
| `src/lib/import/types.ts` | ImportSettings type |

### 1. Types Toevoegen

**Bestand:** `src/lib/import/types.ts`

```typescript
export type PhotoPosition = "front" | "back";
export type NameLanguage = "nl" | "scientific" | "en" | "nl_scientific";
export type NamePosition = "front" | "back" | "both";

export interface ImportSettings {
  photoPosition: PhotoPosition;
  nameLanguage: NameLanguage;
  namePosition: NamePosition;
}

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  photoPosition: "front",
  nameLanguage: "nl",
  namePosition: "front",
};
```

### 2. Settings Component

**Bestand:** `src/components/deck/import-settings.tsx`

```typescript
"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ImportSettings, PhotoPosition, NameLanguage, NamePosition } from "@/lib/import/types";

interface ImportSettingsProps {
  settings: ImportSettings;
  onChange: (settings: ImportSettings) => void;
}

export function ImportSettingsPanel({ settings, onChange }: ImportSettingsProps) {
  return (
    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
      <h3 className="text-sm font-semibold">Import instellingen</h3>

      {/* Photo Position */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Foto positie</Label>
        <RadioGroup
          value={settings.photoPosition}
          onValueChange={(v) => onChange({ ...settings, photoPosition: v as PhotoPosition })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="front" id="photo-front" />
            <Label htmlFor="photo-front">Voorkant</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="back" id="photo-back" />
            <Label htmlFor="photo-back">Achterkant</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Name Language */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Naam tonen als</Label>
        <RadioGroup
          value={settings.nameLanguage}
          onValueChange={(v) => onChange({ ...settings, nameLanguage: v as NameLanguage })}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nl" id="lang-nl" />
            <Label htmlFor="lang-nl">Nederlands</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scientific" id="lang-sci" />
            <Label htmlFor="lang-sci">Latijn (wetenschappelijk)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="en" id="lang-en" />
            <Label htmlFor="lang-en">Engels</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nl_scientific" id="lang-both" />
            <Label htmlFor="lang-both">Nederlands + Latijn</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Name Position */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Naam plaatsen op</Label>
        <RadioGroup
          value={settings.namePosition}
          onValueChange={(v) => onChange({ ...settings, namePosition: v as NamePosition })}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="front" id="name-front" />
            <Label htmlFor="name-front">Voorkant tekst</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="back" id="name-back" />
            <Label htmlFor="name-back">Achterkant tekst</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="both" id="name-both" />
            <Label htmlFor="name-both">Beide (voor/achter)</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
```

### 3. Inline Species Search

**In:** `src/components/deck/bulk-import-form.tsx`

Voeg een inline versie van de SpeciesSelector toe per kaart:

```typescript
import { SpeciesSelector } from "@/components/species/species-selector";

// Bij een kaart met status "not_found" of "suggested"
{(card.speciesMatchStatus === "not_found" || card.speciesMatchStatus === "suggested") && (
  <div className="mt-2">
    <SpeciesSelector
      value={null}
      onChange={(speciesId, species) => {
        if (species) {
          setCards((prev) =>
            prev.map((c) =>
              c.id === card.id
                ? {
                    ...c,
                    speciesMatchStatus: "matched",
                    speciesMatch: {
                      speciesId: species.id,
                      scientificName: species.scientific_name,
                      dutchName: species.common_names?.nl || null,
                      gbifKey: species.gbif_key,
                      confidence: "manual",
                    },
                    speciesSuggestions: [],
                  }
                : c
            )
          );
        }
      }}
      placeholder="Zoek soort..."
    />
  </div>
)}
```

### 4. Settings in Import Flow

**In:** `src/components/deck/bulk-import-form.tsx`

```typescript
import { ImportSettingsPanel } from "./import-settings";
import { DEFAULT_IMPORT_SETTINGS, type ImportSettings } from "@/lib/import/types";

// State
const [importSettings, setImportSettings] = useState<ImportSettings>(DEFAULT_IMPORT_SETTINGS);

// Toon settings panel na bestandsselectie
{cards.length > 0 && progress.status === "idle" && (
  <ImportSettingsPanel
    settings={importSettings}
    onChange={setImportSettings}
  />
)}

// Bij handleImport, pas settings toe op kaarten
const getCardTexts = (card: ImportCardPreview, settings: ImportSettings) => {
  const species = card.speciesMatch;
  let displayName = card.dutchName;

  if (species) {
    switch (settings.nameLanguage) {
      case "nl":
        displayName = species.dutchName || card.dutchName;
        break;
      case "scientific":
        displayName = species.scientificName;
        break;
      case "en":
        displayName = species.englishName || species.dutchName || card.dutchName;
        break;
      case "nl_scientific":
        displayName = `${species.dutchName || card.dutchName}\n${species.scientificName}`;
        break;
    }
  }

  const frontText = settings.namePosition === "front" || settings.namePosition === "both"
    ? displayName
    : "";
  const backText = settings.namePosition === "back" || settings.namePosition === "both"
    ? displayName
    : "";

  return { frontText, backText };
};
```

### 5. Import Action Aanpassen

**In:** `src/lib/actions/import.ts`

Update de `addCardsToDeck` actie om de nieuwe velden te verwerken:

```typescript
interface ImportResult {
  position: number;
  frontText: string;
  backText: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  audioUrl: string | null;
  speciesId: string | null;
  // ... andere velden
}
```

---

## Acceptatiecriteria

### Settings Panel
- [ ] Settings panel verschijnt na bestandsselectie
- [ ] Photo position toggle werkt (voorkant/achterkant)
- [ ] Name language keuze werkt (NL/Latijn/Engels/Beide)
- [ ] Name position keuze werkt (voorkant/achterkant/beide)
- [ ] Settings worden toegepast bij import

### Handmatige Soort Zoeken
- [ ] "Zoek soort..." knop verschijnt bij niet-herkende kaarten
- [ ] Popover opent met zoekfunctie
- [ ] Zoeken werkt op Nederlandse en wetenschappelijke naam
- [ ] Resultaten tonen lokale en GBIF soorten
- [ ] Selectie koppelt soort aan kaart
- [ ] Gekoppelde soort wordt correct weergegeven

### Integratie
- [ ] Settings + soort zoeken werken samen
- [ ] Gekozen naam taal wordt correct toegepast
- [ ] Kaarten worden correct aangemaakt met alle instellingen

---

## Implementatie Volgorde

1. **Types toevoegen** aan `types.ts`
2. **ImportSettingsPanel** component maken
3. **Settings state** toevoegen aan bulk-import-form
4. **SpeciesSelector** inline toevoegen per kaart
5. **Import logica** aanpassen voor settings
6. **addCardsToDeck** action updaten
7. **Testen** met verschillende combinaties

---

## Gerelateerde Bestanden

| Bestand | Relevantie |
|---------|------------|
| `src/components/deck/bulk-import-form.tsx` | Hoofd import component |
| `src/components/species/species-selector.tsx` | Bestaande soort zoek component |
| `src/lib/import/types.ts` | Import types |
| `src/lib/actions/import.ts` | Server action voor kaarten toevoegen |
| `src/lib/actions/species.ts` | Species zoek actions |
