# Bulk Media Import Verbeteringen

> Verbeteringen aan de media import functionaliteit (4 februari 2026)

**Status:** ✅ Geïmplementeerd
**Gerelateerd:** [Bulk Text Import](bulk-text-import.md)

---

## Overzicht

Deze sessie bevatte meerdere verbeteringen aan de bulk media import:

1. **Robuustere bestandsnaam parsing**
2. **Stop-knoppen voor lange operaties**
3. **Storage limit enforcement**

---

## 1. Bestandsnaam Parsing Verbeteringen

De `parseImageFilename` functie is uitgebreid om meer formaten te herkennen.

### Ondersteunde Formaten

| Input | Output | Wat gebeurt er |
|-------|--------|----------------|
| `aeshna_cyanea.jpg` | `Aeshna cyanea` | Underscores → spaties, herkend als wetenschappelijke naam |
| `001_aeshna_cyanea.jpg` | `Aeshna cyanea` (pos: 1) | Leading nummer gestript |
| `aeshna-cyanea-male.jpg` | `Aeshna cyanea` | Hyphens → spaties, trailing "male" gestript |
| `aeshna_cyanea_1.jpg` | `Aeshna cyanea` | Trailing nummer gestript |
| `aeshna_cyanea_adult_2.jpg` | `Aeshna cyanea` | Meerdere suffixes gestript |
| `AeshnaCyanea.jpg` | `Aeshna cyanea` | CamelCase gesplitst |
| `aeshna cyanea.jpg` | `Aeshna cyanea` | Lowercase → proper capitalization |
| `Genus cf. species.jpg` | `Genus cf. species` | cf. notatie herkend |
| `Genus sp.jpg` | `Genus sp.` | sp. notatie herkend |

### Gestripte Metadata Suffixes

- **Life stages:** `adult`, `juvenile`, `larva`, `larve`, `imago`, `nimf`, `pop`, `pupa`, `ei`, `egg`
- **Sex:** `male`, `female`, `man`, `vrouw`, `m`, `f`
- **Variants:** `var`, `variant`, `form`, `forma`
- **Trailing nummers:** `_1`, `_2`, `-01`, etc.

### Technische Details

Bestand: `src/lib/import/parse-image-filename.ts`

Nieuwe helper functies:
- `looksLikeScientificName()` - Detecteert "Genus species" formaat
- `looksLikeLowercaseScientificName()` - Detecteert lowercase wetenschappelijke namen
- `toScientificNameFormat()` - Converteert naar correcte kapitalisatie
- `normalizeFilename()` - Underscores/hyphens → spaties
- `stripLeadingNumbers()` - Verwijdert "001_" prefix
- `stripTrailingMetadata()` - Verwijdert "_male", "_1" suffixes
- `splitCamelCase()` - Splitst "AeshnaCyanea" → "Aeshna Cyanea"

---

## 2. Stop-knoppen

### Species Matching Stop

Tijdens het koppelen van soorten verschijnt een rode "Stop" knop.

- Klikt gebruiker op Stop → loop stopt direct
- Reeds gekoppelde soorten blijven behouden
- Melding: "Gestopt na X van Y soorten"

### Upload Stop

Tijdens het uploaden verschijnt een rode "Stop uploaden" knop.

- Klikt gebruiker op Stop → geen nieuwe uploads starten
- Reeds ge-uploade bestanden blijven in storage
- Kaarten worden NIET aan deck toegevoegd (rollback)
- Melding: "Gestopt na X van Y bestanden"

### Technische Details

Bestand: `src/components/deck/bulk-import-form.tsx`

```typescript
const abortMatchingRef = useRef(false);
const abortUploadRef = useRef(false);

const stopMatchingSpecies = useCallback(() => {
  abortMatchingRef.current = true;
}, []);

const stopUpload = useCallback(() => {
  abortUploadRef.current = true;
}, []);
```

In de loops wordt gecheckt:
```typescript
if (abortMatchingRef.current) {
  setProgress({ message: `Gestopt na ${i} van ${cards.length}...` });
  break;
}
```

---

## 3. Storage Limit Enforcement

### Probleem

De bulk import checkte niet of uploads binnen de opslaglimiet pasten. Gebruikers konden meer uploaden dan hun limiet (50 MB gratis).

### Oplossing

1. **Pre-upload check**: Totale bestandsgrootte wordt berekend vóór upload start
2. **Server-side validatie**: `checkStorageLimit()` server action vergelijkt met beschikbare ruimte
3. **Duidelijke foutmelding**: "Opslaglimiet bereikt. Je hebt nog X MB vrij, maar dit bestand is Y MB."
4. **Post-upload tracking**: Na succesvolle upload wordt `recordStorageUpload()` aangeroepen

### Foutmelding Voorbeeld

```
Opslaglimiet bereikt. Je hebt nog 14.4 MB vrij, maar dit bestand is 68.9 MB.
```

### Technische Details

Bestanden:
- `src/lib/actions/decks.ts` - `checkStorageLimit()`, `recordStorageUpload()`
- `src/lib/services/storage-limits.ts` - `canUpload()`, `recordUpload()`
- `src/components/deck/bulk-import-form.tsx` - Integratie in upload flow

```typescript
// Pre-upload check
const totalSize = cards.reduce((sum, card) => {
  let size = 0;
  if (card.audioFile) size += card.audioFile.size;
  if (card.imageFile) size += card.imageFile.size;
  return sum + size;
}, 0);

const storageCheck = await checkStorageLimit(totalSize);
if (!storageCheck.allowed) {
  setError(storageCheck.error || "Opslaglimiet bereikt");
  return;
}

// Post-upload tracking
if (totalUploadedBytes > 0) {
  await recordStorageUpload(totalUploadedBytes);
}
```

---

## Nog Te Doen: Import Configuratie

De gebruiker wil meer controle over hoe bestanden worden geïmporteerd:

| Optie | Beschrijving | Status |
|-------|--------------|--------|
| Foto positie | Voorkant / Achterkant van kaart | 🔜 Gepland |
| Naam veld | Front text / Back text | 🔜 Gepland |
| Naam taal | Nederlands / Latijn / Engels / Beide | 🔜 Gepland |
| Naam weergave | Formaat van soortnaam op kaart | 🔜 Gepland |

Zie volgende sectie voor planning.

---

## Gerelateerde Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/lib/import/parse-image-filename.ts` | Robuustere parsing |
| `src/components/deck/bulk-import-form.tsx` | Stop-knoppen, storage check |
| `src/lib/services/storage-limits.ts` | Error handling, logging |
| `src/lib/actions/decks.ts` | `checkStorageLimit`, `recordStorageUpload` |
