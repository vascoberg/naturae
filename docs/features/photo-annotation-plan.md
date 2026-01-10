# Foto Annotatie Feature - Plan van Aanpak

> Feature voor het annoteren van foto's met labels, pijlen en vormen om soortkenmerken te markeren.

## Doel

Gebruikers de mogelijkheid geven om geüploade foto's te annoteren met visuele markers die specifieke kenmerken aanwijzen. Dit is essentieel voor effectief leren van soortherkenning - bijvoorbeeld "bruine vleugel", "witte oogstreep", "gele poten".

**Geïnspireerd door:** BirdID's annotated species photos

---

## Technische Keuze: Fabric.js

### Waarom Fabric.js?

| Criterium | Fabric.js | Konva.js |
|-----------|-----------|----------|
| Development snelheid | ✅ Sneller | Meer setup |
| Built-in text editing | ✅ Ja | Handmatig |
| JSON serialization | ✅ Native | Handmatig |
| Drag/resize controls | ✅ Out of the box | Meer configuratie |
| SVG export | ✅ Ja | Nee |
| React integratie | Good | react-konva |
| Bundle size | Groter | Kleiner |
| Next.js compatibiliteit | ✅ Goed (met config) | Goed |

**Conclusie:** Fabric.js is de betere keuze voor een annotatie-editor vanwege snellere development en built-in features.

### Fabric.js Key Features

**Object Types:**
- `fabric.Rect`, `fabric.Circle`, `fabric.Ellipse` - Vormen
- `fabric.Line`, `fabric.Polyline` - Lijnen
- `fabric.IText`, `fabric.Textbox` - Bewerkbare tekst
- `fabric.Triangle` - Voor pijlpunten
- `fabric.Group` - Combineren van objecten (bijv. lijn + pijlpunt)
- `fabric.Image` - Achtergrondafbeelding

**Built-in Capabilities:**
- Drag, resize, rotate met controls
- Selection en multi-select
- JSON serialize/deserialize
- Keyboard shortcuts
- Undo/redo (via history tracking)
- Export naar PNG/SVG

### Next.js Setup

```javascript
// next.config.js
const nextConfig = {
  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      "bufferutil": "commonjs bufferutil",
      "canvas": "commonjs canvas",
    });
    return config;
  },
};
```

```typescript
// Component initialization
"use client";

useEffect(() => {
  const canvas = new fabric.Canvas("canvas", {
    height: 600,
    width: 800,
  });

  return () => canvas.dispose(); // Cleanup voor React strict mode
}, []);
```

---

## Feature Scope

### MVP Annotatie Tools

| Tool | Beschrijving | Prioriteit |
|------|--------------|------------|
| **Tekst label** | Bewerkbare tekst op foto | P1 |
| **Pijl** | Lijn met pijlpunt naar kenmerk | P1 |
| **Cirkel/Ellips** | Gebied markeren | P2 |
| **Rechthoek** | Gebied highlighten | P2 |
| **Kleurkeuze** | Contrast op verschillende achtergronden | P1 |
| **Verwijderen** | Geselecteerde annotatie wissen | P1 |
| **Undo/Redo** | Foutjes corrigeren | P2 |

### Latere Uitbreidingen

- Freehand drawing (PencilBrush)
- Tekst met achtergrondkleur/badge
- Templates voor veelvoorkomende annotaties
- Kopiëren van annotaties naar andere kaarten

---

## User Flow

### 1. Toegang tot Annotatie Editor

```
Kaart bewerken → Klik op afbeelding → "Annoteer" knop → Editor opent
```

**Alternatief:** Modal/overlay met de editor

### 2. Annotatie Workflow

