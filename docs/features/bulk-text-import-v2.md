# Bulk Text Import v2 - Species Matching

## Overzicht

Uitbreiding van de tekst import met automatische species koppeling, vergelijkbaar met de media import flow.

**Status:** ✅ Geïmplementeerd

---

## Huidige Situatie (v1)

- Tekst plakken met tab/komma/puntkomma als separator
- Parsed naar `front_text` / `back_text`
- Geen species koppeling
- Tab-toets verplaatst focus (kan niet als separator getypt worden)

---

## Nieuwe Flow (v2)

### Stap 1: Tekst Invoeren

```
House Sparrow → Passer domesticus
Eurasian Tree Sparrow → Passer montanus
Spotted Dove → Spilopelia chinensis
```

**Ondersteunde separators:**
- Tab (`\t`) - Excel copy/paste
- Puntkomma (`;`) - Europese CSV
- Komma (`,`) - Internationale CSV
- Em dash (` – `) - Wikipedia-stijl lijsten
- Streepje met spaties (` - `) - Algemene lijsten

**Tab-fix:** Tab-toets in textarea voegt `\t` in ipv focus verplaatsen.

### Stap 2: Kolom Detectie

Parser herkent automatisch:

| Input | Kolom 1 (front) | Kolom 2 (back) |
|-------|-----------------|----------------|
| `Koolmees\tParus major` | Koolmees | Parus major |
| `House Sparrow – Passer domesticus` | House Sparrow | Passer domesticus |

**Wissel kolommen** knop beschikbaar als volgorde niet klopt.

### Stap 3: Species Matching

Na klikken op **"Soorten zoeken"**:

1. **Scientific name match** (kolom 2)
   - `matchSpeciesByName("Passer domesticus")` → exacte match

2. **Common name fallback** (kolom 1)
   - `searchSpecies("House Sparrow")` → zoekt NL, EN, wetenschappelijk

3. **Resultaat per rij:**
   - ✅ Gekoppeld (exacte match)
   - ⚠️ Suggesties (kies uit opties)
   - ❌ Niet gevonden

### Stap 4: Preview & Bevestigen

| Status | Common Name | Scientific Name | Species Match |
|--------|-------------|-----------------|---------------|
| ✅ | House Sparrow | Passer domesticus | Huismus |
| ⚠️ | Spotted Dove | Spilopelia chinensis | [Kies...] |
| ❌ | Unknown Bird | - | Niet gevonden |

### Stap 5: Import

Kaarten worden aangemaakt met:
- `back_text`: Common name (of scientific name)
- `species_id`: Gekoppelde soort (indien gevonden)
- `front_text`: Leeg (of optioneel scientific name)

---

## Uitbreiding: Engelse Namen Support

### Huidige Species Search

De `searchSpecies()` functie zoekt in:
- Nederlandse namen (`common_names.nl`)
- Wetenschappelijke namen (`scientific_name`, `canonical_name`)
- Lokale species database

### Uitbreiding

Toevoegen van Engels:
- `common_names.en` in species data (GBIF vernacular names)
- Fallback naar GBIF API voor Engelse namen

**Implementatie:**
1. GBIF vernacular names API: `https://api.gbif.org/v1/species/{key}/vernacularNames`
2. Filter op `language: "eng"`
3. Cache in `common_names.en` veld

---

## Technische Implementatie

### Bestanden te wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/import/parse-text-list.ts` | + em dash, streepje support |
| `src/components/deck/bulk-text-import-dialog.tsx` | + Tab key handler, + species matching UI |
| `src/lib/actions/species.ts` | + English name search |
| `src/lib/services/gbif.ts` | + vernacular names fetch |

### Nieuwe Types

```typescript
interface TextImportRow {
  id: string;
  column1: string;  // Common name
  column2: string;  // Scientific name
  speciesMatchStatus: SpeciesMatchStatus;
  speciesMatch: SpeciesMatch | null;
  speciesSuggestions: SpeciesMatch[];
}
```

---

## Quick Fixes (Fase 1) ✅

Kleine verbeteringen - **geïmplementeerd**:

### 1. Tab-toets in Textarea

```typescript
onKeyDown={(e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;
    const value = e.currentTarget.value;
    setText(value.substring(0, start) + "\t" + value.substring(end));
    // Cursor na de tab zetten
    setTimeout(() => {
      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 1;
    }, 0);
  }
}}
```

### 2. Em Dash / Streepje Separator

```typescript
// In detectSeparator()
if (firstLine.includes(" – ")) {  // Em dash
  return " – ";
}
if (firstLine.includes(" - ")) {  // Hyphen with spaces
  return " - ";
}
```

---

## Fase 2: Species Matching ✅

Volledige implementatie vergelijkbaar met `bulk-import-form.tsx` - **geïmplementeerd**:

1. ✅ "Soorten zoeken" knop toegevoegd
2. ✅ `handleMatchSpecies()` functie
3. ✅ Preview met status icons (✅ ⚠️ ❌)
4. ✅ Suggestie selectie UI met dropdown

---

## Fase 3: Engelse Namen ✅

**Geïmplementeerd**:

1. ✅ `searchSpecies()` zoekt nu ook in `common_names.en`
2. ✅ `getOrCreateSpecies()` slaat Engelse namen op in `common_names.en`
3. ✅ `selectBestEnglishName()` helper met prioriteit: IOC > eBird > ITIS > eerste beschikbare

---

## Test Cases

### Parser Tests

```
Input: "House Sparrow – Passer domesticus"
Expected: { front: "House Sparrow", back: "Passer domesticus" }

Input: "Koolmees\tParus major"
Expected: { front: "Koolmees", back: "Parus major" }

Input: "Spotted Dove - Spilopelia chinensis"
Expected: { front: "Spotted Dove", back: "Spilopelia chinensis" }
```

### Species Matching Tests

```
Scientific: "Passer domesticus" → exact match → Huismus
Dutch: "Koolmees" → exact match → Parus major
English: "House Sparrow" → GBIF search → Passer domesticus
```

---

## Prioriteit

1. ✅ **Quick fixes** (Tab, em dash) - Klaar
2. ✅ **Species matching** - Klaar
3. ✅ **Engelse namen** - Klaar
