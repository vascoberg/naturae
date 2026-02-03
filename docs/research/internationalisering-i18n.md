# Internationalisering (i18n) - Onderzoek

*Onderzoeksnotities - januari 2026*

Dit document beschrijft de aanpak voor meertaligheid in Naturae.

---

## Status: Onderzoek

**Prioriteit:** Medium
**Geschatte implementatie:** 16-24 uur voor volledige app

---

## 1. Aanbevolen Aanpak: URL-based Routing

### Waarom URL-based?

| Voordeel | Uitleg |
|----------|--------|
| **SEO** | Zoekmachines indexeren elke taalversie apart |
| **Deelbaarheid** | Links zijn taalspecifiek (`/nl/decks/...` vs `/en/decks/...`) |
| **Bookmarks** | Gebruikers kunnen taalspecifieke pagina's bookmarken |
| **Geen cookies nodig** | Werkt zonder tracking, privacy-vriendelijk |

### URL Structuur

```
naturae.app/nl/decks/123        → Nederlandse versie
naturae.app/en/decks/123        → Engelse versie
naturae.app/decks/123           → Redirect naar browser-taal of default (nl)
```

---

## 2. Aanbevolen Library: next-intl

**Waarom next-intl?**
- Gebouwd voor Next.js App Router
- Actief onderhouden (23K+ GitHub stars)
- Type-safe met TypeScript
- Ondersteunt React Server Components
- Middleware voor automatische taaldetectie

**Installatie:**
```bash
npm install next-intl
```

**Documentatie:** https://next-intl-docs.vercel.app/

---

## 3. Implementatie Overzicht

### 3.1 Folder Structuur

```
src/
├── app/
│   └── [locale]/                    # Dynamic segment voor taal
│       ├── layout.tsx               # Root layout met locale
│       ├── page.tsx                 # Landing page
│       ├── (auth)/
│       │   ├── login/page.tsx
│       │   └── signup/page.tsx
│       ├── (main)/
│       │   ├── dashboard/page.tsx
│       │   ├── decks/[id]/page.tsx
│       │   └── study/[deckId]/page.tsx
│       └── (public)/
│           ├── discover/page.tsx
│           └── decks/[id]/page.tsx
├── i18n/
│   ├── request.ts                   # Server-side locale config
│   └── routing.ts                   # Routing config
├── messages/
│   ├── nl.json                      # Nederlandse vertalingen
│   └── en.json                      # Engelse vertalingen
└── middleware.ts                    # Taaldetectie & redirects
```