```
┌─────────────────────────────────────────────────────────┐
│  [← Terug]              Foto annoteren        [Opslaan] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │                                                   │  │
│  │              [Foto met annotaties]                │  │
│  │                                                   │  │
│  │     "Bruine vleugel" ←───────○                    │  │
│  │                                                   │  │
│  │                     ○───────→ "Witte oogstreep"   │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ [T] Tekst  [→] Pijl  [○] Cirkel  [□] Rechthoek │    │
│  │ [🎨] Kleur: ● ● ● ●   [↩] Undo  [↪] Redo      │    │
│  │ [🗑️] Verwijderen                                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Per Tool

**Tekst toevoegen:**
1. Klik "Tekst" tool
2. Klik op foto waar label moet komen
3. Typ tekst (inline editing)
4. Drag om te positioneren
5. Resize via controls

**Pijl toevoegen:**
1. Klik "Pijl" tool
2. Klik en drag van startpunt naar eindpunt
3. Pijlpunt wijst naar waar je eindigt
4. Adjust via drag handles

**Vorm toevoegen:**
1. Klik "Cirkel" of "Rechthoek"
2. Klik en drag om grootte te bepalen
3. Adjust via controls

### 4. Opslaan

```
[Opslaan] → Annotaties als JSON opslaan → Overlay renderen bij weergave
```

---

## Data Architectuur

### Opslag Strategie: Hybrid Approach

We gebruiken een **hybrid approach** die het beste van beide werelden combineert:

| Aspect | Implementatie |
|--------|---------------|
| **Weergave** | Pre-rendered PNG (snelle weergave, geen runtime rendering) |
| **Bewerking** | JSON + originele foto (volledig bewerkbaar) |
| **Storage** | Origineel + annotated PNG + JSON metadata |

### Hoe het werkt

```
┌─────────────────────────────────────────────────────────────────┐
│                        OPSLAAN                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Gebruiker klikt "Opslaan"]                                    │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                            │
│  │ Fabric.js Canvas │                                           │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ├──────────────────┬──────────────────┐               │
│           ▼                  ▼                  ▼               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ canvas.toJSON() │ │ canvas.toDataURL│ │ Originele foto  │   │
│  │                 │ │ () → PNG        │ │ (ongewijzigd)   │   │
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘   │
│           │                   │                   │             │
│           ▼                   ▼                   ▼             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DATABASE                              │   │
│  │  card_media:                                             │   │
│  │  ├─ url: "storage/.../original.jpg"      ← voor editing  │   │
│  │  ├─ annotated_url: "storage/.../annotated.png" ← display │   │
│  │  └─ annotations: { JSON data }           ← voor editing  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       WEERGAVE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Study Sessie / Kaart Preview:                                  │
│  ┌─────────────────────────────────────────┐                    │
│  │ if (annotated_url) {                    │                    │
│  │   <img src={annotated_url} />  ← Snel!  │                    │
│  │ } else {                                │                    │
│  │   <img src={url} />            ← Geen annotaties             │
│  │ }                                       │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  → Geen runtime rendering nodig                                 │
│  → Gewoon een normale afbeelding laden                          │
│  → Werkt ook in native apps (iOS/Android)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       BEWERKEN                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Annotatie Editor openen:                                       │
│  ┌─────────────────────────────────────────┐                    │
│  │ 1. Laad originele foto (url)            │                    │
│  │ 2. Laad annotations JSON                │                    │
│  │ 3. canvas.loadFromJSON(annotations)     │                    │
│  │ 4. Gebruiker bewerkt                    │                    │
│  │ 5. Opslaan → nieuwe PNG + updated JSON  │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Voordelen Hybrid Approach

| Voordeel | Uitleg |
|----------|--------|
| **Snelle weergave** | Gewoon een PNG laden, geen canvas rendering |
| **Volledig bewerkbaar** | JSON + origineel altijd beschikbaar |
| **Native app compatible** | PNG werkt overal, geen Fabric.js nodig voor view |
| **Fallback** | Als annotated_url ontbreekt, toon origineel |
| **SEO/Social** | Pre-rendered images werken voor og:image etc. |

### Storage Overhead

