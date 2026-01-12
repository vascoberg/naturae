# Foto Annotatie Feature - Plan van Aanpak

> Feature voor het annoteren van foto's met labels, pijlen en vormen om soortkenmerken te markeren.

## Doel

Gebruikers de mogelijkheid geven om geüploade foto's te annoteren met visuele markers die specifieke kenmerken aanwijzen. Dit is essentieel voor effectief leren van soortherkenning - bijvoorbeeld "bruine vleugel", "witte oogstreep", "gele poten".

**Geïnspireerd door:** BirdID's annotated species photos

---

## Technische Keuze: Excalidraw (Poging #3)

> **Update januari 2026:** Na twee mislukte pogingen met Fabric.js en Konva.js kiezen we nu voor Excalidraw - een complete whiteboard library met bewezen UX.

### Waarom Excalidraw?

Na analyse van de problemen met Fabric.js en Konva.js is de conclusie dat **low-level canvas libraries** (waar je zelf de UX moet bouwen) te veel tijd kosten voor een goede gebruikerservaring. Excalidraw is een **complete applicatie** die je kunt embedden.

### Library Vergelijking (Updated)

| Criterium | Fabric.js | Konva.js | Excalidraw | Tldraw |
|-----------|-----------|----------|------------|--------|
| **Type** | Canvas library | Canvas library | ✅ Complete app | Complete app |
| **React integratie** | Wrapper nodig | Native | ✅ Native component | Native |
| **Bundle size** | ~300KB | ~150KB | ~500KB | ~400KB |
| **UX out of the box** | ❌ Zelf bouwen | ❌ Zelf bouwen | ✅ Volledig | ✅ Volledig |
| **Tekst editing** | Buggy | Buggy | ✅ Native, getest | ✅ Native |
| **Shapes** | Alle | Alle | ✅ Alle + hand-drawn style | Alle |
| **Selection/Transform** | Buggy | Buggy | ✅ Gepolijst | ✅ Gepolijst |
| **Touch/Mobile** | Beperkt | Beperkt | ✅ Volledig | ✅ Volledig |
| **Undo/Redo** | Zelf bouwen | Zelf bouwen | ✅ Ingebouwd | ✅ Ingebouwd |
| **Keyboard shortcuts** | Zelf bouwen | Zelf bouwen | ✅ Ingebouwd | ✅ Ingebouwd |
| **License** | MIT | Custom | ✅ MIT (geen watermark) | Watermark |
| **Gebruikt door** | - | - | ✅ Notion, Obsidian, Meta | VS Code |

### Excalidraw vs Tldraw

| Aspect | Excalidraw | Tldraw |
|--------|------------|--------|
| **License** | ✅ MIT, volledig gratis | Watermark in gratis versie |
| **Style** | ✅ Hand-drawn (past bij educatie) | Clean/professional |
| **Adoption** | ✅ Notion, Obsidian, Google, Meta | VS Code, kleinere userbase |
| **Bundle** | ~500KB | ~400KB |
| **Multiplayer** | Optioneel | Ingebouwd |

**Keuze: Excalidraw** vanwege:
1. Geen watermark (MIT license)
2. Hand-drawn style past goed bij educatieve content
3. Bewezen bij grote bedrijven (Notion, Obsidian, Meta)
4. Actieve community en maintenance

### Excalidraw Features

**Core:**
- Infinite canvas met zoom/pan
- Hand-drawn style (Rough.js)
- Shapes: rectangles, ellipses, arrows, lines, text, images, frames
- Arrow binding (pijlen verbinden automatisch met shapes)
- Undo/redo
- Dark mode
- Export: PNG, SVG, JSON
- Keyboard shortcuts

**React Component:**
```tsx
import dynamic from "next/dynamic";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false }
);

function AnnotationEditor({ imageUrl }: { imageUrl: string }) {
  return (
    <Excalidraw
      initialData={{
        elements: [],
        appState: { viewBackgroundColor: "transparent" }
      }}
      onChange={(elements, state) => {
        // Handle changes
      }}
    />
  );
}
```

