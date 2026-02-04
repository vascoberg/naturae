# Flashcard Layout Verbetering

## Overzicht

De huidige quiz/flashcard-weergave benut schermruimte suboptimaal. Dit document analyseert de problemen en beschrijft een verbeterde layout.

**Status:** 🔄 Wordt handmatig opnieuw gedaan (wijzigingen gediscard)

**Bron:** [backlog.md](../backlog.md) lines 91-107

---

## Requirements (uit backlog)

### Geïdentificeerde Problemen

- Kaart te klein in het midden van het scherm
- Veel lege ruimte rondom
- Afbeeldingen en annotaties zijn nauwelijks zichtbaar
- Sidebar neemt ruimte in tijdens leermodus

### Gewenste Situatie

- Grotere kaarten die meer schermruimte benutten
- Media (afbeelding/audio) prominent weergegeven
- Antwoordopties goed zichtbaar
- Responsive: werkt op desktop en mobiel
- Niet per se donkere achtergrond zoals Quizlet, maar wel immersief

### Referentie

- **Quizlet flashcard-modus** als benchmark voor immersieve ervaring

---

## Analyse Huidige Layout

### Screenshots (referentie)

- **Desktop:** `/Users/vascovdberg/Desktop/Scherm­afbeelding 2026-02-03 om 22.09.57.png`
- **Mobile:** `/Users/vascovdberg/Downloads/WhatsApp Image 2026-02-03 at 22.21.38.jpeg`

### Desktop (Screenshot analyse)

**Wat te zien is:**
- Pacific Swallow foto op draad, gecentreerd in content area
- Sidebar links zichtbaar (Naturae logo, Dashboard, Mijn leersets, Ontdek, Instellingen)
- Progress bar: "Vraag 2 van 10"
- Attribution: "Cricket Keeper · CC-BY · Cricket Keeper · CC-BY · Naturalis"

**Huidige structuur:**
```
┌─────────────────────────────────────────────────────────┐
│ Sidebar │           Content Area                        │
│  (240px)│  ┌─────────────────────────────┐              │
│         │  │ Progress: Vraag 2 van 10    │              │
│         │  ├─────────────────────────────┤              │
│         │  │                             │              │
│         │  │   Pacific Swallow foto      │              │
│         │  │      max-w-lg (~512px)      │              │
│         │  │                             │              │
│         │  ├─────────────────────────────┤              │
│         │  │ Photo attribution           │              │
│         │  ├─────────────────────────────┤              │
│         │  │ "Welke soort is dit?"       │              │
│         │  ├─────────────────────────────┤              │
│         │  │ [Barn Swallow-Hi] [Brown-t] │ ← TRUNCATED  │
│         │  │ [Olive-backed S] [Pacific]  │              │
│         │  └─────────────────────────────┘              │
│         │          [Volgende →]                         │
│         │                                    LEGE RUIMTE│
└─────────────────────────────────────────────────────────┘
```

**Geïdentificeerde problemen:**

1. **Truncated antwoordtekst** - Lange soortnamen worden afgekapt
   - "Barn Swallow - Hi..." → wetenschappelijke naam afgeknipt
   - "Brown-throated Su..." → naam past niet
   - "Olive-backed Sunb..." → naam past niet
   - Alleen "Pacific Swallow" (geselecteerd) past volledig
   - 2-kolom grid maakt buttons te smal voor lange namen

2. **Onbenutte ruimte** - Veel lege ruimte rechts van de kaart
   - `max-w-lg` beperkt kaart tot ~512px
   - Sidebar + content = ~750px, rest is leeg
   - Op 1920px breed scherm blijft ~60% onbenut

3. **Kleine afbeelding** - Foto relatief klein voor desktop
   - `aspect-[4/3]` binnen max-w-lg = ~384px hoog
   - Details in vogelfoto's moeilijk te zien
   - Identificatiekenmerken niet goed zichtbaar

### Mobile (Screenshot analyse)

**Wat te zien is:**
- Javan Pond Heron foto (reiger op waterlelies)
- naturae.app in Safari browser
- Attribution: "dirk ten boer · CC-BY-NC · Observation.org"
- Alle 4 opties zichtbaar, maar "Volgende" knop net afgesneden
- Geselecteerd antwoord heeft groene border