### 3.2 Middleware Setup

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match alle paths behalve API routes, static files, etc.
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
```

### 3.3 Routing Configuratie

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['nl', 'en'],
  defaultLocale: 'nl',
  localePrefix: 'as-needed' // Alleen prefix voor niet-default taal
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

**`localePrefix` opties:**

| Optie | Gedrag | Voorbeeld |
|-------|--------|-----------|
| `'always'` | Altijd prefix | `/nl/decks`, `/en/decks` |
| `'as-needed'` | Alleen voor niet-default | `/decks` (nl), `/en/decks` |
| `'never'` | Nooit prefix, alleen cookie | `/decks` (taal in cookie) |

**Aanbeveling voor Naturae:** `'as-needed'` - Nederlandse gebruikers zien geen `/nl/` prefix, maar Engelse links werken wel.

### 3.4 Vertaalbestanden

```json
// messages/nl.json
{
  "common": {
    "loading": "Laden...",
    "error": "Er ging iets mis",
    "save": "Opslaan",
    "cancel": "Annuleren",
    "delete": "Verwijderen"
  },
  "nav": {
    "home": "Home",
    "discover": "Ontdek",
    "myDecks": "Mijn Leersets",
    "settings": "Instellingen",
    "login": "Inloggen",
    "signup": "Account aanmaken",
    "logout": "Uitloggen"
  },
  "landing": {
    "hero": {
      "title": "Leer soorten herkennen",
      "subtitle": "met flashcards van de community"
    },
    "popularDecks": "Populaire leersets",
    "viewAll": "Bekijk alle leersets"
  },
  "deck": {
    "cards": "{count, plural, =0 {Geen kaarten} =1 {1 kaart} other {# kaarten}}",
    "startLearning": "Start met leren",
    "edit": "Bewerken",
    "public": "Openbaar",
    "private": "Privé"
  },
  "study": {
    "modes": {
      "flashcards": "Flashcards",
      "quiz": "Quiz",
      "order": "Op volgorde",
      "shuffle": "Willekeurig",
      "smart": "Slim leren",
      "publicPhotos": "Openbare foto's"
    },
    "progress": "{current} van {total}",
    "completed": "Sessie voltooid!",
    "score": "Score: {score}%"
  },
  "auth": {
    "email": "E-mailadres",
    "password": "Wachtwoord",
    "login": "Inloggen",
    "signup": "Account aanmaken",
    "forgotPassword": "Wachtwoord vergeten?",
    "noAccount": "Nog geen account?",
    "hasAccount": "Al een account?"
  }
}
```

```json
// messages/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "nav": {
    "home": "Home",
    "discover": "Discover",
    "myDecks": "My Decks",
    "settings": "Settings",
    "login": "Log in",
    "signup": "Sign up",
    "logout": "Log out"
  },
  "landing": {
    "hero": {
      "title": "Learn to identify species",
      "subtitle": "with community flashcards"
    },
    "popularDecks": "Popular decks",
    "viewAll": "View all decks"
  },
  "deck": {
    "cards": "{count, plural, =0 {No cards} =1 {1 card} other {# cards}}",
    "startLearning": "Start learning",
    "edit": "Edit",
    "public": "Public",
    "private": "Private"
  },
  "study": {
    "modes": {
      "flashcards": "Flashcards",
      "quiz": "Quiz",
      "order": "In order",
      "shuffle": "Shuffle",
      "smart": "Smart learning",
      "publicPhotos": "Public photos"
    },
    "progress": "{current} of {total}",
    "completed": "Session completed!",
    "score": "Score: {score}%"
  },
  "auth": {
    "email": "Email address",
    "password": "Password",
    "login": "Log in",
    "signup": "Sign up",
    "forgotPassword": "Forgot password?",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?"
  }
}
```

### 3.5 Gebruik in Componenten

**Server Components:**

```tsx
// src/app/[locale]/page.tsx
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'landing' });
  return {
    title: t('hero.title'),
  };
}

export default function HomePage() {
  const t = useTranslations('landing');

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
}
```

**Client Components:**

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function DeckCard({ deck }) {
  const t = useTranslations('deck');

  return (
    <div>
      <h2>{deck.title}</h2>
      <p>{t('cards', { count: deck.card_count })}</p>
      <button>{t('startLearning')}</button>
    </div>
  );
}
```

### 3.6 Taalwisselaar Component

```tsx
// src/components/language-switcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

const locales = [
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      {locales.map((loc) => (
        <option key={loc.code} value={loc.code}>
          {loc.flag} {loc.label}
        </option>
      ))}
    </select>
  );
}
```

---

## 4. Bestaande Meertalige Data

Naturae heeft al meertalige ondersteuning op data-niveau:

### 4.1 Tags

```typescript
// tags.names is al meertalig
{
  "slug": "birds",
  "names": {
    "nl": "Vogels",
    "en": "Birds"
  }
}
```

**Gebruik:**
```tsx
const tagName = tag.names[locale] || tag.names['nl'];
```

### 4.2 Species (via GBIF)

```typescript
// species.common_names bevat namen per taal
{
  "gbif_key": 2480528,
  "canonical_name": "Rana temporaria",
  "common_names": {
    "nl": "Bruine kikker",
    "en": "Common Frog",
    "de": "Grasfrosch"
  }
}
```

**Gebruik:**
```tsx
const speciesName = species.common_names?.[locale]
  || species.common_names?.['nl']
  || species.canonical_name;
```

---

## 5. Wat Moet Vertaald Worden?

### Prioriteit Hoog (UI essentials)

| Categorie | Voorbeelden | ~Aantal keys |
|-----------|-------------|--------------|
| Navigatie | Menu items, links | 10-15 |
| Knoppen | Save, Cancel, Delete, Start | 20-30 |
| Formulieren | Labels, placeholders, errors | 30-40 |
| Study modus | Modes, progress, feedback | 20-30 |

