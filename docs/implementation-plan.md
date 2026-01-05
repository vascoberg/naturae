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
- [ ] Dashboard pagina
- [ ] Deck overzicht pagina
- [ ] Flashcard component
- [ ] Card flip animatie (CSS)
- [ ] Audio player component
- [ ] Rating buttons
- [ ] Spaced repetition logic (Server Action)
- [ ] Session progress tracking
- [ ] Session complete scherm
- [ ] Media attributie weergave

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

### Checklist Fase 5
- [ ] Error handling & toasts
- [ ] Loading states
- [ ] Responsive design getest
- [ ] Keyboard navigatie
- [ ] Analytics basis
- [ ] Vercel deployment
- [ ] Environment variables
- [ ] Custom domain (optioneel)
- [ ] Test op echte telefoon
- [ ] Seed data in productie

---

## MVP Success Criteria

Na voltooiing van alle fasen, valideer tegen de [MVP metrics](naturae-mvp-design.md#sprint-1-absolute-mvp-week-1-2):

| Metric | Target |
|--------|--------|
| Dag-7 retention | >30% |
| Kaarten per sessie | >10 gemiddeld |
| Set completion (14 dagen) | >50% |

---

## Volgende Stappen (Post-MVP)

Na succesvolle MVP launch, ga door naar Sprint 2:
- User Generated Content (eigen leersets maken)
- Zie [MVP Design - Sprint 2](naturae-mvp-design.md#sprint-2-user-generated-content-week-3-4)

---

*Dit document wordt bijgewerkt tijdens de implementatie met learnings en aanpassingen.*