**Huidige structuur:**
```
┌─────────────────────┐
│ 22:21        5G  12%│  ← Status bar
├─────────────────────┤
│ naturae.app         │  ← Browser bar
├─────────────────────┤
│ ≡  🌿 Naturae       │  ← Header
├─────────────────────┤
│ Vraag 3 van 10 ━━━  │  ← Deels zichtbaar
├─────────────────────┤
│                     │
│  Javan Pond Heron   │
│  foto (reiger)      │  ← Goede grootte!
│  ~300px hoog        │
│                     │
├─────────────────────┤
│ Attribution         │
├─────────────────────┤
│ "Welke soort..."    │
├─────────────────────┤
│ [Great Egret - full]│  ← Tekst past!
│ [Asian Koel - full] │
│ [Little Egret -full]│
│ [Javan Pond ✓ groen]│
├─────────────────────┤
│ [Volgende →         │  ← AFGESNEDEN
└─────────────────────┘   Scroll nodig!
```

**Geïdentificeerde problemen:**

1. **"Volgende" knop net buiten viewport** - Gebruiker moet scrollen
   - Knop is ~20-30px buiten zichtbaar gebied
   - Verstoort quiz-flow (extra actie nodig)
   - Na elk antwoord moet je scrollen

2. **Cumulatieve hoogte te groot:**
   - Status bar (~44px) + Browser bar (~50px) + Header (~56px)
   - Progress bar (~40px) + Afbeelding (~300px) + Attribution (~40px)
   - Vraag (~30px) + 4 opties (4×~70px = 280px) + Button (~50px)
   - **Totaal: ~890px**, viewport is ~844px (iPhone 14)

**Goede punten:**

- ✅ Afbeelding is prima grootte en kwaliteit
- ✅ 1-kolom layout werkt goed
- ✅ Tekst past volledig in buttons (geen truncation)
- ✅ Book icon voor species info goed geplaatst

---

## Technische Constraints

### Huidige CSS Classes (quiz-question.tsx)

```tsx
// Container
<div className="space-y-4">

// Afbeelding container
<div className="relative aspect-[4/3] w-full bg-muted">

// Options grid
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

// Option buttons
<Button className="h-auto py-3 px-4 justify-start text-left">
  <p className="font-medium truncate">{option.name}</p>
  <p className="text-xs text-muted-foreground italic truncate">
    {option.scientificName}
  </p>
```

### Parent Container (page.tsx)

```tsx
<div className="container max-w-lg mx-auto p-4 pt-6">
```

### Key Constraints

| Element | Huidige waarde | Impact |
|---------|----------------|--------|
| `max-w-lg` | 512px | Beperkt totale breedte op desktop |
| `aspect-[4/3]` | 75% van breedte | ~300px hoog op mobile, ~384px desktop |
| `truncate` | text-overflow: ellipsis | Knipt soortnamen af op desktop |
| `sm:grid-cols-2` | 2 kolommen vanaf 640px | Buttons te smal voor lange namen |
| `space-y-4` | 16px tussen elementen | Cumulatief ~64px extra hoogte |
| `p-4 pt-6` | Container padding | Neemt ~40px verticale ruimte |

### Berekening Mobile Viewport

```
iPhone 14 viewport: 844px hoog

Vaste elementen:
- Status bar:      44px
- Safari bar:      50px  (kan minimaliseren bij scroll)
- App header:      56px
- Progress bar:    40px
- Attribution:     40px
- Vraag tekst:     30px
- Padding/gaps:    ~48px
                   ─────
Subtotaal:         308px

Variabele elementen:
- Afbeelding:      ~300px (aspect 4:3 van ~400px breed)
- 4 opties:        ~280px (4 × 70px)
- Volgende knop:   ~50px
                   ─────
Subtotaal:         630px

TOTAAL:            938px  → 94px teveel!
```

---

## Verbeteringsplan

### Doelen

1. **Desktop:** Volledige soortnamen zichtbaar in antwoordopties
2. **Mobile:** Alles zichtbaar zonder scrollen (boven de vouw)
3. **Beide:** Afbeelding prominent maar proportioneel

### Aanpak: Responsive Aspect Ratio

**Idee:** Verschillende aspect ratios per schermgrootte

```css
/* Mobile: breder, minder hoog */
aspect-[16/9]  /* 56.25% van breedte */

/* Tablet/Desktop: standaard */
sm:aspect-[4/3]  /* 75% van breedte */
```

Dit bespaart ~20% verticale ruimte op mobile.

### Aanpak: Dynamische Container Breedte

**Idee:** Grotere container op desktop

```tsx
// Van:
<div className="container max-w-lg mx-auto">

// Naar:
<div className="container max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
```

