# Annotatie Tool Verbeteringen

## Overzicht

Dit document beschrijft de geplande verbeteringen aan de annotatie tool op basis van tester feedback (Rosanne).

---

## Status Overzicht

| Feature | Status | Beschrijving |
|---------|--------|--------------|
| Hard refresh bug (#11) | Voltooid | Annotaties vereisen geen hard refresh meer |
| Save feedback (#9) | Voltooid | Toast melding na opslaan |
| Delete refresh bug | Voltooid | Verwijderen annotaties werkt zonder refresh |
| Default stroke width | Voltooid | Verhoogd van 2px naar 10px |
| Stroke width slider | Voltooid | Slider 1-20, default 10 |
| Geannoteerd label bug | Voltooid | Label verdwijnt bij 0 annotaties |
| Pijl proportioneel | Voltooid | Pijlpunt schaalt met lijndikte |
| Color picker | Voltooid | Native color picker + 7 presets |
| Edit bestaande annotaties | Voltooid | Kleur/dikte wijzigen na aanmaken |
| Layers panel | Voltooid | Z-index beheer met up/down knoppen |
| Flashcard popup (#10) | Te doen | Annotaties bekijken op flashcard |

---

## Voltooide Features

### 1. Hard Refresh Bug Fix

**Probleem:** Na opslaan van annotaties moest de gebruiker hard refreshen om de nieuwe afbeelding te zien.

**Oplossing:**
- `router.refresh()` toegevoegd na navigatie in [annotation-page-client.tsx](../../src/app/(main)/annotate/[mediaId]/annotation-page-client.tsx)
- Cache-busting query parameter (`?v=${timestamp}`) toegevoegd aan `annotated_url`
- `revalidatePath()` voor relevante routes

**Bestanden gewijzigd:**
- `src/app/(main)/annotate/[mediaId]/annotation-page-client.tsx`
- `src/lib/actions/annotations.ts`

### 2. Toast Feedback na Opslaan

**Probleem:** Geen visuele feedback na opslaan.

**Oplossing:** Sonner toast meldingen toegevoegd.

```typescript
toast.success("Annotaties opgeslagen");
toast.error(`Opslaan mislukt: ${result.error}`);
```

### 3. Delete Refresh Bug Fix

**Probleem:** Na verwijderen van annotaties was ook hard refresh nodig.

**Oplossing:**
- `revalidatePath()` toegevoegd aan `removeAnnotations()` server action
- Cache-busting zorgt dat nieuwe afbeelding wordt geladen na save

### 4. Default Stroke Width

**Probleem:** Standaard lijndikte (2px) was te dun.

**Oplossing:** Default verhoogd naar 3px in `AnnotationCanvas.tsx`.

### 5. Stroke Width Slider

**Probleem:** Discrete knoppen (1, 2, 3, 4, 6) waren niet intuïtief.

**Oplossing:** Range slider met:
- Bereik: 1-20
- Stappen: 1
- Default: 10 (midden van slider)
- Huidige waarde weergave

```tsx
<input
  type="range"
  min={1}
  max={20}
  step={1}
  value={selectedStrokeWidth}
  onChange={(e) => setSelectedStrokeWidth(Number(e.target.value))}
/>
```

### 6. Geannoteerd Label Bug Fix

**Probleem:** "Geannoteerd" badge bleef zichtbaar nadat alle annotaties waren verwijderd.

**Oorzaak:** `saveAnnotations()` maakte altijd een annotated image aan, zelfs bij 0 annotaties.

**Oplossing:** Check toegevoegd aan begin van `saveAnnotations()`:
- Als `annotations.length === 0`:
  - Verwijder bestaande annotated image uit storage
  - Zet `annotated_url` naar `null`
  - Zet `annotations` naar `null`

**Bestand gewijzigd:** `src/lib/actions/annotations.ts`

### 7. Pijl Proportioneel Fix

**Probleem:** Bij dikke lijnen (bijv. 20px) zag de pijlpunt er disproportioneel uit - de lijn liep door tot de tip en de pijlpunt was te smal.

**Oplossing:** Pijl hertekend met:
- Lijn stopt bij de BASIS van de pijlpunt (niet bij de tip)
- Pijlpunt lengte: `max(15, strokeWidth * 3)`
- Pijlpunt breedte: `max(10, strokeWidth * 2)`
- Pijlpunt als driehoek van basis naar tip

**Bestand gewijzigd:** `src/components/annotation/AnnotationCanvas.tsx`

### 8. Color Picker met Presets

**Probleem:** Alleen vaste kleuren beschikbaar, geen custom kleuren mogelijk.

**Oplossing:**
- 7 preset kleuren: wit, zwart, rood, oranje, geel, groen, blauw
- Native `<input type="color">` voor custom kleuren
- Rainbow gradient indicator voor custom color picker
- Ring highlight voor geselecteerde kleur

**Bestand gewijzigd:** `src/components/annotation/AnnotationCanvas.tsx`, `src/types/annotations.ts`

### 9. Edit Bestaande Annotaties

**Probleem:** Na plaatsen van annotatie kon styling niet meer aangepast worden.

**Oplossing:** Bidirectionele sync tussen toolbar en geselecteerde annotatie:
- Bij selectie: toolbar toont huidige kleur/dikte van annotatie
- Bij wijzigen toolbar: geselecteerde annotatie wordt bijgewerkt
- Auto-select na plaatsen voor "place-first" workflow

**State flow:**
```
Plaats annotatie   → Auto-select nieuwe annotatie
                   ↓
Toolbar toont      → Annotatie properties (kleur/dikte)
                   ↓
Wijzig in toolbar  → Update annotatie in annotations array
                   ↓
Canvas hertekent   → Visuele feedback
```

**Bestand gewijzigd:** `src/components/annotation/AnnotationCanvas.tsx`

### 10. Layers Panel (Z-index Control)

**Probleem:** Geen controle over welke annotatie boven welke getekend wordt.

**Oplossing:** Floating panel boven toolbar met:
- Lijst van alle annotaties (omgekeerde volgorde: bovenste laag eerst)
- Klik om annotatie te selecteren
- Up/down knoppen om render volgorde te wijzigen
- Type icoon, kleur indicator, en label per annotatie
- Toggle knop in toolbar met badge voor aantal annotaties

**UI:**
- Panel zweeft boven de toolbar (`position: absolute; bottom: 100%`)
- Scrollbaar bij veel annotaties (max-height: 48)
- Knop gedeactiveerd bij 0 annotaties

**Bestand gewijzigd:** `src/components/annotation/AnnotationCanvas.tsx`

---

## Voltooide Features (Vervolg)

### 12. Image Viewer in Deck Editor

**Probleem:** In de deck editor kon je media niet groter bekijken om details te zien.

**Oplossing:**
- Klik op afbeelding → opent fullscreen modal
- Zoom icoon verschijnt bij hover
- Werkt voor zowel bestaande als pending media

**Bestand gewijzigd:** `src/components/deck/card-side-editor.tsx`

---

## Te Implementeren Features

### Flashcard Layout Verbetering

**Gewenst:** Grotere kaarten en media in flashcard/study modus.

Zie [backlog.md](../backlog.md) voor details.

---

## Technische Details

### Bestanden

| Bestand | Rol |
|---------|-----|
| `src/components/annotation/AnnotationCanvas.tsx` | Hoofd editor component |
| `src/types/annotations.ts` | Type definities en constanten |
| `src/lib/actions/annotations.ts` | Server actions voor opslaan/laden |
| `src/app/(main)/annotate/[mediaId]/annotation-page-client.tsx` | Page wrapper |

### Annotatie Data Model

```typescript
interface Annotation {
  id: string;
  type: "arrow" | "circle" | "text";
  color: string;
  strokeWidth?: number;      // voor arrow/circle
  backgroundColor?: string;  // voor text
  // ... type-specifieke properties
}
```

### Render Volgorde

Annotaties worden getekend in array volgorde:
- Index 0 = eerste getekend = achtergrond
- Laatste index = laatst getekend = voorgrond

---

## Implementatie Volgorde

1. **Color picker** - Bouwt voort op bestaande kleur selectie
2. **Edit bestaande annotaties** - Nodig voor goede UX
3. **Layers panel** - Meest complex, laatst

---

### 11. Numerieke Input en Font Size Slider

**Probleem:** Annotaties waren te klein in flashcard-weergave (afbeelding 1200px geschaald naar ~300px).

**Oplossing:**
- **Hogere defaults:** strokeWidth 10→25, fontSize 16→32
- **Numerieke input:** Naast slider kan je exacte pixelwaarde typen (Photoshop-stijl)
- **Font size slider:** Nieuwe slider voor tekstgrootte (12-72px, default 32)
- **Grotere range:** Stroke slider 1-50, numerieke input tot 100

**UI:**
```
Dikte:  [====slider====] [__25__] px
Grootte: [====slider====] [__32__] px
```

**Bestand gewijzigd:** `src/components/annotation/AnnotationCanvas.tsx`

---

## Test Checklist

- [x] Stroke width slider werkt (1-50 met stappen van 1, default 25)
- [x] Numerieke input voor stroke width (max 100)
- [x] Font size slider werkt (12-72, default 32)
- [x] Numerieke input voor font size (max 100)
- [x] Color picker toont native picker
- [x] Custom kleur wordt correct toegepast
- [x] 7 preset kleuren (wit, zwart, rood, oranje, geel, groen, blauw)
- [x] Selecteren annotatie toont huidige properties in toolbar
- [x] Wijzigen kleur/dikte/grootte werkt op geselecteerde annotatie
- [x] Layers panel toont alle annotaties
- [x] Up/down knoppen wijzigen render volgorde
- [x] Layers panel zweeft boven toolbar
- [x] Image viewer in deck editor (klik om te vergroten)