```
Per geannoteerde afbeelding:
├─ Origineel:    ~200KB (JPEG, al aanwezig)
├─ Annotated:    ~250KB (PNG met transparantie overhead)
└─ JSON:         ~2KB   (annotatie objecten)
                 ──────
Total extra:     ~252KB per geannoteerde foto

Bij 1000 geannoteerde foto's: ~250MB extra storage
→ Acceptabel voor Supabase (1GB gratis tier)
```

### Database Schema

```sql
-- Uitbreiding op card_media tabel
ALTER TABLE card_media
ADD COLUMN annotated_url TEXT,           -- Pre-rendered PNG URL
ADD COLUMN annotations JSONB;            -- Fabric.js JSON voor editing

-- Index voor snelle queries
CREATE INDEX idx_card_media_has_annotations
ON card_media ((annotations IS NOT NULL));
```

### Annotatie JSON Structuur (Fabric.js native format)

```json
{
  "version": "6.0.0",
  "objects": [
    {
      "type": "Textbox",
      "text": "Bruine vleugel",
      "left": 150,
      "top": 200,
      "width": 120,
      "fontSize": 16,
      "fill": "#ffffff",
      "backgroundColor": "rgba(0,0,0,0.7)",
      "fontFamily": "Inter",
      "textAlign": "center"
    },
    {
      "type": "Line",
      "x1": 200,
      "y1": 210,
      "x2": 350,
      "y2": 280,
      "stroke": "#ef4444",
      "strokeWidth": 2
    },
    {
      "type": "Triangle",
      "left": 345,
      "top": 275,
      "width": 12,
      "height": 12,
      "fill": "#ef4444",
      "angle": 45
    },
    {
      "type": "Ellipse",
      "left": 400,
      "top": 150,
      "rx": 50,
      "ry": 30,
      "stroke": "#22c55e",
      "strokeWidth": 2,
      "fill": "transparent"
    }
  ],
  "background": "",
  "meta": {
    "naturae_version": "1.0",
    "original_dimensions": {
      "width": 800,
      "height": 600
    }
  }
}
```

### Server Actions

```typescript
// lib/actions/annotations.ts

export async function saveAnnotations(
  cardMediaId: string,
  annotations: FabricJSON,
  annotatedImageBlob: Blob
): Promise<{ success: boolean; annotatedUrl?: string }> {

  // 1. Upload pre-rendered PNG
  const fileName = `${cardMediaId}-annotated.png`;
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('card-media')
    .upload(fileName, annotatedImageBlob, {
      contentType: 'image/png',
      upsert: true  // Overschrijf bestaande
    });

  if (uploadError) throw uploadError;

  // 2. Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('card-media')
    .getPublicUrl(fileName);

  // 3. Update database
  const { error: updateError } = await supabase
    .from('card_media')
    .update({
      annotated_url: publicUrl,
      annotations: annotations,
      updated_at: new Date().toISOString()
    })
    .eq('id', cardMediaId);

  if (updateError) throw updateError;

  return { success: true, annotatedUrl: publicUrl };
}

export async function getAnnotations(
  cardMediaId: string
): Promise<{ url: string; annotations: FabricJSON | null }> {

  const { data, error } = await supabase
    .from('card_media')
    .select('url, annotations')
    .eq('id', cardMediaId)
    .single();

  if (error) throw error;

  return {
    url: data.url,
    annotations: data.annotations
  };
}

export async function removeAnnotations(
  cardMediaId: string
): Promise<void> {

  // 1. Get current annotated_url to delete from storage
  const { data } = await supabase
    .from('card_media')
    .select('annotated_url')
    .eq('id', cardMediaId)
    .single();

  // 2. Delete from storage if exists
  if (data?.annotated_url) {
    const fileName = data.annotated_url.split('/').pop();
    await supabase.storage
      .from('card-media')
      .remove([fileName]);
  }

  // 3. Clear database fields
  await supabase
    .from('card_media')
    .update({
      annotated_url: null,
      annotations: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', cardMediaId);
}
```