**Bronnen:**
- [Excalidraw.com](https://excalidraw.com)
- [GitHub](https://github.com/excalidraw/excalidraw)
- [Developer Docs](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/integration)
- [npm package](https://www.npmjs.com/package/@excalidraw/excalidraw)

---

## Vorige Library Keuzes (Deprecated)

<details>
<summary>Konva.js (Poging #2 - Gefaald)</summary>

### Library Vergelijking (Oud)

| Criterium | Fabric.js | Konva.js | Annotorious |
|-----------|-----------|----------|-------------|
| **React integratie** | Wrapper nodig | ✅ Native (react-konva) | Plugin-based |
| **Bundle size** | ~300KB | ✅ ~150KB | ~50KB |
| **Tekst editing** | IText (buggy in modals) | HTML overlay (volledige controle) | Geen |
| **Shapes** | Alle | ✅ Alle | Beperkt (geen pijlen) |
| **JSON serialization** | Native | Handmatig | W3C Annotation |
| **Modal/focus issues** | ❌ Bekend probleem | ✅ Geen bekende issues | Onbekend |
| **Drag/resize** | Out of the box | Transformer component | Beperkt |
| **Performance** | Goed | ✅ Beter (layer-based) | Goed |

### Waarom Konva.js? (Oud)

1. **Native React componenten** - Declaratieve API past bij Next.js/React stack
2. **Geen modal/focus bugs** - Fabric.js IText werkte niet in Radix Dialog
3. **Tekst editing onder controle** - HTML input overlay, geen mysterieuze bugs
4. **Kleinere bundle** - ~150KB vs ~300KB voor Fabric.js
5. **Betere performance** - Layer-based rendering

### Waarom niet Annotorious?

- Mist pijlen en cirkels die essentieel zijn voor het aanwijzen van kenmerken
- Minder flexibel voor custom tools
- Purpose-built voor simpele annotaties, niet voor onze use case

</details>

<details>
<summary>Konva.js Key Features (Deprecated)</summary>

**React Components (react-konva):**
- `<Stage>` - Container voor de canvas
- `<Layer>` - Groepering van shapes (performance)
- `<Image>` - Achtergrondafbeelding
- `<Text>` - Tekst labels
- `<Arrow>` - Pijlen (native support!)
- `<Circle>`, `<Ellipse>`, `<Rect>` - Vormen
- `<Transformer>` - Resize/rotate controls

**Voordelen t.o.v. Fabric.js:**
- Declaratieve React syntax
- Geen webpack config nodig
- Geen canvas externals
- Arrow component out of the box
- Geen bekende focus/modal issues

### Next.js Setup

```bash
npm install konva react-konva
```

```tsx
// Geen speciale Next.js config nodig!
"use client";

import { Stage, Layer, Image, Text, Arrow, Circle, Transformer } from "react-konva";

function AnnotationCanvas({ imageUrl }: { imageUrl: string }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => setImage(img);
  }, [imageUrl]);

  return (
    <Stage width={800} height={600}>
      <Layer>
        {image && <Image image={image} />}
        <Text text="Witte oogstreep" x={100} y={200} />
        <Arrow points={[100, 220, 200, 300]} stroke="red" />
        <Circle x={200} y={300} radius={20} stroke="green" />
      </Layer>
    </Stage>
  );
}
```

### Tekst Editing Aanpak

In plaats van buggy built-in text editing, gebruiken we een HTML input overlay:

```tsx
const [editingText, setEditingText] = useState<{id: string, x: number, y: number} | null>(null);

// Bij dubbelklik op tekst:
<Text onDblClick={(e) => {
  const textNode = e.target;
  setEditingText({
    id: textNode.id(),
    x: textNode.absolutePosition().x,
    y: textNode.absolutePosition().y
  });
}} />

// HTML input overlay:
{editingText && (
  <input
    style={{
      position: 'absolute',
      left: editingText.x,
      top: editingText.y,
    }}
    autoFocus
    onBlur={() => setEditingText(null)}
  />
)}
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

### 2. Annotatie Workflow (Full-Page Editor)

> **Update januari 2026:** We gebruiken een full-page editor in plaats van een modal om focus/keyboard issues te vermijden.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [← Terug naar kaart]           Foto annoteren               [Opslaan]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │                                                                       │  │
│  │                      [Foto met annotaties]                            │  │
│  │                                                                       │  │
│  │         "Bruine vleugel" ←───────○                                    │  │
│  │                                                                       │  │
│  │                         ○───────→ "Witte oogstreep"                   │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ [T] Tekst  [→] Pijl  [○] Cirkel  [□] Rechthoek                      │    │
│  │ [🎨] Kleur: ● ● ● ●   [↩] Undo  [↪] Redo                           │    │
│  │ [🗑️] Verwijderen                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Waarom full-page in plaats van modal:**
- Geen focus trap issues met text editing
- Volledige schermruimte voor grote afbeeldingen
- Beter voor mobile/touch interactie
- Simpelere keyboard event handling

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
│  │ Konva.js Stage  │                                            │
│  └────────┬────────┘                                            │
│           │                                                     │
│           ├──────────────────┬──────────────────┐               │
│           ▼                  ▼                  ▼               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ serializeShapes │ │ stage.toDataURL │ │ Originele foto  │   │
│  │ () → JSON       │ │ () → PNG        │ │ (ongewijzigd)   │   │
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
│  Annotatie Editor openen (full-page):                           │
│  ┌─────────────────────────────────────────┐                    │
│  │ 1. Navigeer naar /annotate/[mediaId]    │                    │
│  │ 2. Laad originele foto (url)            │                    │
│  │ 3. Laad annotations JSON                │                    │
│  │ 4. Render shapes in Konva Stage         │                    │
│  │ 5. Gebruiker bewerkt                    │                    │
│  │ 6. Opslaan → nieuwe PNG + updated JSON  │                    │
│  │ 7. Redirect terug naar kaart editor     │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Voordelen Hybrid Approach

| Voordeel | Uitleg |
|----------|--------|
| **Snelle weergave** | Gewoon een PNG laden, geen canvas rendering |
| **Volledig bewerkbaar** | JSON + origineel altijd beschikbaar |
| **Native app compatible** | PNG werkt overal, geen Konva.js nodig voor view |
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
ADD COLUMN annotations JSONB;            -- Konva.js JSON voor editing

-- Index voor snelle queries
CREATE INDEX idx_card_media_has_annotations
ON card_media ((annotations IS NOT NULL));
```

### Annotatie JSON Structuur (Konva.js format)

> **Opmerking:** Konva.js heeft geen native JSON serialization zoals Fabric.js. We definiëren onze eigen structuur die past bij onze use case.

```json
{
  "version": "1.0",
  "library": "konva",
  "shapes": [
    {
      "id": "text-1",
      "type": "text",
      "x": 150,
      "y": 200,
      "text": "Bruine vleugel",
      "fontSize": 16,
      "fill": "#ffffff",
      "padding": 4,
      "backgroundColor": "rgba(0,0,0,0.7)"
    },
    {
      "id": "arrow-1",
      "type": "arrow",
      "points": [200, 210, 350, 280],
      "stroke": "#ef4444",
      "strokeWidth": 2,
      "pointerLength": 10,
      "pointerWidth": 10
    },
    {
      "id": "circle-1",
      "type": "circle",
      "x": 400,
      "y": 180,
      "radius": 40,
      "stroke": "#22c55e",
      "strokeWidth": 2,
      "fill": "transparent"
    },
    {
      "id": "rect-1",
      "type": "rect",
      "x": 100,
      "y": 300,
      "width": 80,
      "height": 50,
      "stroke": "#3b82f6",
      "strokeWidth": 2,
      "fill": "transparent"
    }
  ],
  "meta": {
    "naturae_version": "1.0",
    "original_dimensions": {
      "width": 800,
      "height": 600
    },
    "created_at": "2026-01-10T12:00:00Z",
    "updated_at": "2026-01-10T12:00:00Z"
  }
}
```

### Serialization Helpers

```typescript
// lib/annotation-utils.ts

import type { Shape } from "@/types/annotations";

export function serializeShapes(shapes: Shape[]): AnnotationData {
  return {
    version: "1.0",
    library: "konva",
    shapes: shapes.map(shape => ({
      id: shape.id,
      type: shape.type,
      ...shape.attrs
    })),
    meta: {
      naturae_version: "1.0",
      original_dimensions: { width: 0, height: 0 }, // Set during save
      updated_at: new Date().toISOString()
    }
  };
}

export function deserializeShapes(data: AnnotationData): Shape[] {
  return data.shapes.map(shape => ({
    id: shape.id,
    type: shape.type,
    attrs: { ...shape }
  }));
}
```

### Server Actions

```typescript
// lib/actions/annotations.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import type { AnnotationData } from "@/types/annotations";

export async function saveAnnotations(
  cardMediaId: string,
  annotations: AnnotationData,
  annotatedImageBlob: Blob
): Promise<{ success: boolean; annotatedUrl?: string }> {
  const supabase = await createClient();

  // 1. Upload pre-rendered PNG
  const fileName = `${cardMediaId}-annotated.png`;
  const { error: uploadError } = await supabase
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
): Promise<{ url: string; annotations: AnnotationData | null }> {
  const supabase = await createClient();

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
  const supabase = await createClient();

  // 1. Get current annotated_url to delete from storage
  const { data } = await supabase
    .from('card_media')
    .select('annotated_url')
    .eq('id', cardMediaId)
    .single();

  // 2. Delete from storage if exists
  if (data?.annotated_url) {
    const fileName = data.annotated_url.split('/').pop();
    if (fileName) {
      await supabase.storage
        .from('card-media')
        .remove([fileName]);
    }
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
src/
├── app/
│   └── (main)/
│       └── annotate/
│           └── [mediaId]/
│               └── page.tsx          # Full-page annotation editor route
├── components/
│   └── annotation/
│       ├── AnnotationEditor.tsx      # Hoofd editor component (Konva Stage)
│       ├── AnnotationToolbar.tsx     # Tool selectie en controls
│       ├── TextEditor.tsx            # HTML overlay voor text editing
│       ├── shapes/
│       │   ├── TextShape.tsx         # Konva Text component
│       │   ├── ArrowShape.tsx        # Konva Arrow component
│       │   ├── CircleShape.tsx       # Konva Circle component
│       │   └── RectShape.tsx         # Konva Rect component
│       ├── hooks/
│       │   ├── useKonvaCanvas.ts     # Stage lifecycle en image loading
│       │   ├── useAnnotationHistory.ts # Undo/redo stack
│       │   └── useAnnotationTools.ts # Tool state management
│       └── index.ts                  # Exports
├── lib/
│   └── annotation-utils.ts           # Serialize/deserialize helpers
└── types/
    └── annotations.ts                # TypeScript types
```

### Key Components

**AnnotationEditor.tsx (Full-page)**
```tsx
"use client";

import { Stage, Layer, Image, Transformer } from "react-konva";

interface AnnotationEditorProps {
  mediaId: string;
  imageUrl: string;
  initialAnnotations?: AnnotationData;
  deckId: string;  // For redirect after save
  cardId: string;
}

export function AnnotationEditor({
  mediaId,
  imageUrl,
  initialAnnotations,
  deckId,
  cardId
}: AnnotationEditorProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<AnnotationTool>("select");
  const stageRef = useRef<Konva.Stage>(null);

  // Load image
  const { image, dimensions } = useKonvaImage(imageUrl);

  // History for undo/redo
  const { canUndo, canRedo, undo, redo, pushState } = useAnnotationHistory(shapes);

  const handleSave = async () => {
    if (!stageRef.current) return;

    // Export PNG
    const dataUrl = stageRef.current.toDataURL();
    const blob = await dataURLToBlob(dataUrl);

    // Serialize shapes
    const annotationData = serializeShapes(shapes, dimensions);

    // Save to server
    await saveAnnotations(mediaId, annotationData, blob);

    // Redirect back
    router.push(`/decks/${deckId}/edit?card=${cardId}`);
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b p-4 flex justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Terug naar kaart
        </Button>
        <h1>Foto annoteren</h1>
        <Button onClick={handleSave}>Opslaan</Button>
      </header>

      <main className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="relative">
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={dimensions.height}
          >
            <Layer>
              {image && <Image image={image} />}
              {shapes.map(shape => renderShape(shape, selectedId))}
              {selectedId && <Transformer />}
            </Layer>
          </Stage>

          {/* Text editing overlay */}
          <TextEditor />
        </div>
      </main>

      <AnnotationToolbar
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onDelete={() => deleteShape(selectedId)}
      />
    </div>
  );
}
```

**TextEditor.tsx (HTML overlay)**
```tsx
interface TextEditorProps {
  position: { x: number; y: number } | null;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function TextEditor({ position, value, onChange, onBlur }: TextEditorProps) {
  if (!position) return null;

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      autoFocus
      className="absolute border-2 border-primary px-2 py-1 text-sm"
      style={{
        left: position.x,
        top: position.y,
        minWidth: 100
      }}
    />
  );
}
```

### Route Page

**app/(main)/annotate/[mediaId]/page.tsx**
```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { AnnotationEditor } from "@/components/annotation";

interface Props {
  params: { mediaId: string };
  searchParams: { deckId?: string; cardId?: string };
}

export default async function AnnotatePage({ params, searchParams }: Props) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load media
  const { data: media, error } = await supabase
    .from("card_media")
    .select("id, url, annotations, card:cards(id, deck_id, deck:decks(user_id))")
    .eq("id", params.mediaId)
    .single();

  if (error || !media) notFound();

  // Authorization: only owner can annotate
  if (media.card.deck.user_id !== user.id) {
    redirect("/dashboard");
  }

  return (
    <AnnotationEditor
      mediaId={media.id}
      imageUrl={media.url}
      initialAnnotations={media.annotations}
      deckId={searchParams.deckId || media.card.deck_id}
      cardId={searchParams.cardId || media.card.id}
    />
  );
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

</details>

---

## Implementatie Fases (Excalidraw)

> **Update januari 2026:** Nieuw implementatieplan gebaseerd op lessons learned van Fabric.js en Konva.js pogingen.

### Opslag Strategie: Hybrid Approach

We slaan zowel de **pre-rendered PNG** als de **JSON data** op:

```
┌─────────────────────────────────────────────────────────────────┐
│                        BIJ OPSLAAN                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Excalidraw Editor                                              │
│       │                                                         │
│       ├──► exportToBlob() ──► PNG ──► Supabase Storage          │
│       │                              (annotated_url)            │
│       │                                                         │
│       └──► getSceneElements() ──► JSON ──► Database             │
│                                          (annotations kolom)    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BIJ WEERGAVE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Study sessie / Thumbnails / Card preview:                      │
│  ┌─────────────────────────────────────────┐                    │
│  │ if (media.annotated_url) {              │                    │
│  │   <img src={media.annotated_url} />     │  ← Gewoon PNG!     │
│  │ } else {                                │                    │
│  │   <img src={media.url} />               │  ← Origineel       │
│  │ }                                       │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  → Geen Excalidraw/canvas rendering nodig                       │
│  → Snelle load, werkt overal (ook native apps)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BIJ BEWERKEN                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Annotatie editor openen:                                       │
│  ┌─────────────────────────────────────────┐                    │
│  │ 1. Laad originele foto (media.url)      │                    │
│  │ 2. Laad annotations JSON uit database   │                    │
│  │ 3. Render in Excalidraw                 │                    │
│  │ 4. Gebruiker bewerkt                    │                    │
│  │ 5. Opslaan → nieuwe PNG + updated JSON  │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Waarom deze aanpak:**
| Voordeel | Uitleg |
|----------|--------|
| **Snelle weergave** | Gewoon een PNG laden, geen canvas/Excalidraw rendering |
| **Thumbnails werken** | PNG kan direct als thumbnail gebruikt worden |
| **Study sessie snel** | Geen JavaScript nodig om annotaties te tonen |
| **Volledig bewerkbaar** | JSON + origineel altijd beschikbaar voor editing |
| **Native app compatible** | PNG werkt overal, geen Excalidraw nodig voor view |

### Lessons Learned Toegepast

| Les | Hoe toegepast in Excalidraw aanpak |
|-----|-----------------------------------|
| Tekst editing is complex | Excalidraw heeft gepolijste native text editing |
| Shape interactie moet goed voelen | Excalidraw is getest door miljoenen gebruikers |
| Full-page editor werkt beter dan modal | Behouden: full-page `/annotate/[mediaId]` route |
| Blob serialisatie werkt niet | Behouden: base64 string naar server action |
| RLS policies checken | Behouden: upload naar `{user_id}/{deck_id}/{card_id}/` pad |
| Database kolommen bestaan al | Hergebruik: `annotated_url` en `annotations` kolommen |
| **Pre-rendered PNG voor weergave** | PNG opslaan zodat geen runtime rendering nodig is |

### Fase 1: Excalidraw Integratie

**Taken:**
- [ ] Excalidraw installeren (`npm install @excalidraw/excalidraw`)
- [ ] Client wrapper component voor dynamic import (SSR: false)
- [ ] Route: `/annotate/[mediaId]/page.tsx` opnieuw aanmaken
- [ ] Afbeelding laden als achtergrond in Excalidraw canvas
- [ ] Basis save functionaliteit (hergebruik server action patroon)
- [ ] "Annoteer" knop terug in CardSideEditor

**Technische aanpak:**
```tsx
// annotation-page-client.tsx
"use client";
import dynamic from "next/dynamic";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false, loading: () => <Loader /> }
);

export function AnnotationPageClient({ imageUrl, initialElements }: Props) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);

  return (
    <Excalidraw
      ref={(api) => setExcalidrawAPI(api)}
      initialData={{
        elements: initialElements || [],
        appState: {
          viewBackgroundColor: "transparent",
          currentItemFontFamily: 1, // Virgil (hand-drawn)
        },
        files: {
          // Achtergrond afbeelding als locked image element
        }
      }}
    />
  );
}
```

**Deliverable:** Werkende Excalidraw editor met afbeelding als achtergrond

### Fase 2: Opslaan en Laden

**Taken:**
- [ ] Export Excalidraw elements naar JSON
- [ ] Export canvas naar PNG (met `exportToBlob`)
- [ ] Server action: save base64 PNG + JSON (hergebruik patroon)
- [ ] Laden van bestaande annotaties bij openen editor
- [ ] Redirect terug naar deck editor na opslaan

**Server action patroon (bewezen werkend):**
```typescript
export async function saveAnnotations(
  cardMediaId: string,
  annotations: ExcalidrawElement[], // Excalidraw format
  annotatedImageBase64: string
): Promise<{ success: boolean; annotatedUrl?: string; error?: string }>
```

**Deliverable:** Annotaties persistent opgeslagen

### Fase 3: UI Customization

**Taken:**
- [ ] Verberg onnodige Excalidraw tools (library, collaboration, etc.)
- [ ] Custom toolbar met alleen relevante tools (arrow, text, shapes)
- [ ] Kleurenpalet beperken tot 6 kleuren (contrast op foto's)
- [ ] Nederlandse labels (indien mogelijk via locale)
- [ ] Header met "Terug" en "Opslaan" knoppen

**UI Customization opties:**
```tsx
<Excalidraw
  UIOptions={{
    canvasActions: {
      loadScene: false,
      export: false,
      saveAsImage: false,
    },
    tools: {
      image: false, // Geen extra images toevoegen
    }
  }}
  langCode="nl-NL" // Nederlandse UI
/>
```

**Deliverable:** Gestroomlijnde annotatie-specifieke UI

### Fase 4: Weergave en Integratie

**Taken:**
- [ ] Toon `annotated_url` in study sessie (i.p.v. originele foto)
- [ ] Toon `annotated_url` in card preview (deck editor)
- [ ] "Geannoteerd" badge indicator
- [ ] "Annotaties verwijderen" functie
- [ ] Error handling en loading states

**Weergave logica:**
```tsx
// In study sessie / card preview
<img src={media.annotated_url || media.url} alt="" />

// Badge indicator
{media.annotated_url && (
  <Badge>Geannoteerd</Badge>
)}
```

**Deliverable:** Volledig geïntegreerde feature

### Fase 5: Polish

**Taken:**
- [ ] Mobile/touch testing
- [ ] Performance optimalisatie (lazy load ~500KB bundle)
- [ ] Unsaved changes warning bij navigeren
- [ ] Accessibility review
- [ ] Edge case testing (grote afbeeldingen, verschillende aspect ratios)

**Deliverable:** Production-ready feature

---

## Vorige Implementatie Fases (Deprecated)

<details>
<summary>Konva.js Implementatie Fases (Gefaald)</summary>

## Implementatie Fases (Konva.js + Full-Page Editor)

> **Update januari 2026:** Aangepaste implementatie fases voor Konva.js met full-page editor aanpak.

### Fase 1: Basis Setup + Full-Page Editor

**Taken:**
- [ ] Konva.js installeren (`npm install konva react-konva`)
- [ ] Database migratie uitvoeren: `annotated_url` en `annotations` kolommen
- [ ] Route aanmaken: `/annotate/[mediaId]/page.tsx`
- [ ] Basis `useKonvaImage` hook (image loading)
- [ ] `AnnotationEditor` component met Stage en Layer
- [ ] Afbeelding correct schalen naar viewport
- [ ] Tekst tool met HTML overlay editing
- [ ] `saveAnnotations` server action (JSON + PNG upload)
- [ ] Integratie in CardSideEditor ("Annoteer" link naar full-page)

**Deliverable:** Tekst labels toevoegen, opslaan als PNG + JSON, tonen in study sessie

**Geen Next.js config nodig:** In tegenstelling tot Fabric.js heeft Konva.js geen speciale webpack configuratie nodig.

### Fase 2: Pijlen en Vormen

**Taken:**
- [ ] Arrow component (native Konva Arrow!)
- [ ] Circle component
- [ ] Rect component
- [ ] Transformer component voor resize/move
- [ ] Kleurkeuze UI (6 preset kleuren)
- [ ] Delete geselecteerde (Delete key + knop)
- [ ] Select tool (default mode)

**Deliverable:** Volledige annotatie toolkit

### Fase 3: Polish en UX

**Taken:**
- [ ] `useAnnotationHistory` hook voor undo/redo
- [ ] Keyboard shortcuts (Del, Ctrl+Z, Ctrl+Y, Escape)
- [ ] Touch/mobile: pinch zoom, drag (Konva heeft goede touch support)
- [ ] Responsive toolbar (collapsed op mobile)
- [ ] Loading states tijdens opslaan
- [ ] "Annotaties verwijderen" functie
- [ ] Confirmation dialog bij unsaved changes + back navigatie

**Deliverable:** Production-ready editor

### Fase 4: Integratie en Edge Cases

**Taken:**
- [ ] Weergave in study sessie (gebruik `annotated_url` indien aanwezig)
- [ ] Weergave in kaart preview (deck editor)
- [ ] Export: annotated images meenemen in JSON export
- [ ] Aspect ratio handling (verschillende foto formaten)
- [ ] Performance: dynamic import voor Konva.js components
- [ ] Error boundary voor canvas failures

**Deliverable:** Volledig geïntegreerde annotatie feature

</details>

---

## Technische Overwegingen (Updated voor Excalidraw)

### Performance

- Lazy load Excalidraw via dynamic import (~500KB bundle)
- Excalidraw heeft ingebouwde performance optimalisaties
- Debounce autosave
- Compress annotation JSON

### Bundle Size

Excalidraw is ~500KB (groter dan Konva.js ~150KB), maar:
- Inclusief alle UX die we anders zelf moeten bouwen
- Lazy loaded, alleen bij annotatie editor
- Tree-shaking mogelijk

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Canvas API vereist
- Fallback: toon originele afbeelding zonder annotaties

### Accessibility

- Excalidraw heeft ingebouwde keyboard navigatie
- Screen reader support
- High contrast mode
- Alt text voor geannoteerde afbeeldingen

---

## Risico's en Mitigatie (Updated)

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| Excalidraw bundle size (~500KB) | Low | Dynamic import, alleen bij annotatie |
| Afbeelding als achtergrond complex | Medium | Excalidraw image element API onderzoeken |
| Excalidraw UI te uitgebreid | Low | UIOptions prop voor customization |
| Mobile performance | Low | Excalidraw is geoptimaliseerd voor mobile |
| Data migratie | Laag | Versioning in JSON schema |
| Text editing bugs | Low | HTML overlay in plaats van canvas text editing |

---

## Success Metrics

- Adoptie: % kaarten met annotaties
- Engagement: Tijd in annotatie editor
- Learning: Verschil in retention annotated vs non-annotated cards
- UX: Error rate, abandonment rate

---

## Bronnen

### Konva.js (gekozen library)
- [Konva.js Documentation](https://konvajs.org/docs/)
- [react-konva GitHub](https://github.com/konvajs/react-konva)
- [Konva.js API Reference](https://konvajs.org/api/Konva.html)
- [react-konva Examples](https://konvajs.org/docs/react/)

### Vergelijkingen
- [Konva.js vs Fabric.js Comparison](https://dev.to/lico/react-comparison-of-js-canvas-libraries-konvajs-vs-fabricjs-1dan)

### Fabric.js (reference, niet gebruikt)
- [Fabric.js Documentation](https://fabricjs.com/docs/)
- [Fabric.js in Next.js Setup](https://dev.to/ziqin/step-by-step-on-how-to-setup-fabricjs-in-the-nextjs-app-3hi3)
- [Build Image Editor with Fabric.js v6](https://blog.logrocket.com/build-image-editor-fabric-js-v6/)

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

## Implementatie Poging #2 - Lessons Learned (Konva.js)

**Datum:** januari 2026
**Status:** Gestopt - feature verwijderd

### Wat is gebouwd

1. **Components:**
   - `AnnotationEditor.tsx` - Hoofd editor component met Konva Stage
   - `AnnotationToolbar.tsx` - Toolbar met tools (text, arrow, circle, rect) en kleurkeuze
   - `TextEditor.tsx` - HTML overlay voor tekst bewerking
   - `hooks/useKonvaImage.ts` - Image loading en dimensie berekening
   - `hooks/useAnnotationHistory.ts` - Undo/redo met functional state updates
   - `index.ts` - Exports

2. **Route:**
   - `/app/(main)/annotate/[mediaId]/page.tsx` - Server component
   - `annotation-page-client.tsx` - Client wrapper voor dynamic import

3. **Server Actions:**
   - `saveAnnotations()` - Base64 string naar PNG upload + JSON opslag
   - `getAnnotations()` - Ophalen van annotaties voor bewerking
   - `removeAnnotations()` - Verwijderen van annotaties

4. **Types:**
   - `annotations.ts` - Shape types, colors, createShape, serializeShapes

5. **Configuratie:**
   - `next.config.ts` - `serverActions.bodySizeLimit: "5mb"` voor grote afbeeldingen
   - Database migratie uitgevoerd: `annotated_url` en `annotations` kolommen

### Technische problemen opgelost

| Probleem | Oorzaak | Oplossing |
|----------|---------|-----------|
| SSR error | `ssr: false` in Server Component | Client wrapper component |
| "Cannot use 'in' operator" | Dynamic import issues | Direct imports in client component |
| Shapes verschijnen niet | Click detection op background image | Check `getClassName() !== "Image"` |
| 500 error bij opslaan | Blob kan niet worden geserialiseerd | Base64 string i.p.v. Blob |
| Body exceeded 1MB | Grote afbeeldingen met pixelRatio 2 | `bodySizeLimit: "5mb"` in next.config |
| Bucket not found | Verkeerde bucket naam | `media` i.p.v. `card-media` |
| RLS policy violation | Upload naar `annotations/` pad | Upload naar `{user_id}/{deck_id}/{card_id}/` pad |
| Column not found | `updated_at` kolom bestaat niet | Kolom verwijderd uit update queries |

### Problemen die niet goed werkten (UX)

1. **Tekst bewerking:**
   - Tekst toevoegen werkte, maar het bewerken was niet intuïtief
   - HTML overlay voor editing was buggy

2. **Shape interactie:**
   - Moeilijk om op pijlen en vormen te klikken
   - Verplaatsen en resizen was niet gebruiksvriendelijk
   - Transformer component werkte niet goed met alle shape types

3. **Geannoteerde afbeeldingen niet getoond:**
   - In study sessie werd originele afbeelding geladen i.p.v. geannoteerde versie
   - `annotated_url` werd niet correct gebruikt in weergave

4. **Performance overwegingen:**
   - Onzeker of pre-rendered PNG benadering daadwerkelijk sneller is
   - Extra storage overhead voor elke geannoteerde foto

### User feedback

1. "De tekst schrijven werkt niet goed"
2. "Het annoteren werkt niet gebruiksvriendelijk"
3. "Je kunt niet makkelijk op de pijltjes of figuren klikken en het verplaatsen"
4. "Tijdens het testen zag ik dat de originele afbeelding werd geladen en niet de geannoteerde versie"
5. "Ik weet niet of het echt de performance ten goede komt"

### Conclusie

Na twee pogingen (Fabric.js en Konva.js) blijkt dat foto-annotatie in de browser een complexe feature is die veel tijd vraagt voor een goede UX. De technische implementatie is mogelijk, maar de gebruikservaring was niet goed genoeg.

### Aanbevelingen voor eventuele toekomstige poging

1. **Overweeg een dedicated annotatie tool:**
   - Tldraw (https://tldraw.com) - Moderne React canvas library
   - Excalidraw (https://excalidraw.com) - Whiteboard-style met goede UX
   - Beide hebben betere out-of-the-box UX dan Fabric.js of Konva.js

2. **Simpelere aanpak:**
   - Alleen pijlen en cirkels, geen tekst editing
   - Pre-defined labels in plaats van vrije tekst
   - Click-to-place in plaats van drag-to-draw

3. **Native app:**
   - Canvas/annotatie features werken beter in native apps
   - Overweeg voor toekomstige iOS/Android app

4. **Externe tool integratie:**
   - Upload naar externe annotatie service
   - Embed annotated image terug

### Verwijderde bestanden

```
src/components/annotation/
├── AnnotationEditor.tsx
├── AnnotationToolbar.tsx
├── TextEditor.tsx
├── hooks/
│   ├── useKonvaImage.ts
│   └── useAnnotationHistory.ts
└── index.ts

src/app/(main)/annotate/
├── [mediaId]/
│   ├── page.tsx
│   └── annotation-page-client.tsx

src/lib/actions/annotations.ts
src/types/annotations.ts
```

### Code wijzigingen teruggedraaid

- `card-side-editor.tsx` - Annotatie knop, Link import, PenTool icon, annotated_url verwijderd
- `deck-editor.tsx` - annotated_url uit CardMedia interface verwijderd
- `page.tsx` (edit) - annotated_url uit query en mapping verwijderd
- `next.config.ts` - serverActions.bodySizeLimit verwijderd
- `package.json` - konva en react-konva dependencies verwijderd

### Database kolommen blijven behouden

De `annotated_url` en `annotations` kolommen in `card_media` tabel blijven bestaan voor eventueel toekomstig gebruik. Ze zijn nullable en hebben geen impact op de huidige functionaliteit.

---

## Implementatie Poging #3 - Lessons Learned (Excalidraw)

**Datum:** januari 2026
**Status:** Gestopt - fundamenteel probleem met library keuze

### Wat is gebouwd

1. **Components:**
   - `ExcalidrawEditor.tsx` - Hoofd editor component met dynamic import
   - `index.ts` - Exports

2. **Route:**
   - `/app/(main)/annotate/[mediaId]/page.tsx` - Server component
   - `annotation-page-client.tsx` - Client wrapper

3. **Server Actions (hergebruikt van Konva.js):**
   - `saveAnnotations()` - Base64 PNG + JSON opslag
   - `getAnnotations()` - Ophalen van annotaties
   - `removeAnnotations()` - Verwijderen van annotaties

4. **Aanpak:**
   - CSS background image + Excalidraw overlay
   - Handmatige canvas rendering voor export (i.v.m. Web Worker SecurityError)
   - Viewport lock poging (scrollX=0, scrollY=0, zoom=1)

### Technische problemen opgelost

| Probleem | Oorzaak | Oplossing |
|----------|---------|-----------|
| Toolbar niet zichtbaar | CSS niet geïmporteerd | `import "@excalidraw/excalidraw/index.css"` |
| SecurityError Web Worker | `exportToSvg` probeert Worker te laden | Handmatige canvas rendering van elementen |
| TypeScript zoom error | `NormalizedZoomValue` branded type | `zoom: { value: 1 as any }` |

### Fundamenteel probleem: Infinite Canvas

Het kernprobleem met Excalidraw is dat het een **infinite canvas whiteboard** is, niet een **image annotation tool**:

```
┌─────────────────────────────────────────────────────────────────────┐
│  WAT EXCALIDRAW IS:                                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    INFINITE CANVAS                            │   │
│  │                                                               │   │
│  │     ┌─────┐                                                   │   │
│  │     │ img │  ← Afbeelding is een ELEMENT op het canvas        │   │
│  │     └─────┘                                                   │   │
│  │                    ↕ pan/zoom/scroll                          │   │
│  │                                                               │   │
│  │  Elementen hebben coördinaten relatief aan CANVAS ORIGIN      │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  WAT WIJ NODIG HEBBEN:                                               │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    FIXED CANVAS = IMAGE                       │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │                                                        │  │   │
│  │  │  IMAGE IS DE BASIS, NIET EEN ELEMENT                   │  │   │
│  │  │                                                        │  │   │
│  │  │     ○───────→ "label"                                  │  │   │
│  │  │                                                        │  │   │
│  │  │  Annotaties hebben coördinaten relatief aan IMAGE      │  │   │
│  │  │                                                        │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Pogingen om het probleem op te lossen

1. **CSS Background + Excalidraw Overlay:**
   - Afbeelding als CSS background, Excalidraw canvas erboven
   - Probleem: Coördinaten matchen niet bij pan/zoom/scroll

2. **Viewport Lock (Optie B):**
   - `scrollX: 0, scrollY: 0, zoom: 1` forceren
   - `handleChange` callback om viewport te resetten
   - Probleem: Excalidraw's interne state blijft anders dan CSS positioning

3. **Fixed Container Dimensions:**
   - Container exact gelijk aan afbeeldingsdimensies
   - Probleem: Excalidraw canvas gedraagt zich nog steeds als infinite canvas

### User feedback

1. "Ik zie nog steeds geen annotaties als ik ze opsla en weer terugkom"
2. Console toont correcte coördinaten (x: 612, y: 506) maar visueel niet zichtbaar
3. "Komt het er niet gewoon op neer dat Excalidraw misschien ook niet de juiste toepassing is?"

### Conclusie

Excalidraw is **niet geschikt** voor image annotation omdat:

1. **Architecturaal mismatch:** Ontworpen als whiteboard, niet als image annotator
2. **Coördinaten systeem:** Relatief aan canvas origin, niet aan afbeelding
3. **Pan/zoom/scroll:** Kernfeatures die moeilijk uit te schakelen zijn
4. **Afbeelding als element:** In plaats van als vaste achtergrond/basis

### Library Vergelijking: Conclusie na 3 pogingen

| Library | Type | Probleem |
|---------|------|----------|
| **Fabric.js** | Canvas library | Tekst editing buggy in modals, sizing issues |
| **Konva.js** | Canvas library | UX niet goed genoeg, shape interactie moeilijk |
| **Excalidraw** | Whiteboard app | Fundamenteel verkeerde tool voor de use case |

**Patroon:** Alle drie de libraries zijn ontworpen voor **canvas manipulation**, niet specifiek voor **image annotation**.

---

## Volgende Stap: Custom Annotation Tool

### Waarom custom bouwen?

Na 3 pogingen met bestaande libraries is de conclusie:

1. **Geen enkele library doet precies wat we nodig hebben**
2. **We gebruiken slechts een fractie van de features** (pijlen, cirkels, tekst)
3. **De UX van deze libraries is niet geoptimaliseerd voor onze use case**
4. **Volledige controle over gedrag is essentieel** voor coördinaten matching

### Scope: Minimale Viable Annotation Tool

| Feature | MVP | Later |
|---------|-----|-------|
| **Pijlen** | ✅ Click start → click end | - |
| **Cirkels** | ✅ Click center → drag radius | - |
| **Tekst labels** | ✅ Click to place → type label | Multi-line |
| **Kleuren** | ✅ 6 preset kleuren | Custom colors |
| **Verwijderen** | ✅ Click om te selecteren, delete | - |
| **Drag/Resize** | ✅ Geselecteerde annotation verplaatsen/schalen | - |
| **Undo/Redo** | ❌ Later | Toevoegen als stabiel |
| **Touch/Mobile** | ❌ Later | Responsive editing |

**Platform:** Desktop-first (editing op desktop, leren op desktop + mobiel)

### Technische Aanpak

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CUSTOM ANNOTATION TOOL                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  <div style={{ position: 'relative' }}>                     │   │
│  │                                                             │   │
│  │    <img                                                     │   │
│  │      src={imageUrl}                                         │   │
│  │      style={{ width, height }}  ← Exacte dimensies          │   │
│  │    />                                                       │   │
│  │                                                             │   │
│  │    <canvas                                                  │   │
│  │      width={imageWidth}                                     │   │
│  │      height={imageHeight}                                   │   │
│  │      style={{ position: 'absolute', inset: 0 }}            │   │
│  │    />                           ← Transparante overlay      │   │
│  │                                                             │   │
│  │  </div>                                                     │   │
│  │                                                             │   │
│  │  Coördinaten zijn ALTIJD relatief aan afbeelding!          │   │
│  │  Geen pan, geen zoom, geen scroll - fixed canvas.          │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Model (Simpel)

```typescript
// types/annotations.ts

interface BaseAnnotation {
  id: string;
  color: string;
}

interface ArrowAnnotation extends BaseAnnotation {
  type: "arrow";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface CircleAnnotation extends BaseAnnotation {
  type: "circle";
  centerX: number;
  centerY: number;
  radius: number;
}

interface TextAnnotation extends BaseAnnotation {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

type Annotation = ArrowAnnotation | CircleAnnotation | TextAnnotation;

interface AnnotationData {
  version: "2.0";
  tool: "custom";
  imageWidth: number;
  imageHeight: number;
  annotations: Annotation[];
}

// Preset kleuren
const ANNOTATION_COLORS = [
  "#FFFFFF", // Wit - voor donkere achtergronden
  "#000000", // Zwart - voor lichte achtergronden
  "#EF4444", // Rood - opvallend
  "#FBBF24", // Geel - aandacht
  "#22C55E", // Groen - positief
  "#3B82F6", // Blauw - neutraal
] as const;
```

### Implementatie Fases

#### Fase 1: Canvas Setup en Basis Tools

**Taken:**
- [ ] Nieuwe `AnnotationCanvas.tsx` component (pure canvas, geen library)
- [ ] Image + canvas overlay met exacte dimensies
- [ ] Arrow tool: click start → click end → render lijn met pijlpunt
- [ ] Circle tool: click center → drag voor radius
- [ ] Kleur selectie (6 preset kleuren)
- [ ] Render loop voor annotations
- [ ] Save naar bestaande server action (JSON + PNG)

**Deliverable:** Pijlen en cirkels toevoegen en opslaan

#### Fase 2: Tekst Labels en Selectie

**Taken:**
- [ ] Text tool: click to place → HTML input overlay voor typing
- [ ] Font size control (preset sizes of slider)
- [ ] Selection: click op annotation om te selecteren
- [ ] Delete: geselecteerde annotation verwijderen (Delete key + knop)
- [ ] Visual feedback voor geselecteerde annotation (highlight/handles)

**Deliverable:** Tekst labels en basis selectie

#### Fase 3: Drag/Resize en Polish

**Taken:**
- [ ] Drag: geselecteerde annotation verplaatsen
- [ ] Resize: pijlen endpoints, cirkel radius, tekst font size
- [ ] Cursor feedback per tool en interactie
- [ ] Loading states tijdens opslaan
- [ ] Error handling
- [ ] Responsive container (scrollable als afbeelding groter dan viewport)
- [ ] Keyboard shortcuts (Delete, Escape)

**Deliverable:** Production-ready tool (desktop)

### Voordelen van Custom Tool

| Aspect | Custom | Libraries |
|--------|--------|-----------|
| **Bundle size** | ~5KB | 150-500KB |
| **Coördinaten** | Exact, altijd consistent | Relatief aan canvas state |
| **Gedrag** | Volledig onder controle | Moet features uitschakelen |
| **Complexiteit** | Alleen wat we nodig hebben | Veel ongebruikte features |
| **Maintenance** | Eigen code | Dependency updates |
| **UX** | Precies zoals wij willen | Compromissen |

### Risico's

| Risico | Mitigatie |
|--------|-----------|
| Meer initiële ontwikkeltijd | Beperkte scope, hergebruik server actions |
| Tekst editing complex | HTML input overlay (bewezen werkend), single-line eerst |
| Drag/resize interactie | Hit detection simpel houden, duidelijke handles |
| Zelf bugs fixen | Simpele codebase, makkelijk te debuggen |
| Geen undo/redo | Later toevoegen als MVP stabiel is |

---

## Beslissingen Custom Tool

- [x] **Moeten annotaties bewerkbaar zijn na opslaan?** → Ja, drag/resize nodig
- [x] **Hoeveel preset kleuren?** → 6 kleuren (makkelijk aanpasbaar)
- [x] **Tekst labels: nodig voor MVP?** → Ja, essentieel voor soortkenmerken
- [x] **Mobile-first of desktop-first?** → Desktop-first (editing op desktop, leren op desktop + mobiel)

---

*Document aangemaakt: januari 2025*
*Lessons learned Fabric.js: januari 2025*
*Lessons learned Konva.js: januari 2026*
*Lessons learned Excalidraw: januari 2026*
*Custom tool plan: januari 2026*
*Custom tool implementatie: januari 2026*

---

## Implementatie Poging #4 - Custom Annotation Tool (SUCCES!)

**Datum:** januari 2026
**Status:** ✅ Werkend - Fase 2 compleet (MVP feature-complete)

### Wat is gebouwd

1. **Components:**
   - `AnnotationCanvas.tsx` - Pure HTML5 Canvas component met alle tools
   - `index.ts` - Exports

2. **Route:**
   - `/app/(main)/annotate/[mediaId]/page.tsx` - Server component met auth
   - `annotation-page-client.tsx` - Client wrapper

3. **Server Actions:**
   - `saveAnnotations()` - Base64 PNG upload + JSON opslag + revalidatePath
   - `getAnnotations()` - Ophalen van annotaties
   - `removeAnnotations()` - Verwijderen van annotaties

4. **Types:**
   - `annotations.ts` - Simpele types voor Arrow, Circle, Text annotaties

5. **Integratie:**
   - "Annoteer" knop (PenTool icon) in CardSideEditor
   - "Geannoteerd" badge bij thumbnails
   - `annotated_url` wordt getoond in study sessie en card previews

### Werkende Features

| Feature | Status | Notities |
|---------|--------|----------|
| **Pijlen tekenen** | ✅ | Click-drag van start naar end |
| **Cirkels tekenen** | ✅ | Click center, drag voor radius |
| **Tekst labels** | ✅ | Click to place, HTML input overlay |
| **Kleur selectie** | ✅ | 6 preset kleuren |
| **Selecteren** | ✅ | Click op annotation om te selecteren |
| **Verwijderen** | ✅ | Delete key of knop voor geselecteerde |
| **Opslaan** | ✅ | PNG + JSON naar Supabase |
| **Laden** | ✅ | Bestaande annotaties worden getoond |
| **Thumbnail update** | ✅ | Na opslaan via revalidatePath |
| **Drag annotations** | ✅ | Sleep annotaties naar nieuwe positie |
| **Resize annotations** | ✅ | Pijl endpoints, cirkel radius, tekst font size |
| **Auto-select na aanmaken** | ✅ | Annotation wordt direct geselecteerd, tool switcht naar select |
| **Hover feedback** | ✅ | Blauwe glow bij hover over annotation |
| **Grotere hit areas** | ✅ | 20px tolerance voor makkelijker selecteren |
| **Cirkel interieur klikbaar** | ✅ | Klik overal in cirkel om te selecteren |

### Technische Problemen Opgelost

| Probleem | Oorzaak | Oplossing |
|----------|---------|-----------|
| Tekst input verdwijnt direct | `onBlur` fired door mouseUp event | `textInputJustCreated` ref flag met 300ms timeout |
| Annotaties niet zichtbaar bij laden | `render()` niet afhankelijk van `imageLoaded` | `imageLoaded` toegevoegd aan useCallback dependencies |
| Thumbnail niet geüpdatet na save | Next.js cache niet geïnvalideerd | `revalidatePath()` toegevoegd aan saveAnnotations |
| Duplicate `deckId` variable | Variabele al eerder gedefinieerd | Dubbele declaratie verwijderd |

### Architectuur

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CUSTOM ANNOTATION TOOL                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  <div style={{ position: 'relative' }}>                            │
│                                                                     │
│    <img src={imageUrl} />           ← Achtergrond afbeelding        │
│                                                                     │
│    <canvas                                                          │
│      width={imageWidth}                                             │
│      height={imageHeight}                                           │
│      style={{ position: 'absolute', inset: 0 }}                    │
│    />                               ← Transparante annotation layer │
│                                                                     │
│    {textInput && <input />}         ← HTML overlay voor tekst       │
│                                                                     │
│  </div>                                                             │
│                                                                     │
│  Coördinaten zijn ALTIJD relatief aan afbeelding!                  │
│  Geen pan, geen zoom, geen scroll - fixed canvas.                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Code Patterns

**Text Input met Blur Protection:**
```typescript
const textInputJustCreated = useRef(false);

// Bij aanmaken text input:
textInputJustCreated.current = true;
setTimeout(() => { textInputJustCreated.current = false; }, 300);

// Bij onBlur:
if (textInputJustCreated.current) return; // Ignore immediate blur
```

**Render afhankelijk van imageLoaded:**
```typescript
const render = useCallback(() => {
  if (!canvas || !ctx || !imageLoaded) return;
  // ... render annotations
}, [annotations, previewAnnotation, selectedId, imageLoaded]);
```

**Canvas export met image + annotations:**
```typescript
const exportCanvas = document.createElement("canvas");
exportCanvas.width = imageDimensions.width;
exportCanvas.height = imageDimensions.height;
const ctx = exportCanvas.getContext("2d");

// 1. Draw image
ctx.drawImage(img, 0, 0);

// 2. Draw annotations on top
for (const annotation of annotations) {
  // ... draw each annotation type
}

// 3. Export as PNG
const pngBase64 = exportCanvas.toDataURL("image/png");
```

### Nog te implementeren (Toekomstig)

| Feature | Prioriteit | Notities |
|---------|------------|----------|
| **Undo/Redo** | P2 | History stack |
| **Mobile/Touch** | P2 | Touch events, responsive |
| **Keyboard shortcuts** | P3 | Numbers voor tool selectie |

### Opslag Architectuur

**Hybride opslag voor editing + display:**

1. **JSON annotaties** → `card_media.annotations` (JSONB kolom)
   - Bevat alle annotatie objecten met coördinaten
   - Gebruikt om editor te herladen met bewerkbare annotaties

2. **PNG afbeelding** → Supabase Storage bucket "media"
   - Pad: `{userId}/{deckId}/{cardId}/{cardMediaId}-annotated.png`
   - Afbeelding met annotaties "gebakken" erin
   - Gebruikt voor thumbnails en study sessies

3. **URL referentie** → `card_media.annotated_url`
   - Publieke URL naar PNG in storage

**Bij herbewerking:**
- `upsert: true` overschrijft bestaand bestand (geen duplicaten)
- Oude versie wordt vervangen door nieuwe
- Optimaal voor opslagbeheer

### Conclusie

De custom tool aanpak werkt uitstekend. Door geen externe library te gebruiken hebben we:

1. **Volledige controle** over coördinaten en gedrag
2. **Minimale bundle size** (~5KB vs 150-500KB)
3. **Simpele, debugbare code**
4. **Exacte UX zoals gewenst**

De annotatie-editor is nu MVP feature-complete met alle essentiële functionaliteit:
- Tekenen: pijlen, cirkels, tekst labels
- Bewerken: selecteren, verplaatsen, resizen, verwijderen
- UX: auto-select, hover feedback, grote hit areas
- Persistentie: JSON voor editing, PNG voor display

### Debug Logging (te verwijderen na stabilisatie)

De volgende console.log statements zijn toegevoegd voor debugging en kunnen later worden verwijderd:

- `AnnotationCanvas.tsx`: component mount, render calls, save flow
- `annotation-page-client.tsx`: handleSave calls
- `annotations.ts`: saveAnnotations flow
- `page.tsx`: loaded media info