### Aanpak: Antwoordopties Verbeteren

**Gekozen: Multi-line toestaan**

```tsx
// Huidige code (quiz-question.tsx:171-175):
<div className="flex-1 min-w-0">
  <p className="font-medium truncate">{option.name}</p>
  <p className="text-xs text-muted-foreground italic truncate">
    {option.scientificName}
  </p>
</div>

// Nieuwe code:
<div className="flex-1 min-w-0">
  <p className="font-medium">{option.name}</p>
  <p className="text-xs text-muted-foreground italic">
    {option.scientificName}
  </p>
</div>
```

**Effect:** Buttons worden automatisch hoger als tekst wrapt (dankzij bestaande `h-auto` class).

---

## Mockup Beschrijvingen

### Desktop Mockup

**Nieuwe structuur:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Sidebar │                    Content Area                       │
│  (240px)│  ┌─────────────────────────────────────────────────┐  │
│         │  │ Progress: Vraag 2 van 10 ━━━━━━━━━━━━━━━━━━━━━  │  │
│         │  ├─────────────────────────────────────────────────┤  │
│         │  │                                                 │  │
│         │  │                                                 │  │
│         │  │           Grotere afbeelding                    │  │
│         │  │           max-w-2xl (~672px)                    │  │
│         │  │           of max-w-3xl (~768px)                 │  │
│         │  │                                                 │  │
│         │  │                                                 │  │
│         │  ├─────────────────────────────────────────────────┤  │
│         │  │ Photo attribution                               │  │
│         │  ├─────────────────────────────────────────────────┤  │
│         │  │ "Welke soort is dit?"                           │  │
│         │  ├─────────────────────────────────────────────────┤  │
│         │  │ [Barn Swallow –          ] [Brown-throated      ]│  │
│         │  │ [ Hirundo rustica        ] [ Sunbird – Anthre...]│  │
│         │  │ [Olive-backed Sunbird –  ] [Pacific Swallow –   ]│  │
│         │  │ [ Cinnyris jugularis     ] [ Hirundo tahitica   ]│  │
│         │  ├─────────────────────────────────────────────────┤  │
│         │  │              [Volgende →]                       │  │
│         │  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Wijzigingen:**
- Container breedte: `max-w-lg` → `max-w-lg md:max-w-2xl lg:max-w-3xl`
- Afbeelding wordt ~30-50% groter (672-768px breed vs 512px)
- Antwoordopties: multi-line toegestaan, geen `truncate`
- 2-kolom grid behouden, maar buttons zijn breder
- Tekst wrapt naar tweede regel als nodig

**Button voorbeeld (multi-line):**
```
┌──────────────────────────────────────┐
│ Barn Swallow – Hirundo rustica       │  ← Naam + wetenschappelijk
│ Hirundo rustica (Linnaeus, 1758)     │  ← Auteur (optioneel)
└──────────────────────────────────────┘
```

### Mobile Mockup

**Nieuwe structuur:**
```
┌─────────────────────┐
│ 22:21        5G  12%│  ← Status bar
├─────────────────────┤
│ naturae.app         │  ← Browser bar (minimaliseert bij scroll)
├─────────────────────┤
│ ≡  🌿 Naturae       │  ← Header
├─────────────────────┤
│ Vraag 3 van 10 ━━━  │
├─────────────────────┤
│                     │
│  Javan Pond Heron   │
│  foto (reiger)      │  ← aspect-[16/9] ipv 4/3
│  ~225px hoog        │    bespaart ~75px
│                     │
├─────────────────────┤
│ Attribution (compact)│ ← p-2 ipv p-3, bespaart ~8px
├─────────────────────┤
│ "Welke soort..."    │
├─────────────────────┤
│ [Great Egret]       │  ← py-2 ipv py-3
│ [Asian Koel]        │    bespaart 4×4px = 16px
│ [Little Egret]      │
│ [Javan Pond ✓]      │
├─────────────────────┤
│ [Volgende →]        │  ← NU ZICHTBAAR!
├─────────────────────┤
│ "Enter/Spatie..."   │  ← Instructie tekst
└─────────────────────┘
```

