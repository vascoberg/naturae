# Bulk Tekst Import

> Feature voor het snel importeren van soortenlijsten via copy/paste.

**Status:** ✅ Geïmplementeerd (2 februari 2026)
**Prioriteit:** Hoog (Tester feedback: Rosanne)
**Gerelateerd:** [Tester Feedback](../testing/tester-feedback.md)

---

## Overzicht

Gebruikers willen snel een lijst met soorten importeren door te kopiëren en plakken vanuit Excel, Word, of andere bronnen. Dit is de "Quizlet-stijl" import die veel gebruikers kennen.

### Use Case

Rosanne heeft een Excel met oude boskernen indicatorsoorten:
```
Reuzenzwenkgras    Festuca gigantea
Fraai hertshooi    Hypericum pulchrum
Gele dovenetel     Lamium galeobdolon
```

Ze wil dit kopiëren vanuit Excel → plakken in Naturae → kaarten aanmaken.

---

## UI Design

### Locatie

Toevoegen aan bestaande deck editor (`/decks/[id]/edit`) via de "Bulk importeren" knop.

### Flow

```
[Bulk importeren] → Dialog opent →

┌─────────────────────────────────────────────────────┐
│  Kaarten importeren                             [X] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Plak je lijst hier (uit Excel, Word, etc.)         │
│  ┌─────────────────────────────────────────────┐   │
│  │ Reuzenzwenkgras    Festuca gigantea         │   │
│  │ Fraai hertshooi    Hypericum pulchrum       │   │
│  │ Gele dovenetel     Lamium galeobdolon       │   │
│  │                                              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ✓ 19 kaarten gevonden (tab-gescheiden)             │
│                                                     │
│  Preview:                                           │
│  ┌──────────────────┬─────────────────────┐        │
│  │ Voorkant         │ Achterkant          │        │
│  ├──────────────────┼─────────────────────┤        │
│  │ Reuzenzwenkgras  │ Festuca gigantea    │        │
│  │ Fraai hertshooi  │ Hypericum pulchrum  │        │
│  │ Gele dovenetel   │ Lamium galeobdolon  │        │
│  └──────────────────┴─────────────────────┘        │
│                                                     │
│  [⇄ Wissel kolommen]                                │
│                                                     │
│  [Annuleren]                  [19 kaarten toevoegen]│
└─────────────────────────────────────────────────────┘
```

### Gedrag

1. **Auto-detect separator**: Tab (meest voorkomend uit Excel), komma, puntkomma
2. **Preview**: Toon eerste 5 rijen in tabel
3. **Wissel kolommen**: Eén knop om voor/achter om te draaien
4. **Feedback**: "X kaarten gevonden" of foutmelding

---

## Technische Implementatie

### Nieuwe Bestanden

| Bestand | Doel |
|---------|------|
| `src/components/deck/bulk-text-import-dialog.tsx` | Dialog component met preview en import logica |
| `src/lib/import/parse-text-list.ts` | Tekst parsing: separator detectie, swapColumns helper |

### Aanpassingen Bestaande Bestanden

| Bestand | Wijziging |
|---------|-----------|
| `src/components/deck/deck-editor.tsx` | "Tekst importeren" knop naast bestaande "Media importeren" |

### Parse Logic

```typescript
type Separator = "\t" | "," | ";";

interface ParsedRow {
  front: string;
  back: string;
}

interface ParseResult {
  rows: ParsedRow[];
  detectedSeparator: Separator;
  errors: string[];
}

function parseTextList(text: string): ParseResult {
  const lines = text.trim().split("\n").filter(line => line.trim());

  // Auto-detect separator (check first non-empty line)
  const firstLine = lines[0] || "";
  let separator: Separator = "\t";

  if (firstLine.includes("\t")) {
    separator = "\t";
  } else if (firstLine.includes(";")) {
    separator = ";";
  } else if (firstLine.includes(",")) {
    separator = ",";
  }

  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(separator).map(p => p.trim());

    if (parts.length < 2) {
      // Alleen voorkant, geen achterkant
      if (parts[0]) {
        rows.push({ front: parts[0], back: "" });
      }
    } else {
      rows.push({ front: parts[0], back: parts[1] });
    }
  }

  return { rows, detectedSeparator: separator, errors };
}
```

### Kaarten Aanmaken

```typescript
// In deck-editor of via server action
async function createCardsFromImport(
  deckId: string,
  rows: ParsedRow[],
  startPosition: number
): Promise<void> {
  for (let i = 0; i < rows.length; i++) {
    await createCard({
      deckId,
      frontText: rows[i].front,
      backText: rows[i].back,
      position: startPosition + i,
    });
  }
}
```

---

## Acceptatiecriteria

- [x] Dialog opent via "Tekst importeren" knop in deck editor
- [x] Gebruiker kan tekst plakken in textarea
- [x] Auto-detect van separator (tab/komma/puntkomma)
- [x] Preview toont geparseerde kaarten in tabel (eerste 5)
- [x] "Wissel kolommen" knop wisselt voor/achter
- [x] Kaarten worden correct toegevoegd aan deck
- [x] Lege regels worden overgeslagen
- [x] Statusregel toont aantal gevonden kaarten
- [x] Dialog sluit na succesvolle import
- [x] Deck editor refresht met nieuwe kaarten

---

## Test Cases

1. **Tab-gescheiden** (Excel copy/paste):
   ```
   Koolmees	Parus major
   Pimpelmees	Cyanistes caeruleus
   ```

2. **Komma-gescheiden**:
   ```
   Koolmees,Parus major
   Pimpelmees,Cyanistes caeruleus
   ```

3. **Alleen voorkant** (geen separator):
   ```
   Koolmees
   Pimpelmees
   Roodborst
   ```

4. **Lege regels**: Moeten worden overgeslagen

5. **Speciale tekens**: `Épinette → Picea abies`

6. **Grote lijst**: 100+ rijen

---

## Niet in scope (MVP)

De volgende features zijn bewust niet meegenomen in deze MVP:

- **Excel/CSV file upload** - Complexe kolom mapping UI nodig
- **Automatische species matching** - Kan later toegevoegd worden
- **GBIF media ophalen** - User kan handmatig toevoegen na import

Zie [Premium Features](../premium-features.md) voor geavanceerde import opties.

---

## Gerelateerde Documenten

- [Tester Feedback](../testing/tester-feedback.md) - Rosannes feature request
- [Bestaande Media Import](/decks/import) - Voor audio/foto bestanden
- [Premium Features](../premium-features.md) - AI-powered import