### Prioriteit Medium

| Categorie | Voorbeelden | ~Aantal keys |
|-----------|-------------|--------------|
| Foutmeldingen | Validatie, API errors | 20-30 |
| Lege states | "Geen resultaten", "Geen decks" | 10-15 |
| Metadata | Page titles, descriptions | 10-15 |
| Tooltips/Help | Uitleg teksten | 10-20 |

### Niet Vertalen (User Content)

- Deck titels en beschrijvingen
- Kaart teksten (front_text, back_text)
- Gebruikersnamen, bio's

---

## 6. Migratie Strategie

### Fase 1: Setup (2-4 uur)

1. Installeer next-intl
2. Configureer middleware
3. Maak folder structuur aan (`[locale]/`)
4. Maak initiële vertaalbestanden

### Fase 2: Core Pages (4-6 uur)

1. Landing page
2. Login/Signup
3. Navigation component
4. Taalwisselaar

### Fase 3: Main Features (6-8 uur)

1. Deck pages
2. Study session
3. Discover page
4. Settings

### Fase 4: Polish (4-6 uur)

1. Error messages
2. Empty states
3. Metadata/SEO
4. Testen

---

## 7. Technische Overwegingen

### Supabase Auth Redirects

Supabase auth redirect URLs moeten beide talen ondersteunen:

```
# Supabase Dashboard > Authentication > URL Configuration
Site URL: https://naturae.app
Redirect URLs:
- https://naturae.app/**
- https://naturae.app/nl/**
- https://naturae.app/en/**
```

### Sitemap Generatie