**Berekening nieuwe layout:**
```
iPhone 14 viewport: 844px hoog

Vaste elementen (ongewijzigd):
- Status bar:      44px
- Safari bar:      50px
- App header:      56px
- Progress bar:    40px
- Vraag tekst:     30px
- Padding/gaps:    ~40px (was ~48px)
                   ─────
Subtotaal:         260px (was 308px, -48px)

Variabele elementen (geoptimaliseerd):
- Afbeelding:      ~225px (aspect 16/9 van ~400px breed, was ~300px)
- Attribution:     ~32px (compact, was ~40px)
- 4 opties:        ~248px (4 × 62px, was 4 × 70px)
- Volgende knop:   ~44px (size="default" ipv "lg")
- Instructie:      ~20px
                   ─────
Subtotaal:         569px (was 630px, -61px)

TOTAAL:            829px  → 15px marge! ✅
```

### Vergelijking Huidige vs Nieuw

| Aspect | Huidig | Nieuw |
|--------|--------|-------|
| **Desktop** | | |
| Container breedte | max-w-lg (512px) | max-w-lg md:max-w-2xl lg:max-w-3xl |
| Afbeelding breedte | ~512px | ~672-768px |
| Tekst in buttons | Truncated (afgekapt) | Multi-line (volledig) |
| **Mobile** | | |
| Afbeelding aspect | 4:3 (~300px hoog) | 16:9 (~225px hoog) |
| Button padding | py-3 (12px) | py-2 (8px) |
| Attribution | p-3 | p-2 |
| Scrollen nodig | Ja (~94px overflow) | Nee (~15px marge) |
| "Volgende" knop | Afgesneden | Zichtbaar |
| **Beide** | | |
| `truncate` class | Ja | Verwijderd |
| Button hoogte | Vast | Dynamisch (h-auto) |

---

## Implementatie Stappen

### Fase 1: Mobile Fix (Prioriteit)

**Doel:** ~100px ruimte besparen zodat alles in viewport past

**Bestanden:**
- `src/components/study/quiz-question.tsx`
- `src/app/(public)/study/[deckId]/page.tsx`

**Wijzigingen:**

1. [x] **Responsive aspect ratio** (quiz-question.tsx:104)
   ```tsx
   // Van:
   <div className="relative aspect-[4/3] w-full bg-muted">
   // Naar:
   <div className="relative aspect-[16/9] sm:aspect-[4/3] w-full bg-muted">
   ```

2. [x] **Compactere attribution** (quiz-question.tsx:131)
   ```tsx
   // Van:
   <div className="p-3 border-t bg-muted/30">
   // Naar:
   <div className="p-2 border-t bg-muted/30">
   ```

3. [x] **Compactere buttons** (quiz-question.tsx:153)
   ```tsx
   // Van:
   className="h-auto py-3 px-4 justify-start..."
   // Naar:
   className="h-auto py-2 sm:py-3 px-3 sm:px-4 justify-start..."
   ```

4. [x] **Kleinere gaps** (quiz-question.tsx:88)
   ```tsx
   // Van:
   <div className="space-y-4">
   // Naar:
   <div className="space-y-2 sm:space-y-4">
   ```

5. [x] **Extra: options grid gap** (quiz-question.tsx:147)
   ```tsx
   // Van:
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
   // Naar:
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
   ```

6. [ ] Testen op iPhone SE, iPhone 14, iPhone Pro Max

### Fase 2: Desktop Verbetering

**Doel:** Grotere kaart, volledige soortnamen zichtbaar

**Bestanden:**
- `src/app/(public)/study/[deckId]/page.tsx` (container)
- `src/components/study/quiz-question.tsx` (truncate)
- `src/components/flashcard/flashcard.tsx` (zelfde wijzigingen)

**Wijzigingen:**

1. [x] **Grotere container** (page.tsx, 3 locaties: 394, 684, 1108)
   ```tsx
   // Van:
   <div className="w-full max-w-lg">
   // Naar:
   <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl">
   ```

2. [x] **Verwijder truncate** (quiz-question.tsx:172-175)
   ```tsx
   // Van:
   <p className="font-medium truncate">{option.name}</p>
   <p className="text-xs text-muted-foreground italic truncate">
   // Naar:
   <p className="font-medium">{option.name}</p>
   <p className="text-xs text-muted-foreground italic">
   ```

3. [ ] Testen met lange soortnamen:
   - "Olive-backed Sunbird – Cinnyris jugularis"
   - "Brown-throated Sunbird – Anthreptes malacensis"
   - Test op 1280px, 1440px, 1920px

### Fase 3: Flashcard Modus

**Doel:** Dezelfde verbeteringen voor flashcard component

**Bestand:** `src/components/flashcard/flashcard.tsx`