---

## Component Architectuur

### File Structure

```
src/components/annotation/
├── AnnotationEditor.tsx       # Hoofd editor component
├── AnnotationCanvas.tsx       # Fabric.js canvas wrapper
├── AnnotationToolbar.tsx      # Tool selectie en controls
├── AnnotationViewer.tsx       # Read-only weergave van annotaties
├── tools/
│   ├── TextTool.ts           # Tekst label logica
│   ├── ArrowTool.ts          # Pijl tekenen logica
│   ├── ShapeTool.ts          # Cirkel/rechthoek logica
│   └── SelectTool.ts         # Selectie en manipulatie
├── hooks/
│   ├── useFabricCanvas.ts    # Canvas lifecycle
│   ├── useAnnotationHistory.ts # Undo/redo
│   └── useAnnotationTools.ts # Tool state management
└── types.ts                   # TypeScript types
```

### Key Components

**AnnotationEditor.tsx**
```tsx
interface AnnotationEditorProps {
  imageUrl: string;
  initialAnnotations?: AnnotationData;
  onSave: (annotations: AnnotationData) => void;
  onCancel: () => void;
}
```

**AnnotationViewer.tsx**
```tsx
interface AnnotationViewerProps {
  imageUrl: string;
  annotations: AnnotationData;
  className?: string;
}
```

---

## UI/UX Design

### Design Principes

1. **Non-destructive editing** - Originele foto blijft intact
2. **Direct manipulation** - WYSIWYG, geen abstracte controls
3. **Mobile-friendly** - Touch support voor drag/pinch
4. **Keyboard shortcuts** - Power users (Del, Ctrl+Z, etc.)
5. **Contrast options** - Kleuren die werken op alle achtergronden

### Kleurenpalet

```
Standaard kleuren voor annotaties:
- Wit (#FFFFFF) - Donkere achtergronden
- Zwart (#000000) - Lichte achtergronden
- Rood (#EF4444) - Opvallend
- Geel (#FBBF24) - Waarschuwing/aandacht
- Groen (#22C55E) - Positief/herkenbaar
- Blauw (#3B82F6) - Neutraal
```

### Responsive Behavior

**Desktop:** Full editor met alle tools
**Tablet:** Editor in landscape, gestackte tools
**Mobile:**
- Simplified toolbar (meest gebruikte tools)
- Pinch to zoom
- Long press voor context menu

---

## Integratie in Bestaande App

### Waar komt het?

1. **Kaart Editor** (`/decks/[id]/edit`)
   - Bij afbeelding upload/bewerken
   - "Annoteer" knop naast media preview

2. **Bulk Import** (optioneel later)
   - Na import, annoteer geëxtraheerde afbeeldingen

### Weergave Locaties

- **Study sessie** - Annotaties zichtbaar op kaart voorkant
- **Kaart preview** - In deck editor
- **Export** - JSON bevat annotatie data

---

## Implementatie Fases

### Fase 1: Basis Setup + Hybrid Storage

**Taken:**
- [ ] Fabric.js installeren (`npm install fabric`)
- [ ] Next.js webpack config aanpassen (canvas externals)
- [ ] Database migratie: `annotated_url` en `annotations` kolommen
- [ ] Basis `useFabricCanvas` hook met cleanup
- [ ] Image loading op canvas als achtergrond
- [ ] Tekst tool implementeren (IText/Textbox)
- [ ] `saveAnnotations` server action (JSON + PNG upload)
- [ ] Integratie in CardSideEditor ("Annoteer" knop)

**Deliverable:** Tekst labels toevoegen, opslaan als PNG + JSON, tonen in study sessie

### Fase 2: Pijlen en Vormen

**Taken:**
- [ ] Arrow tool (Line + Triangle group)
- [ ] Cirkel/ellips tool
- [ ] Rechthoek tool
- [ ] Kleurkeuze UI (6 preset kleuren)
- [ ] Delete geselecteerde (Delete key + knop)
- [ ] Select tool (default mode)