```typescript
// src/app/sitemap.ts
import { routing } from '@/i18n/routing';

export default async function sitemap() {
  const pages = ['/decks', '/discover'];

  return routing.locales.flatMap((locale) =>
    pages.map((page) => ({
      url: `https://naturae.app/${locale}${page}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `https://naturae.app/${l}${page}`])
        ),
      },
    }))
  );
}
```

### SEO: hreflang Tags

next-intl genereert automatisch `<link rel="alternate" hreflang="...">` tags voor elke taalversie.

---

## 8. Alternatieven Overwogen

| Library | Voordelen | Nadelen |
|---------|-----------|---------|
| **next-intl** | App Router native, type-safe | Nieuwer, kleinere community |
| **react-i18next** | Grootste community, flexibel | Meer config, minder App Router focus |
| **Paraglide** | Compile-time, zeer snel | Minder bekend, andere aanpak |
| **Handmatig** | Geen dependencies | Veel boilerplate, geen features |

**Conclusie:** next-intl is de beste keuze voor Naturae's Next.js App Router setup.

---

## 9. Toekomstige Uitbreidingen

### Meer Talen

Toevoegen van extra talen is simpel:

1. Voeg locale toe aan `routing.ts`: `locales: ['nl', 'en', 'de']`
2. Maak vertaalbestand: `messages/de.json`
3. Update taalwisselaar

### Potentiële Talen voor Naturae

| Taal | Reden | Prioriteit |
|------|-------|------------|
| Duits | Grote natuurgemeenschap | Medium |
| Frans | België, Frankrijk | Laag |
| Spaans | Grote taal | Laag |

### Community Vertalingen

Optie voor later: community-bijdragen aan vertalingen via:
- Crowdin
- Weblate
- GitHub PR's met vertaalbestanden

---

## 10. Globale Visie & Waarom i18n

### Platform is Inherent Internationaal

Naturae kan wereldwijd gebruikt worden omdat:

1. **GBIF API** - Biedt toegang tot soorten van over de hele wereld
2. **Xeno-canto API** - Vogelgeluiden uit alle landen
3. **Tagging systeem** - Gebruikers kunnen al filteren op land, werelddeel of regio
4. **User-generated content** - Leersets in elke taal mogelijk

De technische basis voor internationaal gebruik is er al. Alleen de UI is nog Nederlands-only.

### Ontdekken van Leersets

Bij internationalisering moet het ontdekken van leersets intuïtief blijven:

- **Taalfilter op /discover** - Leersets per taal tonen
- **Regio tags prominent** - "Europe", "North America", etc.
- **Automatische detectie** - Browser-taal → relevante content eerst tonen
- **Crossover mogelijk** - Een Duitser kan ook Nederlandse vogelsets gebruiken (Latijnse namen zijn universeel)

---

## 11. Internationale Launch Strategie

### Anders dan Soft Launch

De Nederlandse soft launch ging via LinkedIn (persoonlijk netwerk, KNNV, natuurgemeenschap). Voor internationaal is een andere aanpak nodig.

### Reddit als Launch Kanaal

**Waarom Reddit:**
- r/ecology, r/biology, r/naturalists hebben veel verkeer
- Internationale community van natuurliefhebbers
- Techsavvy gebruikers die nieuwe tools proberen
- Oprechte feedback cultuur

**Potentiële Subreddits (geverifieerd februari 2026):**

| Subreddit | Members | Focus | Relevantie |
|-----------|---------|-------|------------|
| [r/birding](https://reddit.com/r/birding) | **681k** | Birdwatching, foto's | Hoog - grootste natuur-community |
| [r/plants](https://reddit.com/r/plants) | **502k** | Algemeen planten | Medium |
| [r/ecology](https://reddit.com/r/ecology) | **200k+** | Ecologie breed | Hoog - doelgroep |
| [r/botany](https://reddit.com/r/botany) | **200k+** | Plantenkunde | Hoog |
| [r/naturalists](https://reddit.com/r/naturalists) | **50k+** | Natuurliefhebbers | Hoog - perfecte fit |
| [r/whatsthisbird](https://reddit.com/r/whatsthisbird) | **44k** | Vogelidentificatie | Medium |
| [r/wildlifebiology](https://reddit.com/r/wildlifebiology) | **~30k** | Wildlife professionals | Hoog |
| [r/FieldBiology](https://reddit.com/r/FieldBiology) | **~20k** | Veldwerk | Hoog |
| [r/Ornithology](https://reddit.com/r/Ornithology) | **14k** | Vogelwetenschap | Hoog (maar strenge regels) |

**Let op:** r/biology (3M+) is te breed en generiek voor effectieve promotie.

### Reddit Regels & Strategie

**Belangrijke regels om te weten:**

| Regel | Wat het betekent |
|-------|------------------|
| **10% regel** | Max 10% van je Reddit-activiteit mag promotioneel zijn |
| **9:1 ratio** | 9 waardevolle comments voor elke promotionele post |
| **Karma vereiste** | Veel subreddits vereisen 30-50+ karma voordat je mag posten |
| **Cross-posting** | Niet tegelijk naar meerdere subs posten → spam detectie |
| **Sidebar lezen** | Elke subreddit heeft eigen regels |

**Huidige situatie:** Nog nooit op Reddit gepost of gecomment. Dit betekent:
- 0 karma → posts worden mogelijk automatisch geblokkeerd
- Geen track record → moderators zijn wantrouwiger

**Voorbereiding nodig (2-4 weken voor launch):**
1. Account aanmaken (indien nog niet gedaan)
2. Lid worden van relevante subreddits
3. Regelmatig nuttige comments plaatsen (niet promotioneel)
4. Doel: 50+ karma opbouwen
5. Dan pas eerste promotionele post

### Gefaseerde Posting Strategie

**Waarom niet overal tegelijk posten:**
- Veel overlap in gebruikers tussen natuur-subreddits
- Reddit's spam detectie triggert bij cross-posting
- Moderators van natuur-subs praten met elkaar
- Dezelfde post 3x zien → spam-gevoel bij users

**Aanbevolen aanpak:**

```
Week 1:  r/ecology
         → Breed publiek, laagdrempelig
         → Verzamel feedback, beantwoord ALLE comments

Week 2:  r/birding
         → Grootste community, vogelfocus
         → Pas post aan op basis van week 1 feedback

Week 3:  r/botany OF r/naturalists
         → Kies op basis van welke content je hebt

Week 4+: Kleinere niche communities
         → r/FieldBiology, r/wildlifebiology
         → r/Ornithology (strenge regels, lees sidebar!)