1. [x] Analyseer huidige flashcard layout → gebruikt al `max-w-2xl`
2. [x] Container in page.tsx is aangepast (wraps de flashcard)
3. [ ] Test alle study modes: volgorde, shuffle, slim leren

### Fase 4: Polish

1. [ ] Dark mode validatie
2. [ ] Accessibility check (focus states, contrast)
3. [ ] Cross-browser test (Safari, Chrome, Firefox)

---

## Referenties

- **Quizlet flashcard-modus** - Benchmark voor immersieve quiz ervaring
- [backlog.md](../backlog.md) - Originele feature request (lines 91-107)

---

## Design Beslissingen ✅

### Scope
- **Beide modi:** Quiz (`quiz-question.tsx`) én Flashcard (`flashcard/flashcard.tsx`)

### Layout
- **Sidebar:** Blijft zichtbaar op desktop (niet verbergen)
- **Fullscreen modus:** Niet nodig
- **Achtergrond:** Huidige lichte achtergrond is prima, alleen kaart groter maken
- **Lange soortnamen:** Multi-line toestaan, button hoogte past zich automatisch aan

### Technisch
- **Viewport hoogte:** Huidige layout gebruikt GEEN vh units - alleen vaste pixel-gebaseerde classes
- **Aanbevolen aanpak:** Responsive classes (Tailwind breakpoints) voor verschillende schermgroottes

---

## Lessons Learned (Mislukte Poging 3 feb 2026)

**Status:** ❌ Wijzigingen gediscard, handmatig opnieuw te doen

### Wat ging fout

1. **Geen centraal overzicht gehad van de layout hiërarchie**
   - Wijzigingen werden piecemeal toegepast zonder te begrijpen hoe containers nesten
   - `page.tsx` → `quiz-session.tsx` → `quiz-question.tsx` hebben elk eigen width constraints
   - Door overal verschillende max-width te zetten ontstonden conflicten

2. **Meerdere quiz componenten over het hoofd gezien**
   - `quiz-question.tsx` werd aangepast
   - `quiz-audio-question.tsx` werd vergeten → tekst bleef truncated
   - `quiz-session.tsx` had eigen `max-w-md` die alles overschreef

3. **Te agressieve wijzigingen aan container breedte**
   - `max-w-lg md:max-w-2xl lg:max-w-3xl` in page.tsx was veel te groot
   - Verwijderen van `max-w-md` uit quiz-session.tsx maakte kaart enorm
   - `max-w-xl` (576px) vs `max-w-lg` (512px) is slechts 64px verschil

### Correcte aanpak

1. **Centrale controle in `quiz-session.tsx`**
   - Dit is de wrapper voor alle quiz vragen
   - Hier de max-width bepalen, niet in page.tsx of question components

2. **Alle quiz components consistent houden**
   - `quiz-question.tsx` en `quiz-audio-question.tsx` moeten identieke styling hebben
   - Wijzigingen aan één = wijzigingen aan beide

3. **Kleine incrementele wijzigingen**
   - `max-w-md` (448px) → `max-w-lg` (512px) is al 14% groter
   - Of: alleen `truncate` verwijderen en kijken of multi-line voldoende is
   - Niet meteen naar `max-w-2xl` springen

### Concrete aanbevelingen voor retry

**Optie A: Alleen truncate verwijderen (minimale wijziging)**
```tsx
// quiz-question.tsx EN quiz-audio-question.tsx
<p className="font-medium">{option.name}</p>  // was: truncate
<p className="text-xs text-muted-foreground italic">  // was: truncate
```
Test of multi-line buttons voldoende ruimte geven.

**Optie B: Iets bredere container (kleine wijziging)**
```tsx
// quiz-session.tsx
<div className="max-w-lg mx-auto">  // was: max-w-md
```
64px extra breedte, conservatief.

**Optie C: Responsive container (medium wijziging)**
```tsx
// quiz-session.tsx
<div className="max-w-md sm:max-w-lg mx-auto">
```
448px op mobile, 512px op desktop.

### Files die samen moeten worden aangepast

| File | Wat | Waarom |
|------|-----|--------|
| `quiz-session.tsx` | Container breedte | Centrale controle |
| `quiz-question.tsx` | truncate, padding, aspect ratio | Foto quiz |
| `quiz-audio-question.tsx` | Exact dezelfde wijzigingen | Audio quiz |

**NIET aanpassen:** `page.tsx` containers - deze zijn voor andere study modes