**Deliverable:** Volledige annotatie toolkit

### Fase 3: Polish en UX

**Taken:**
- [ ] Undo/redo stack implementeren
- [ ] Keyboard shortcuts (Del, Ctrl+Z, Ctrl+Y, Escape)
- [ ] Touch/mobile: pinch zoom, drag
- [ ] Responsive toolbar (collapsed op mobile)
- [ ] Loading states tijdens opslaan
- [ ] "Annotaties verwijderen" functie

**Deliverable:** Production-ready editor

### Fase 4: Integratie en Edge Cases

**Taken:**
- [ ] Weergave in study sessie (gebruik `annotated_url` indien aanwezig)
- [ ] Weergave in kaart preview (deck editor)
- [ ] Export: annotated images meenemen in JSON export
- [ ] Fallback: toon origineel als canvas niet ondersteund wordt
- [ ] Aspect ratio handling (verschillende foto formaten)
- [ ] Performance: lazy load Fabric.js via dynamic import

**Deliverable:** Volledig geïntegreerde annotatie feature

---

## Technische Overwegingen

### Performance

- Lazy load Fabric.js (dynamic import)
- Canvas disposal bij unmount
- Debounce autosave
- Compress annotation JSON

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Canvas API vereist
- Fallback: toon originele afbeelding zonder annotaties

### Accessibility

- Keyboard navigatie voor tools
- Screen reader labels voor toolbar
- High contrast mode
- Alt text voor geannoteerde afbeeldingen

---

## Risico's en Mitigatie

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Fabric.js bundle size | Medium | Dynamic import, tree shaking |
| Mobile touch complexiteit | Hoog | Gefaseerde uitrol, eerst desktop |
| Canvas rendering issues | Medium | Fallback naar originele afbeelding |
| Data migratie | Laag | Versioning in JSON schema |

---

## Success Metrics

- Adoptie: % kaarten met annotaties
- Engagement: Tijd in annotatie editor
- Learning: Verschil in retention annotated vs non-annotated cards
- UX: Error rate, abandonment rate

---

## Bronnen

