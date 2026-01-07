# Naturae MVP - Implementatieplan

## Platform Strategie

| Aspect | MVP | Toekomst |
|--------|-----|----------|
| **Primair platform** | Desktop browser | + Native apps |
| **Responsive design** | Ja, mobile-friendly | - |
| **Ontwikkelmethode** | Browser DevTools responsive mode | Real device testing |
| **PWA features** | Nee | Install prompt, offline mode |
| **Native apps** | Nee | Android & iOS |

**Aanpak:** Desktop browser first development met responsive design. Periodiek testen op echte telefoon, niet bij elke feature.

---

## Gerelateerde Documentatie

| Document | Beschrijving |
|----------|--------------|
| [MVP Design](naturae-mvp-design.md) | Product visie, hypotheses, sprint planning, features |
| [Database Architectuur](database-architecture.md) | Schema, tabellen, RLS policies, storage |
| [Data Flow Architectuur](data-flow-architecture.md) | API patterns, auth flow, caching, Server Actions |
| [Design Systeem](design-system.md) | Components, kleuren, typography, shadcn/ui setup |

---

## Fase 1: Project Setup

### 1.1 Next.js Project Initialiseren

```bash
npx create-next-app@latest naturae --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Configuratie keuzes:**
- TypeScript: Ja
- ESLint: Ja
- Tailwind CSS: Ja
- `src/` directory: Ja
- App Router: Ja
- Import alias: `@/*`

### 1.2 Dependencies Installeren

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# shadcn/ui setup
npx shadcn-ui@latest init

# shadcn/ui componenten
npx shadcn-ui@latest add button input card dialog dropdown-menu avatar badge progress skeleton toast
```

### 1.3 Project Structuur

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/
│   ├── (main)/
│   │   ├── dashboard/
│   │   ├── decks/
│   │   └── study/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/              # shadcn/ui componenten
│   ├── flashcard/
│   ├── deck/
│   └── layout/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── actions/         # Server Actions
│   └── utils.ts
├── types/
│   └── database.ts      # Supabase generated types
└── styles/
    └── globals.css
```

### 1.4 Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 1.5 Tailwind Configuratie

Zie [Design Systeem - Tailwind Config](design-system.md#tailwind-configuratie) voor de volledige configuratie met custom kleuren.

### Checklist Fase 1
- [x] Next.js project aangemaakt (Next.js 16.1.1)
- [x] Dependencies geinstalleerd (@supabase/supabase-js, @supabase/ssr)
- [x] shadcn/ui geconfigureerd (Tailwind v4)
- [x] shadcn/ui componenten geinstalleerd (12 componenten)
- [x] Mappenstructuur opgezet
- [x] Environment variables template (.env.local.example)
- [x] Tailwind config met custom kleuren (blauw primary, semantic kleuren)
- [x] Inter font geconfigureerd
- [x] Supabase clients aangemaakt (client.ts, server.ts, middleware.ts)
- [x] Middleware voor auth redirects
- [x] Placeholder database types
- [ ] Git repository geinitialiseerd

---

## Fase 2: Database Setup

### 2.1 Supabase Project

1. Maak nieuw project op [supabase.com](https://supabase.com)
2. Kopieer project URL en anon key naar `.env.local`
3. Schakel email confirmatie uit voor development (Authentication > Providers > Email)

### 2.2 Database Schema

Voer de SQL uit vanuit [Database Architectuur](database-architecture.md):

1. **Tabellen aanmaken** - Zie sectie "Database Schema"
2. **RLS Policies** - Zie sectie "Row Level Security"
3. **Indexes** - Zie sectie "Indexes"
4. **Triggers** - Zie sectie "Triggers"

**Volgorde van uitvoeren:**
```sql
-- 1. Basis tabellen
profiles, decks, cards, card_media, user_progress

-- 2. Tags systeem
tags, deck_tags

-- 3. RLS policies per tabel

-- 4. Indexes

-- 5. Triggers (updated_at, profile creation)
```

### 2.3 Storage Buckets

```sql
-- In Supabase SQL Editor of via Dashboard

-- Card media bucket (foto's en audio)
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-media', 'card-media', true);

-- Avatar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

### 2.4 TypeScript Types Genereren

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

### 2.5 Seed Data: Voorgebouwde Leersets

Zie [MVP Design - Startcontent](naturae-mvp-design.md#startcontent) voor de twee voorgebouwde sets:
- Nederlandse Amfibieën (16 soorten)
- Nederlandse Sprinkhanen (48 soorten)

### Checklist Fase 2
- [x] Supabase project aangemaakt (bmkxhnktszwqiuiywwbz)
- [x] Environment variables ingevuld (.env.local)
- [x] Email confirmatie - blijft aan (test met eigen email)
- [x] SQL script uitgevoerd
- [x] Alle tabellen aangemaakt (9 tabellen)
- [x] RLS policies ingesteld
- [x] Indexes aangemaakt
- [x] Triggers geconfigureerd
- [x] Storage buckets aangemaakt (avatars, media)
- [x] TypeScript types gegenereerd
- [ ] Seed data voorbereid (later, voor nu verder met Fase 3)

---

## Fase 3: Authenticatie

### 3.1 Supabase Client Setup

Zie [Data Flow Architectuur - Supabase Client](data-flow-architecture.md#supabase-clients) voor:
- Browser client (`lib/supabase/client.ts`)
- Server client (`lib/supabase/server.ts`)
- Middleware (`middleware.ts`)

### 3.2 Auth Pagina's

| Route | Functie |
|-------|---------|
| `/login` | Email/password login |
| `/signup` | Registratie |
| `/onboarding` | Username kiezen (na eerste login) |

### 3.3 Auth Flow

```
Signup → Email verificatie (optioneel) → Onboarding (username) → Dashboard
Login → Dashboard (of Onboarding als geen username)
```

### 3.4 Middleware Configuratie

```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

**Protected routes:** `/dashboard`, `/decks`, `/study`
**Public routes:** `/`, `/login`, `/signup`

### 3.5 Profile Trigger

Bij signup wordt automatisch een profile aangemaakt via database trigger. Zie [Database Architectuur - Triggers](database-architecture.md).

### Checklist Fase 3
- [x] Supabase clients geconfigureerd (al gedaan in Fase 1)
- [x] Middleware voor auth (al gedaan in Fase 1)
- [x] Login pagina
- [x] Signup pagina (met email confirmatie flow)
- [x] Onboarding flow (username kiezen)
- [x] Protected routes (middleware + dashboard check)
- [x] Auth state management
- [x] Logout functionaliteit
- [x] Homepage met links naar login/signup
- [x] **GETEST EN WERKEND**

---

## Fase 4: Core Features ← **ACTIEF**

### 4.1 Dashboard

**Componenten:**
- Welkom bericht met username
- Lijst van beschikbare decks
- Voortgang overzicht (kaarten geleerd, due today)

**Data fetching:** Server Component met Supabase server client

### 4.2 Deck Overzicht

**Route:** `/decks/[id]`

**Componenten:**
- Deck header (titel, beschrijving, aantal kaarten)
- Voortgang statistieken
- "Start Oefenen" knop
- Lijst van kaarten (preview)

### 4.3 Study Session (Flashcards)

**Route:** `/study/[deckId]`

Dit is de kern van de MVP. Zie [Data Flow Architectuur - Study Session](data-flow-architecture.md) voor de volledige flow.

**Componenten:**
- FlashcardView (foto/audio voorkant, tekst achterkant)
- AudioPlayer (inline, autoplay optioneel)
- RatingButtons ("Ken ik niet" / "Twijfel" / "Ken ik")
- SessionProgress (voortgang in huidige sessie)
- SessionComplete (samenvatting na afloop)

**Spaced Repetition Logic:**

| Rating | Actie |
|--------|-------|
| Ken ik niet | `next_review = now`, kaart komt direct terug |
| Twijfel | `next_review = now + 1 dag` |
| Ken ik | `next_review` op basis van huidige interval (1→3→7→14 dagen) |

Zie [Data Flow Architectuur - SRS Server Action](data-flow-architecture.md#server-actions) voor implementatie.

### 4.4 Audio Player

**Vereisten:**
- Inline player (geen externe app)
- Play/pause toggle
- Laad indicatie
- Foutafhandeling (bestand niet gevonden)

**Ondersteunde formaten:** MP3, WebM, OGG

### 4.5 Media Display

**Afbeeldingen:**
- Next.js Image component voor optimalisatie
- Placeholder tijdens laden
- Alt tekst voor accessibility

**Attributie:**
- Fotograaf/bron weergeven onder media
- Link naar originele bron indien beschikbaar

### Checklist Fase 4
- [x] Dashboard pagina
- [x] Deck overzicht pagina
- [x] Flashcard component (met CSS flip animatie)
- [x] Card flip animatie (CSS)
- [x] Audio player component
- [x] Rating buttons (3-knops: again, hard, good)
- [x] Spaced repetition logic (FSRS via ts-fsrs)
- [x] Session progress tracking
- [x] Session complete scherm
- [x] Media attributie weergave (bronvermelding)
- [x] Keyboard shortcuts (1, 2, 3 en spatie)
- [x] Media upload (foto's en audio)
- [x] Media positie (front, back, both)

---

## Fase 4b: Bulk Import (Sprint 2) ✅ AFGEROND

### 4b.1 Bulk Import UI

**Route:** `/decks/import` (nieuwe deck) + `/decks/[id]/edit` (bestaande deck)

**Componenten:**
- FileDropzone (drag & drop voor audio bestanden)
- ImportPreview (lijst van te importeren kaarten)
- MetadataExtractor (bestandsnaam + ID3 parsing)
- DeckConfigForm (titel, beschrijving)
- ImportProgress (voortgang indicator)

### 4b.2 Bestandsnaam Parsing

**Ondersteunde naamconventies:**
```
{nr}. {groep} - {subgroep} - {naam} - {wetenschappelijke naam}.mp3
{nr}. {groep} - {wetenschappelijke naam} - {naam}.wav
```

**Extractie:**
- Volgnummer → `position`
- Nederlandse naam → `back_text`
- Wetenschappelijke naam → metadata (toekomst: species link)
- Groep/subgroep → potentiële tags

### 4b.3 ID3 Tag Parsing

**Ondersteunde tags (MP3):**
| Tag | Veld | Gebruik |
|-----|------|---------|
| TPE1 | Artist | `attribution` auteur |
| WCOP | Copyright | `attribution` copyright |
| WOAF | URL | `source_url` (xeno-canto link) |
| COMM | Comment | Extra metadata (locatie, datum) |
| APIC | Picture | Embedded afbeelding extracten |

**Library:** `music-metadata` (npm package)

### 4b.4 Media Upload Flow

1. Gebruiker dropt bestanden
2. Client-side: parse bestandsnamen en ID3 tags
3. Preview tonen met geëxtraheerde data
4. Gebruiker vult deck titel/beschrijving in
5. "Importeren" → Server Action:
   - Maak deck aan
   - Per bestand:
     - Upload audio naar Storage (`{user_id}/{deck_id}/{unique_id}-{filename}`)
     - Extract embedded image → upload naar Storage
     - Maak card aan met media links
   - Update deck `card_count`

### Checklist Fase 4b
- [x] FileDropzone component
- [x] Bestandsnaam parser (regex)
- [x] ID3 metadata extractie (music-metadata)
- [x] Embedded image extractie (APIC tag)
- [x] Import preview UI
- [x] Deck configuratie form
- [x] Server Action voor batch import
- [x] Storage upload voor audio
- [x] Storage upload voor images
- [x] Progress indicator
- [x] Error handling per bestand
- [x] Bulk import naar bestaande deck (via edit pagina)
- [x] Unieke bestandsnamen (timestamp + random ID)
- [x] Storage folder structuur per deck (`{user_id}/{deck_id}/`)
- [x] Audio player fix (unieke keys per kaart)
- [x] Kaart terug kunnen draaien (toggle flip)
- [x] Kaarten zichtbaar na bulk import (page reload)
- [ ] Test met Sprinkhanen dataset (41 bestanden)
- [x] Test met Trekvogels dataset (98 bestanden met embedded images)

---

## Fase 4c: Sessie-modi (Sprint 2) ✅ AFGEROND

### 4c.1 Sessie-modus Keuze

**Route:** `/study/[deckId]?mode={order|shuffle|smart}`

**Componenten:**
- `SessionModeSelector` - Modal met 3 selecteerbare kaarten
- `StartStudyButton` - Knop die modal opent op deck pagina

**Modi:**
| Modus | Beschrijving |
|-------|--------------|
| **Volgorde** | Kaarten in deck volgorde, alle kaarten |
| **Shuffle** | Willekeurige volgorde (Fisher-Yates), alle kaarten 1x |
| **Slim leren** | FSRS scheduling, alleen due cards |

### 4c.2 Implementatie

**UI:**
- Modus selectie via dialog vóór sessie start
- 3 clickable cards met iconen (ListOrdered, Shuffle, Brain)
- Toon aantal kaarten per modus
- Geen default - gebruiker moet altijd kiezen

**Logica:**
- "Volgorde": sorteer op `position`, alle kaarten
- "Shuffle": Fisher-Yates shuffle, alle kaarten
- "Slim leren": filter op due cards, FSRS scheduling

**Rating gedrag:**
- Alle modi: rating knoppen actief voor sessie stats
- "Volgorde" en "Shuffle": voortgang wordt NIET opgeslagen in database
- "Slim leren": voortgang wordt opgeslagen via FSRS

**Technische details:**
- Mode via URL search param (`?mode=shuffle`)
- Key-based remount voor schone state bij navigatie
- useRef pattern om dubbele fetch in React Strict Mode te voorkomen

### Checklist Fase 4c
- [x] Sessie-modus selectie UI (SessionModeSelector component)
- [x] "Volgorde" modus implementatie
- [x] "Shuffle" modus implementatie (Fisher-Yates)
- [x] Modus voorkeur onthouden - **NIET NODIG** (gebruiker kiest elke keer)
- [x] Sessie stats per modus (bekeken, correct, opnieuw)
- [x] Test alle drie modi
- [x] Bug fix: dubbele fetch in Strict Mode veroorzaakte kaart-flits

---

## Fase 5: Polish & Deploy

### 5.1 Error Handling

- Toast notificaties voor fouten
- Fallback UI voor failed requests
- Loading states (skeletons)

### 5.2 Performance

- Image optimization (Next.js Image)
- Media prefetching (volgende kaart)
- Caching strategie (zie [Data Flow Architectuur](data-flow-architecture.md#caching-strategie))

### 5.3 Responsive Design

Test in browser DevTools:
- iPhone SE (375px)
- iPhone 14 (390px)
- iPad (768px)
- Desktop (1024px+)

### 5.4 Accessibility

- Keyboard navigatie
- Screen reader labels
- Focus indicators
- Color contrast (WCAG AA)

### 5.5 Analytics Setup

Basis tracking voor MVP metrics:
- Page views
- Session duration
- Cards studied
- Retention events

### 5.6 Deployment

**Vercel:**
```bash
# Vercel CLI
npm i -g vercel
vercel
```

**Environment variables in Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Custom domain:** Configureer in Vercel dashboard

### 5.7 Testen op Echte Telefoon

- Laad productie URL op telefoon
- Test touch interacties
- Test audio playback
- Test in verschillende browsers (Safari, Chrome)

### 5.8 JSON Export

**Route:** `/api/decks/[id]/export`

**Functionaliteit:**
- Export deck metadata + alle kaarten + media info als JSON
- Optioneel: ZIP met JSON + media bestanden
- Alleen eigen decks of publieke decks exporteren

**Implementatie:**
```typescript
// API Route: /api/decks/[id]/export
// Query params: ?format=json | ?format=zip

interface DeckExport {
  version: "1.0";
  exported_at: string;
  deck: { title, description, is_public, tags };
  cards: Array<{
    front_text, back_text, position,
    media: Array<{ type, filename, position, attribution, source_url }>
  }>;
  media_files: string[]; // alleen bij ZIP
}
```

### Checklist Fase 5
- [x] Error handling & toasts (Sonner toast systeem geïntegreerd)
- [x] Loading states (al aanwezig in study page, import, etc.)
- [ ] Responsive design getest
- [x] Keyboard navigatie (1/2/3 voor rating, spatie voor flip)
- [ ] Analytics basis
- [x] Vercel deployment
- [x] Environment variables
- [ ] Custom domain (optioneel)
- [ ] Test op echte telefoon
- [ ] Seed data in productie
- [x] JSON Export API route (`/api/decks/[id]/export`)
- [x] Export knop op deck pagina (ExportButton component)
- [x] Export bug fix (kolom mismatch card_media)

---

## MVP Success Criteria

Na voltooiing van alle fasen, valideer tegen de [MVP metrics](naturae-mvp-design.md#sprint-1-absolute-mvp-week-1-2):

| Metric | Target |
|--------|--------|
| Dag-7 retention | >30% |
| Kaarten per sessie | >10 gemiddeld |
| Set completion (14 dagen) | >50% |

---

## Fase 6: Sprint 3 - Sharing & Network Effects

### 6.1 Openbaar/Privé Toggle ✅ AL AFGEROND

De toggle zit al in de deck editor (`/decks/[id]/edit`).

### 6.2 Tag Systeem

**Database:** Tabellen `tags` en `deck_tags` bestaan al.

**Tags tabel:**
- `slug`: unieke identifier (bijv. "vogels")
- `names`: meertalig JSON (bijv. `{"nl": "Vogels", "en": "Birds"}`)
- `type`: "topic" | "region" | "language" | "content-type"

**UX Flow:**

1. **Bij deck bewerken:** Tag selector met autocomplete
   - Bestaande tags zoeken/selecteren
   - Nieuwe tags aanmaken
   - Max 5 tags per deck

2. **Op Ontdek pagina:** Tag filters
   - Clickable tag chips
   - Meerdere tags selecteerbaar (AND filter)
   - URL params: `/discover?tags=vogels,nederland`

3. **Op deck pagina:** Tags als badges weergeven

**Componenten:**
- `TagSelector` - Autocomplete input voor deck editor
- `TagFilter` - Clickable chips voor Ontdek pagina
- `TagBadges` - Weergave op deck cards

### 6.3 Ontdek Pagina ✅ AFGEROND

**Route:** `/discover`

**Componenten:**
- PublicDeckGrid - Grid van openbare decks ✅
- SearchBar - Zoeken op titel ✅
- TagFilter - Filteren op tags ⏳
- SortSelect - Sorteren (nieuwste, populairste) ✅

**Data fetching:**
```typescript
const { data: decks } = await supabase
  .from("decks")
  .select(`
    id, title, description, card_count, created_at,
    profiles!user_id (username, avatar_url),
    deck_tags (tags (slug, names))
  `)
  .eq("is_public", true)
  .is("deleted_at", null)
  .order("created_at", { ascending: false });
```

### 6.4 Hartjes Systeem

**Concept:** Gebruikers kunnen een hartje geven aan een leerset om aan te geven dat ze hem leuk vinden. Dit is geen rating (1-5 sterren), maar een simpele like.

**Functionaliteit:**
- Hartje toggle (wel/niet geliked)
- Teller: "52 ❤️" zichtbaar op deck
- Sorteren op populariteit (aantal hartjes)

**Database:** Hergebruik `deck_stars` tabel met `rating = 1` voor een hartje.

**Componenten:**
- `LikeButton` - Hartje toggle knop
- `LikeCount` - Aantal hartjes weergave

### 6.5 Landing Page & Gastgebruik ✅ GROTENDEELS AFGEROND

**Design Filosofie:** Natuurlijke conversie door kwaliteit, niet door opdringerigheid.

#### Landing Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] Naturae                    [Ontdek] [Inloggen]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │  [Subtiele natuurfoto achtergrond, lage opacity] │   │
│   │                                                   │   │
│   │      Leer soorten herkennen                      │   │
│   │      met flashcards van de community             │   │
│   │                                                   │   │
│   │      [🔍 Zoek leersets...                    ]   │   │
│   │                                                   │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│  ──────────────── Populaire leersets ─────────────────  │
│                                                         │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│   │ 🐦      │  │ 🦋      │  │ 🐸      │  │ 🌿      │   │
│   │ Trekvog │  │ Vlinders│  │ Amfibie │  │ Planten │   │
│   │ 98 krt  │  │ 45 krt  │  │ 16 krt  │  │ 32 krt  │   │
│   │ ❤️ 24   │  │ ❤️ 18   │  │ ❤️ 12   │  │ ❤️ 8    │   │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                         │
│                 [Bekijk alle leersets →]                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Routes & Toegang

| Route | Gast | Ingelogd |
|-------|------|----------|
| `/` | Landing page | Redirect naar `/dashboard` |
| `/discover` | ✅ Volledig toegang | ✅ Volledig toegang |
| `/decks/[id]` | ✅ Openbare decks bekijken | ✅ + eigen decks |
| `/study/[deckId]` | ✅ Leren zonder opslaan | ✅ Voortgang opslaan |
| `/dashboard` | Redirect naar `/` | ✅ Eigen dashboard |
| `/my-decks` | Redirect naar `/` | ✅ Eigen decks |

#### Natuurlijke Conversie Momenten

Geen pop-ups, geen banners, geen urgentie. Alleen contextuele hints op logische momenten:

1. **Hartje klikken als gast:**
   - Inline bericht: "Log in om leersets te bewaren"
   - Kleine "Inloggen" link eronder
   - Geen modal, geen blokkade

2. **Na study sessie als gast:**
   - Sessie statistieken tonen (normaal)
   - Subtiele tekst onderaan: "Je voortgang is niet opgeslagen"
   - Link: "Maak account aan om voortgang te bewaren"

3. **Op deck pagina (als gast):**
   - "Start met leren" werkt gewoon
   - Geen extra prompts of waarschuwingen

#### Technische Implementatie

**Gastgebruik:**
- Geen database writes voor gasten
- Sessie stats alleen in component state
- LocalStorage NIET gebruiken (privacy)

**Auth check pattern:**
```typescript
// In server components
const { data: { user } } = await supabase.auth.getUser();
const isGuest = !user;

// Conditioneel renderen
{isGuest && <GuestPrompt />}
```

**Middleware aanpassing:**
- `/` - Altijd toegankelijk (landing of redirect)
- `/discover` - Altijd toegankelijk
- `/decks/[id]` - Toegankelijk voor openbare decks
- `/study/[deckId]` - Toegankelijk voor openbare decks
- `/dashboard`, `/my-decks`, `/decks/new` - Alleen ingelogd

### 6.6 WYSIWYG Kaart Editor

> Oorspronkelijk gepland voor Sprint 2, verplaatst naar Sprint 3.

**Concept:** Kaart bewerken met live preview zoals in leermodus.

**Functionaliteit:**
- Split view: editor links, preview rechts
- Direct visuele feedback bij aanpassingen
- Media preview op voor- en achterkant zichtbaar
- Flip animatie in preview

### Checklist Fase 6
- [x] Openbaar/privé toggle (al aanwezig)
- [ ] Tag systeem
  - [ ] TagSelector component voor deck editor
  - [ ] Tags opslaan bij deck
  - [ ] TagFilter component voor Ontdek pagina
- [x] Ontdek pagina
  - [x] PublicDeckGrid component
  - [x] Zoeken op titel
  - [ ] Filteren op tags
  - [x] Sorteren (nieuwste, populairste)
- [x] Hartjes systeem
  - [x] Database: deck_likes tabel + like_count kolom + trigger
  - [x] Server Actions: toggleLike, getLikeStatus
  - [x] LikeButton component
  - [x] Like count weergave op deck cards
  - [x] Sorteren op populariteit (discover, landing page)
- [x] Landing page & gastgebruik
  - [x] Landing page met hero, zoekbalk, populaire decks
  - [x] Thumbnails op deck cards
  - [x] Middleware aanpassen voor gastgebruik
  - [x] Deck pagina toegankelijk voor gasten (openbare decks)
  - [x] Study sessie voor gasten (zonder voortgang opslaan)
  - [ ] Achtergrond foto voor hero sectie
- [ ] WYSIWYG kaart editor
  - [ ] Split view layout
  - [ ] Live preview component
  - [ ] Flip animatie in preview

---

## MVP+ Features (Toekomstig)

> Features die na de MVP core sprints geïmplementeerd kunnen worden.

### Analytics

**Vercel Analytics** (aanbevolen):
- Zero-config setup met `@vercel/analytics`
- Web Vitals tracking (LCP, FID, CLS)
- Page views en custom events
- Privacy-friendly (geen cookies nodig voor basis tracking)
- Gratis tier beschikbaar

**Installatie:**
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Custom events voor Naturae:**
```typescript
import { track } from '@vercel/analytics';

// Study sessie events
track('study_session_start', { deckId, mode: 'shuffle' });
track('card_rated', { rating: 'good', deckId });
track('study_session_complete', { cardsStudied: 20, duration: 300 });

// Deck events
track('deck_created', { cardCount: 15 });
track('deck_exported', { format: 'json' });
```

### Remix/Kopieer Functie

**Concept:** Gebruikers kunnen openbare decks kopiëren naar hun eigen collectie om aan te passen.

**Functionaliteit:**
- "Remix" knop op openbare deck pagina
- Kopieert deck + kaarten (media wordt gedeeld, niet gedupliceerd)
- `copied_from_deck_id` tracking voor attributie
- Teller: "X keer geremixed" naast hartjes

### Private Sharing (Share Tokens)

**Concept:** Private decks delen via unieke link.

**Functionaliteit:**
- Genereer unieke share token
- URL: `/decks/share/{token}`
- Toegang tot private deck zonder account
- Token intrekken mogelijk

### Foto Annotatie Editor

> Geïnspireerd door BirdID's annotated species photos

**Probleem:** Voor soortherkenning zijn foto's met visuele annotaties essentieel - labels die wijzen naar kenmerken (bijv. "bruine vleugel", "witte oogstreep").

**Oplossing:** In-app foto-editor:
- Tekst labels toevoegen
- Pijlen/lijnen naar kenmerken
- Cirkels/ellipsen voor gebieden
- Annotaties als overlay (origineel blijft intact)

**Technisch:** Canvas-based met Fabric.js of Konva.js

### Voortgangsdashboard

**Concept:** Statistieken over leervoortgang.

**Features:**
- Kaarten geleerd per dag/week
- Streak tracking
- Moeilijke kaarten identificeren

### Andere MVP+ Features
- Responsive design optimalisatie
- PWA install prompt
- Push notificaties/reminders
- Offline mode
- Custom domain setup
- Leerinstellingen per leerset (FSRS presets)
- Meerdere foto's per kaart

---

## Volgende Stappen

**Huidige status:** Sprint 3 (Sharing & Network Effects) - in uitvoering

**Afgerond in Sprint 3:**
- ✅ Publiek/privé toggle voor leersets
- ✅ Ontdek pagina met zoeken en sorteren
- ✅ Landing page met hero, zoekbalk, populaire decks
- ✅ Thumbnails op deck cards
- ✅ Gastgebruik (publieke decks bekijken en leren)
- ✅ JSON Export
- ✅ Hartjes systeem (LikeButton, sorteren op populariteit)

**Nog te doen in Sprint 3:**
- [ ] Achtergrond foto voor landing page hero sectie
- [ ] Tag systeem (TagSelector, TagFilter)
- [ ] WYSIWYG kaart editor

**Verplaatst naar later (Sprint 4+):**
- Subtiele conversie hints na gastensessie

Zie [MVP Design - Sprint 3](naturae-mvp-design.md#sprint-3-sharing--network-effects-week-5-6) voor volledige feature beschrijving.

---

*Dit document wordt bijgewerkt tijdens de implementatie met learnings en aanpassingen.*