```

**Per post:**
- Wacht 2-3 weken tussen posts in zelfde subreddit
- Pas titel/content aan per community (r/birding wil foto's, r/botany wil details)
- Reageer actief op ELKE comment - dit bouwt goodwill

### Post Template (Concept)

```
Title: I built a free species learning platform with GBIF & Xeno-canto integration - feedback welcome!

Hey [subreddit],

I'm an ecologist from the Netherlands, and I got frustrated that no app
combines species learning with proper nature data sources. Quizlet has
no GBIF integration. Merlin/iNaturalist are great for ID but not for
learning. BirdID only does birds.

So I built Naturae (naturae.app) - a flashcard/quiz platform specifically
for learning species identification.

What makes it different:
- GBIF integration: Add species with verified photos + automatic attribution
- Xeno-canto: Learn bird songs with real recordings
- Photo annotations: Mark distinguishing features on images
- Quiz mode with taxonomically-smart distractors (related species as wrong answers)
- All taxon groups: birds, plants, insects, mammals, fungi...

The platform is free and I just added English (+ other languages).
I'm not 100% sure if the translations make sense everywhere -
I'd love feedback from native speakers!

You can:
- Browse existing learning sets on /discover
- Create your own sets (account required)
- Study with flashcards or quiz mode

Happy to answer questions or hear feedback. This is a passion project
born from my own frustration, and I want it to be useful for the community.

[Link to naturae.app]
```

**Sterke punten van dit verhaal:**
- "Ecologist" geeft credibiliteit in de doelgroep
- "Frustration" is relatable - mensen herkennen het probleem
- Concrete vergelijking met bekende apps (Quizlet, Merlin, BirdID)
- Gap in de markt wordt duidelijk
- Authentiek, niet commercieel

### Eerlijkheid over Vertalingen

Belangrijk punt: transparant zijn dat vertalingen mogelijk niet perfect zijn.

- Vertalingen worden initieel via i18n library gegenereerd
- Native speakers kunnen feedback geven
- Community contributions welkom (via GitHub of feedback form)
- Toont authenticiteit en uitnodiging tot meehelpen

### Timing & Voorbereiding

**Fase 0: Reddit Account Opbouwen (2-4 weken)**
- [ ] Reddit account aanmaken
- [ ] Lid worden van r/ecology, r/birding, r/botany, r/naturalists
- [ ] Dagelijks 1-2 nuttige comments plaatsen (niet promotioneel)
- [ ] Doel: 50+ karma bereiken
- [ ] Sidebar regels lezen van target subreddits

**Fase 1: i18n Implementatie**
- Engels als tweede taal toevoegen
- Testen met kleine groep (Rosanne's contacten?)

**Fase 2: Launch Posts (gefaseerd)**
- Week 1: r/ecology
- Week 2: r/birding
- Week 3+: Overige subreddits

**Fase 3: Follow-up**
- Actief reageren op ALLE comments
- Bug reports snel fixen
- Feedback verwerken

### Succes Metrics

| Metric | Doel eerste maand |
|--------|-------------------|
| Signups uit Reddit | 50-100 |
| Nieuwe publieke decks | 10-20 |
| Bug reports / feedback | Actief verzamelen |
| Upvotes op post | N/A (niet primair doel) |

---

## 12. Bronnen

### Technisch
- [next-intl Documentatie](https://next-intl-docs.vercel.app/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/) (voor plurals, etc.)

### Reddit Marketing
- [Reddit Spam Rules](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam)
- [How to Promote on Reddit Without Getting Banned](https://vyper.ai/blog/promote-on-reddit/)
- [Reddit Self-Promotion Guide](https://www.growandconvert.com/marketing/reddit-marketing/)
- [r/birding Stats](https://gummysearch.com/r/birding/) - 681k members

### Gerelateerde Documentatie

| Document | Relatie |
|----------|---------|
| [Business Model - Marktanalyse](../operations/business-model.md#marktanalyse-tamsomsom) | Europese SAM/SOM cijfers |
| [Organization Pages](../features/organization-pages.md) | B2B strategie voor EU markt |
| [Backlog](../backlog.md) | i18n als backlog item |

---

*Laatste update: 3 februari 2026*