- [Fabric.js Documentation](https://fabricjs.com/docs/)
- [Fabric.js in Next.js Setup](https://dev.to/ziqin/step-by-step-on-how-to-setup-fabricjs-in-the-nextjs-app-3hi3)
- [Build Image Editor with Fabric.js v6](https://blog.logrocket.com/build-image-editor-fabric-js-v6/)
- [Konva.js vs Fabric.js Comparison](https://dev.to/lico/react-comparison-of-js-canvas-libraries-konvajs-vs-fabricjs-1dan)

---

## Implementatie Poging #1 - Lessons Learned

**Datum:** januari 2025
**Status:** Gestopt - feature verwijderd

### Wat is gebouwd

1. **Components:**
   - `useFabricCanvas.ts` - Hook voor Fabric.js canvas lifecycle met dynamic import
   - `AnnotationEditor.tsx` - Hoofd editor component met tools voor text, arrow, circle, rectangle
   - `AnnotationToolbar.tsx` - Toolbar met tool buttons en color picker
   - `index.ts` - Exports

2. **Server Actions:**
   - `saveAnnotations()` - Opslaan van JSON + PNG naar Supabase storage
   - `getAnnotations()` - Ophalen van annotaties voor bewerking
   - `removeAnnotations()` - Verwijderen van annotaties

3. **Types:**
   - `AnnotationData`, `AnnotationTool`, `AnnotationColor` interfaces

4. **Configuratie:**
   - Next.js webpack config voor canvas externals
   - Turbopack configuratie
   - Database migratie SQL voorbereid (niet uitgevoerd)

5. **Integratie:**
   - "Annoteer" knop in CardSideEditor
   - Dialog modal voor de editor
   - Hybrid storage approach (JSON + PNG)

### Problemen die niet opgelost werden

1. **Canvas sizing:**
   - Canvas paste zich niet correct aan naar de afbeelding dimensies
   - Afbeelding bleef klein terwijl canvas veel groter was
   - Dynamische berekening op basis van viewport werkte niet

2. **Tekst editing (IText):**
   - Kon geen tekst typen in IText elementen
   - `enterEditing()` werkte niet correct
   - Probeerden: `activeOn: "up"`, setTimeout delays, CSS fixes voor hiddenTextarea
   - Bekende issue met modals: [GitHub #3695](https://github.com/fabricjs/fabric.js/issues/3695)

3. **Modal/Dialog conflict:**
   - Focus trap van Radix Dialog conflicteerde met Fabric.js hiddenTextarea
   - `onOpenAutoFocus={(e) => e.preventDefault()}` hielp niet genoeg
   - CSS `position: fixed !important` op hiddenTextarea hielp niet

### Geprobeerde oplossingen

| Probleem | Oplossing | Resultaat |
|----------|-----------|-----------|
| Canvas te groot | `maxWidth`/`maxHeight` dynamisch berekenen | Geen effect |
| Tekst niet bewerkbaar | `activeOn: "up"` property | Geen effect |
| Tekst niet bewerkbaar | setTimeout voor enterEditing() | Geen effect |
| Focus issues in modal | `onOpenAutoFocus` prevent | Geen effect |
| hiddenTextarea position | CSS `position: fixed !important` | Geen effect |
| Dubbele titel | DialogTitle + h2 verwijderen | Gefixt |
| Save button niet zichtbaar | Footer layout aanpassen | Gefixt |

### User feedback tijdens development

1. "Ik kan niet typen in de tekst optie"
2. "Ik zie geen optie om het op te slaan" → gefixt
3. "De foto laadt niet goed, die ziet er klein uit terwijl de modal groter is"
4. "Ik zie twee keer 'Foto annoteren' staan" → gefixt
5. "De modal scrollt heen en weer"
6. "Tekst kan ik nog steeds niet bewerken"
7. "Canvas is niet aangepast aan de afbeelding dimensies"

### Conclusie en aanbevelingen voor volgende poging

1. **Overweeg alternatieve library:**
   - Konva.js met react-konva zou beter kunnen werken met React
   - Of een dedicated annotation library zoals Annotorious

2. **Modal probleem oplossen eerst:**
   - Test Fabric.js buiten een modal eerst
   - Of gebruik een full-page editor in plaats van modal
   - Onderzoek of Sheet component beter werkt dan Dialog

3. **Canvas sizing:**
   - Laad afbeelding eerst in een Image element
   - Bereken dimensies voordat canvas wordt gecreëerd
   - Overweeg container-based sizing in plaats van viewport-based

4. **Tekst editing:**
   - Diepere dive in Fabric.js 6 documentatie voor IText
   - Test met Textbox in plaats van IText
   - Mogelijk custom hidden textarea handling nodig

5. **Incrementele aanpak:**
   - Begin met alleen shapes (geen tekst)
   - Voeg tekst later toe als aparte feature
   - Test elke stap grondig voordat je verder gaat

### Verwijderde bestanden

```
src/components/annotation/
├── AnnotationEditor.tsx
├── AnnotationToolbar.tsx
├── useFabricCanvas.ts
└── index.ts

src/lib/actions/annotations.ts
src/types/annotations.ts
```

### Code wijzigingen teruggedraaid

- `card-side-editor.tsx` - Annotatie imports, state, en Dialog verwijderd
- `deck-editor.tsx` - AnnotationData type verwijderd
- `page.tsx` (edit) - annotated_url en annotations uit query verwijderd
- `next.config.ts` - webpack/turbopack config verwijderd
- `globals.css` - hiddenTextarea CSS fix verwijderd
- `package.json` - fabric dependency verwijderd

---

*Document aangemaakt: januari 2025*
*Lessons learned toegevoegd: januari 2025*
