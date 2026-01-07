# Design Systeem - Naturae

> Dit document beschrijft het visuele design systeem voor Naturae: kleuren, typografie, componenten en UI patterns. Het is een levend document dat we iteratief verfijnen.

## Inhoudsopgave
1. [Design Principes](#design-principes)
2. [Inspiratie: BirdID](#inspiratie-birdid)
3. [Design Tokens](#design-tokens)
4. [Componenten](#componenten)
5. [Page Layouts](#page-layouts)
6. [Responsive Design](#responsive-design)
7. [Accessibility](#accessibility)
8. [Open Vragen](#open-vragen)

---

## Design Principes

### 1. Mobile-First
- Primair gebruik is op telefoon (onderweg in het veld)
- Touch-friendly targets (min 44x44px)
- PWA voor app-like ervaring

### 2. Focus op Content
- Foto's en audio zijn de kern - geef ze ruimte
- Minimale UI chrome tijdens leersessies
- Snelle, vloeiende interacties

### 3. Toegankelijk
- Hoog contrast voor buiten gebruik
- Duidelijke feedback states
- Keyboard en screen reader support

### 4. Natuurlijk
- Kleuren geïnspireerd door natuur
- Rustige, niet-afleidende interface
- Geen felle notificaties tijdens leren

---

## Inspiratie: BirdID

Uit de BirdID screenshots (zie [docs/Reference/](Reference/)) leren we:

### UI Patterns

| Pattern | BirdID | Naturae Toepassing |
|---------|--------|-------------------|
| **Segmented controls** | Aantal vragen, tijdslimiet, level | Tag filters, sorteer opties |
| **Card-based answers** | Multiple choice opties | Flashcard interface, deck cards |
| **Inline audio player** | Simpele play/pause met progress | Zelfde patroon |
| **Annotated images** | Labels op foto's | Toekomst: species kenmerken |
| **Feedback colors** | Groen (correct), Rood (fout) | Zelfde patroon |
| **Book icon** | Link naar species info | Link naar Species Book |

### Typografie Hiërarchie

BirdID gebruikt duidelijke hiërarchie:
- **Common name**: Bold, groot
- **Scientific name**: Italic, kleiner, grijs
- **Descriptions**: Regular, leesbare regellengte

### Kleurgebruik

- **Primary**: Blauw (buttons, links)
- **Success**: Groen (correct antwoord)
- **Error**: Rood (fout antwoord)
- **Neutral**: Grijs tinten voor UI chrome

---

## Design Tokens

### Kleuren

```css
/* tailwind.config.js */
:root {
  /* Primary - Koel blauw (BirdID-stijl) */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;  /* Main */
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Neutral */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-300: #d4d4d4;
  --color-neutral-400: #a3a3a3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;

  /* Semantic */
  --color-success: #22c55e;  /* Groen voor "Ken ik" / correct */
  --color-error: #ef4444;    /* Rood voor "Ken ik niet" / fout */
  --color-warning: #f59e0b;  /* Oranje voor "Twijfel" */
  --color-info: #3b82f6;     /* Blauw (zelfde als primary) */

  /* Background */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-bg-tertiary: #e5e5e5;
}

/* Dark mode (toekomst) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: #171717;
    --color-bg-secondary: #262626;
    --color-bg-tertiary: #404040;
  }
}
```

### Typografie

```css
:root {
  /* Font families */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */

  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing

```css
:root {
  /* Consistent spacing scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### Border Radius

```css
:root {
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-xl: 1rem;      /* 16px */
  --radius-2xl: 1.5rem;   /* 24px */
  --radius-full: 9999px;
}
```

### Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

---

## Componenten

### Button

```tsx
// Variants: primary, secondary, ghost, danger
// Sizes: sm, md, lg

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
}

// Tailwind classes
const variants = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
  ghost: 'text-neutral-600 hover:bg-neutral-100',
  danger: 'bg-error text-white hover:bg-red-600',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}
```

### Card (Deck Card)

```tsx
// Voor deck overzichten
interface DeckCardProps {
  deck: Deck
  tags: Tag[]
  onClick?: () => void
}

// Layout:
// ┌─────────────────────────────┐
// │  Cover Image (of gradient)  │
// ├─────────────────────────────┤
// │  Title                      │
// │  Description (truncated)    │
// │                             │
// │  [Tag] [Tag] [Tag]          │
// │                             │
// │  👤 username  ·  🃏 24 cards │
// └─────────────────────────────┘
```

### Flashcard

```tsx
// De kern van de app
interface FlashcardProps {
  card: Card
  media: CardMedia[]
  isFlipped: boolean
  onFlip: () => void
}

// States:
// - Front: Toont vraag (foto/audio/tekst)
// - Back: Toont antwoord (naam)
// - Flipping: Animatie

// Layout (front):
// ┌─────────────────────────────┐
// │                             │
// │                             │
// │      [Foto of Audio]        │
// │                             │
// │                             │
// │      "Tap om te draaien"    │
// └─────────────────────────────┘

// Layout (back):
// ┌─────────────────────────────┐
// │                             │
// │      [Foto (klein)]         │
// │                             │
// │      Boerenzwaluw           │
// │      Hirundo rustica        │
// │                             │
// │      [📖 Species Book]      │
// └─────────────────────────────┘
```

### Answer Buttons

```tsx
// Drie-knops systeem (zoals Anki simplified)
interface AnswerButtonsProps {
  onAnswer: (rating: 'again' | 'hard' | 'good') => void
  disabled?: boolean
}

// Layout:
// ┌────────┐ ┌────────┐ ┌────────┐
// │  Ken   │ │Twijfel │ │  Ken   │
// │ik niet │ │        │ │ik wel  │
// │  (1)   │ │  (2)   │ │  (3)   │
// └────────┘ └────────┘ └────────┘
//   Red       Orange      Green

// Keyboard shortcuts: 1, 2, 3
```

### Audio Player

```tsx
// Inline audio player (zoals BirdID)
interface AudioPlayerProps {
  src: string
  attribution?: Attribution
}

// Layout:
// ┌─────────────────────────────────────┐
// │  [▶]  ────●───────────────  -00:29  │
// └─────────────────────────────────────┘

// Minimalistisch, past in card
```

### Tag Chip

```tsx
interface TagChipProps {
  tag: Tag
  selected?: boolean
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
}

// Variants per type:
// - topic: Blauw
// - region: Groen
// - language: Paars
// - difficulty: Oranje
// - content-type: Grijs

// Layout:
// ┌──────────────┐
// │  🏷 Vogels  ×│
// └──────────────┘
```

### Species Name Display

```tsx
// Consistent display van soortnamen
interface SpeciesNameProps {
  commonName: string
  scientificName: string
  size?: 'sm' | 'md' | 'lg'
}

// Layout:
// Boerenzwaluw          <- Bold, primary color
// Hirundo rustica       <- Italic, muted color
```

### Progress Indicator

```tsx
// Voor sessie voortgang
interface ProgressIndicatorProps {
  current: number
  total: number
  correct?: number
}

// Layout:
// 3/10               of:    ████████░░░░  8/12
```

### Attribution Display

```tsx
// Voor foto/audio bronvermelding
interface AttributionProps {
  name?: string
  source?: string
  url?: string
  license?: string
}

// Layout (compact):
// 📷 Piet Jansen · waarneming.nl · CC BY-NC

// Layout (expanded, in modal):
// Fotograaf: Piet Jansen
// Bron: waarneming.nl
// Link: [Bekijk origineel]
// Licentie: CC BY-NC
```

---

## Page Layouts

### Dashboard

```
┌─────────────────────────────────────┐
│  Logo          [🔔] [👤]            │
├─────────────────────────────────────┤
│                                     │
│  Welkom terug, [username]!          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Vandaag te herhalen: 12    │    │
│  │  [Start sessie]             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Mijn Leersets                      │
│  ┌─────────┐ ┌─────────┐            │
│  │ Deck 1  │ │ Deck 2  │ ...        │
│  └─────────┘ └─────────┘            │
│                                     │
│  [+ Nieuwe leerset]                 │
│                                     │
└─────────────────────────────────────┘
```

### Study Session

```
┌─────────────────────────────────────┐
│  ← Terug              3/10          │
├─────────────────────────────────────┤
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │                             │    │
│  │       [Flashcard]           │    │
│  │                             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │Ken niet│ │Twijfel │ │Ken ik  │   │
│  └────────┘ └────────┘ └────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Discover Page

```
┌─────────────────────────────────────┐
│  ← Terug          Ontdek            │
├─────────────────────────────────────┤
│  🔍 Zoek leersets...                │
│                                     │
│  Tags:                              │
│  [Vogels] [Planten] [Nederland] ... │
│                                     │
│  Sorteer: [Populair ▼]              │
│                                     │
│  ┌─────────┐ ┌─────────┐            │
│  │ Deck 1  │ │ Deck 2  │            │
│  │ ⭐ 4.5  │ │ ⭐ 4.2  │            │
│  └─────────┘ └─────────┘            │
│  ┌─────────┐ ┌─────────┐            │
│  │ Deck 3  │ │ Deck 4  │            │
│  └─────────┘ └─────────┘            │
│                                     │
└─────────────────────────────────────┘
```

### Create/Edit Deck

```
┌─────────────────────────────────────┐
│  ← Annuleer      Nieuwe leerset     │
├─────────────────────────────────────┤
│                                     │
│  Titel *                            │
│  ┌─────────────────────────────┐    │
│  │ Nederlandse Amfibieën       │    │
│  └─────────────────────────────┘    │
│                                     │
│  Beschrijving                       │
│  ┌─────────────────────────────┐    │
│  │ Leer alle 16 inheemse...    │    │
│  └─────────────────────────────┘    │
│                                     │
│  Tags                               │
│  [Amfibieën ×] [Nederland ×] [+]    │
│                                     │
│  Cover afbeelding                   │
│  ┌─────────────────────────────┐    │
│  │      [+ Upload]             │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Volgende: Kaarten toevoegen →]    │
│                                     │
└─────────────────────────────────────┘
```

---

## Responsive Design

### Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px   /* Landscape phone */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Mobile-first Components

```tsx
// Deck grid: 1 col op mobile, 2 op tablet, 3+ op desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {decks.map(deck => <DeckCard key={deck.id} deck={deck} />)}
</div>

// Flashcard: Full-width op mobile, max-width op desktop
<div className="w-full max-w-md mx-auto">
  <Flashcard ... />
</div>

// Answer buttons: Stacked op zeer kleine schermen
<div className="flex flex-col sm:flex-row gap-2">
  <Button>Ken ik niet</Button>
  <Button>Twijfel</Button>
  <Button>Ken ik</Button>
</div>
```

---

## Accessibility

### Focus States

```css
/* Duidelijke focus ring */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Skip link */
.skip-link {
  position: absolute;
  left: -9999px;
}
.skip-link:focus {
  left: 0;
}
```

### ARIA Labels

```tsx
// Audio player
<button
  aria-label={isPlaying ? 'Pauzeer audio' : 'Speel audio af'}
  onClick={togglePlay}
>
  {isPlaying ? <PauseIcon /> : <PlayIcon />}
</button>

// Flashcard
<div
  role="button"
  aria-label="Draai kaart om"
  tabIndex={0}
  onClick={onFlip}
  onKeyDown={(e) => e.key === 'Enter' && onFlip()}
>
  {/* card content */}
</div>
```

### Color Contrast

- Tekst: minimum 4.5:1 contrast ratio
- Large text: minimum 3:1
- Interactive elements: duidelijk onderscheidbaar

### Keyboard Navigation

| Key | Actie |
|-----|-------|
| `1` | "Ken ik niet" |
| `2` | "Twijfel" |
| `3` | "Ken ik" |
| `Space` | Flip card / Play audio |
| `Enter` | Confirm / Select |
| `Escape` | Cancel / Close modal |

---

## MVP Beslissingen

| Onderwerp | Beslissing | Toelichting |
|-----------|------------|-------------|
| **Leermodus** | Alleen flashcards | Quiz modus komt in v2 |
| **Tags UI** | Presets + nieuw maken | Autocomplete met bestaande tags, optie om nieuwe te maken |
| **Kleurenpalet** | Blauw/koel | BirdID-stijl, professioneel en vertrouwd |
| **Dark mode** | Niet voor MVP | Later toevoegen met Tailwind `dark:` classes |
| **Animaties** | Niet voor MVP | Card flip en transitions later |
| **UI Library** | shadcn/ui | Radix UI + Tailwind, copy-paste componenten |
| **Icons** | Lucide | Meegeleverd met shadcn/ui |
| **Font** | Inter | Via next/font, automatisch geoptimaliseerd |
| **Illustraties** | Niet voor MVP | Simpele tekst voor lege states |

### shadcn/ui Setup

```bash
# Initialisatie
npx shadcn-ui@latest init

# Aanbevolen componenten voor MVP
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge        # Voor tags
npx shadcn-ui@latest add command      # Voor tag autocomplete
npx shadcn-ui@latest add popover      # Voor tag selector
npx shadcn-ui@latest add progress     # Voor sessie voortgang
npx shadcn-ui@latest add skeleton     # Voor loading states
npx shadcn-ui@latest add toast        # Voor notificaties
```

### Font Setup

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="nl" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### Tags Component (Sprint 2)

```tsx
// Combinatie van preset tags en vrije invoer
interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  deckId?: string  // Voor context-aware suggesties
}

// Layout:
// ┌─────────────────────────────────────────┐
// │ Geselecteerd:                           │
// │ [Vogels ×] [Nederland ×]                │
// │                                         │
// │ ┌─────────────────────────────────────┐ │
// │ │ 🔍 Zoek of maak tag...              │ │
// │ └─────────────────────────────────────┘ │
// │                                         │
// │ Suggesties:                             │
// │ [Amfibieën] [Planten] [Geluiden]       │
// │                                         │
// │ Of maak nieuwe tag: "trekvogels" [+]   │
// └─────────────────────────────────────────┘
```

---

## Open Vragen

- [x] ~~**Kleurenpalet**: Groen (natuur) of blauw (vertrouwd/BirdID-achtig)?~~ **Blauw/koel**
- [x] ~~**Dark mode**: Prioriteit voor MVP?~~ **Niet voor MVP**, later toevoegen
- [x] ~~**Animaties**: Flip animatie voor cards?~~ **Niet voor MVP**, later toevoegen
- [x] ~~**Icon library**: Lucide? Heroicons?~~ **Lucide** (via shadcn/ui)
- [x] ~~**Fonts**: Inter of system fonts?~~ **Inter** via next/font
- [x] ~~**Illustraties**: Nodig voor lege states?~~ **Niet voor MVP**

---

## Changelog

| Datum | Wijziging |
|-------|-----------|
| 2025-01-05 | Kleurenpalet naar blauw, shadcn/ui + Lucide icons, Inter font, alle design vragen beantwoord |
| 2025-01-05 | MVP beslissingen toegevoegd: alleen flashcards, tags UI met presets + nieuw maken |
| 2025-01-05 | Initieel document aangemaakt met BirdID analyse |
