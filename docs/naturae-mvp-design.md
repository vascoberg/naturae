# Naturae - Lean Startup MVP Design Document

## Project Overview
Een platform waar natuurliefhebbers flashcard sets kunnen maken en delen om soortherkenning te leren. Begint met een minimale implementatie voor het testen van kernhypotheses.

## Vision
Natuurkennis toegankelijk maken voor iedereen door moderne leertechnologie te combineren met de passie van natuurliefhebbers.

## Inspiratie: BirdID
De BirdID app van Nord University dient als belangrijke inspiratiebron. Zie [docs/Reference/](Reference/) voor screenshots en analyse.

**Belangrijkste lessen van BirdID:**
- Rijke species informatie (foto's, geluid, beschrijvingen, feiten)
- Multiple choice quiz modus naast flashcards
- Configureerbare sessies (aantal vragen, tijdslimiet, moeilijkheidsgraad)
- Geografische filtering (alleen soorten uit jouw regio)
- Link naar "Species Book" vanuit quiz vragen

**Wat we overnemen voor Naturae (gefaseerd):**
- MVP: Basis flashcards met foto + tekst + audio
- Later: Species Book, quiz modus, rijke metadata

---

## Hypotheses

### 1. Value Hypothesis
**"Natuurliefhebbers hebben behoefte aan een moderne, makkelijk te gebruiken tool om soortherkenning te leren"**

**Te testen via:**
- Gebruiken mensen de flashcard functionaliteit regelmatig?
- Komen ze terug na eerste gebruik?
- Voltooien ze leersets?

### 2. Growth Hypothesis
**"Gebruikers zullen de app aanraden aan anderen in hun netwerk omdat het delen van eigen gemaakte leersets waardevol is voor hun community"**

**Te testen via:**
- Maken gebruikers eigen leersets?
- Delen ze deze sets met anderen?
- Brengen gedeelde links nieuwe gebruikers?

---

## Development Roadmap

### Sprint 1: Absolute MVP (Week 1-2)
**Doel**: Test Value Hypothesis - willen mensen flashcards voor natuurstudie gebruiken?

**Features:**
- Email/password authenticatie (Supabase)
- Username kiezen tijdens onboarding
- Twee voorgebouwde leersets:
  - "Nederlandse Amfibieën" (16 soorten, foto's + geluiden)
  - "Nederlandse Sprinkhanen" (48 soorten, foto's + geluiden)
- Flashcard interface:
  - Foto/audio op voorkant
  - Nederlandse naam op achterkant
  - Drie knoppen: "Ken ik niet" / "Twijfel" / "Ken ik"
- Basis spaced repetition:
  - "Ken ik niet" → kaart komt direct terug
  - "Twijfel" → kaart komt na 1 dag terug
  - "Ken ik" → kaart komt later terug (1, 3, 7, 14 dagen)
- Simpel voortgangsdashboard
- Inline audiospeler voor geluidskaarten

**Metrics:**
- Daily Active Users (DAU)
- Retention rate (dag 1, 7, 14)
- Gemiddelde sessieduur
- Completion rate van de leerset
- Aantal kaarten per sessie

**Success criteria:**
- 30% dag-7 retention
- Gemiddeld >10 kaarten per sessie
- 50% gebruikers voltooit hele set binnen 14 dagen

**Tech stack:**
- Next.js 14+ met App Router
- TypeScript
- Tailwind CSS
- Supabase (auth + database + storage)
- Vercel (hosting)
- PWA setup voor mobile

---

### Sprint 2: User Generated Content (Week 3-4)
**Voorwaarde**: Value hypothesis gevalideerd (mensen gebruiken de app)
**Doel**: Test of gebruikers eigen content willen maken

**Features:**
- "Maak eigen leerset" functionaliteit:
  - Titel + beschrijving
  - Upload foto's en audio
  - Voor/achterkant tekst invullen
  - Media attributie (fotograaf, bron, licentie)
- Tags toevoegen aan leersets (meertalig systeem):
  - Topic tags (vogels, planten, insecten)
  - Regio tags (Nederland, Europa)
  - Content-type tags (foto's, geluiden)
  - Taal tags (Nederlands, Engels)
- "Mijn leersets" overzicht
- Leersets zijn standaard privé

**Metrics:**
- % gebruikers dat een leerset aanmaakt
- Gemiddeld aantal kaarten per set
- % gebruikers dat terugkomt om eigen set te oefenen
- Tijd besteed aan set maken vs. oefenen
- Welke tags worden het meest gebruikt

**Success criteria:**
- >20% van actieve gebruikers maakt een set
- Gemiddeld >10 kaarten per set
- >50% oefent met eigen set na aanmaken

---

### Sprint 3: Sharing & Network Effects (Week 5-6)
**Voorwaarde**: Gebruikers maken eigen content
**Doel**: Test Growth Hypothesis - delen gebruikers sets?

**Features:**
- Publiek/privé toggle voor leersets
- Deel-functionaliteit (unieke link + share token voor private sharing)
- "Ontdek" pagina met publieke sets:
  - Filteren op tags
  - Zoeken op titel
  - Sorteren op populariteit/datum
- Simpel ster-systeem (1-5 rating)
- "Kopieer naar mijn collectie" functie

**Metrics:**
- Share rate (% gebruikers dat deelt)
- Viral coefficient (nieuwe users per share)
- Click-to-signup conversion van deel-links
- % publieke vs privé sets
- Meest gebruikte filter tags

**Success criteria:**
- >15% gebruikers deelt een set
- Viral coefficient >0.5 (op weg naar 1.0)
- >20% signup conversion van links

---

### Sprint 4: Engagement & Retention (Week 7-8)
**Voorwaarde**: Basis sharing werkt
**Doel**: Verhoog engagement en retention

**Features:**
- Uitgebreide spaced repetition (FSRS algoritme)
- Meerdere foto's per kaart
- Audio + foto combinaties
- Basis notificaties/reminders (PWA push)
- Persoonlijke statistieken dashboard
- Tag suggesties bij aanmaken leerset

**Metrics:**
- Verbetering in retention rates
- Toename in sessie frequentie
- Feature adoption rates

---

## Leermodi Architectuur

> Een deck ondersteunt meerdere manieren van leren. Voor MVP focussen we op één modus.

### Concept

Eén leerset (deck) kan op verschillende manieren worden geoefend:

| Modus | Beschrijving | MVP | Later |
|-------|--------------|-----|-------|
| **Flashcards** | Self-grading met "Ken ik niet" / "Twijfel" / "Ken ik" | ✅ | - |
| **Quiz** | Multiple choice, systeem beoordeelt | ❌ | v2 |
| **Typing** | Typ het antwoord, systeem controleert | ❌ | v3+ |

### MVP: Alleen Flashcards

Voor MVP implementeren we uitsluitend de flashcard modus:
- Gebruiker ziet vraag (foto/audio)
- Gebruiker bedenkt antwoord
- Gebruiker draait kaart om
- Gebruiker beoordeelt zichzelf (3 knoppen)
- Spaced repetition bepaalt wanneer kaart terugkomt

### Later: Quiz Modus

Zie [Quiz Modus (v2)](#quiz-modus-v2) hieronder voor de geplande uitbreiding.

---

## Toekomstige Features (Post-MVP)

### Species Book (v2)
> Database infrastructuur is voorbereid, maar UI wordt later gebouwd.

- Gedeelde species database (wetenschappelijke naam als identifier)
- Rijke informatie per soort:
  - Meerdere foto's met annotaties
  - Geluidsfragmenten
  - Beschrijvingen (uiterlijk, geluid, gedrag)
  - Feiten (afmetingen, gewicht)
  - Externe links (waarneming.nl, xeno-canto)
- Cards kunnen linken naar species
- "Bekijk in Species Book" knop vanuit flashcard

### Quiz Modus (v2)
> Geïnspireerd door BirdID

- Multiple choice vragen
- Configureerbare sessies:
  - Aantal vragen (10, 30, 60)
  - Tijdslimiet per vraag (unlimited, 30 sec)
  - Moeilijkheidsgraad (level 1-4)
- Geografische filtering
- Systeem beoordeelt antwoorden (i.p.v. self-grading)

### Premium Features (Freemium model)
- AI-gestuurde leermodules
- Geavanceerde quiz modi
- Offline synchronisatie
- Certificaten/badges
- Expert-geverifieerde sets

### Community Features
- Comments op sets
- Uitgebreide gebruikersprofielen
- Volg systeem
- Challenges/competities
- Vergelijkbare soorten ("Similar Species" zoals BirdID)

---

## Technische Architectuur

### Frontend
- Next.js 14+ met App Router
- TypeScript
- Tailwind CSS
- PWA configuratie
- Swipe gestures library (optioneel)

### Backend
- Supabase:
  - Authentication (email/password)
  - PostgreSQL database
  - File storage (foto's, audio)
  - Row Level Security
- Resend voor transactional emails

### Database Schema
Zie [docs/database-architecture.md](database-architecture.md) voor het complete schema.

**MVP tabellen:**
- `profiles` - Gebruikersprofielen met username
- `decks` - Leersets
- `cards` - Flashcards (met optionele `species_id` voor toekomst)
- `card_media` - Foto's en audio met attributie
- `user_progress` - Leervoortgang en spaced repetition state
- `tags` - Meertalige labels
- `deck_tags` - Koppeling decks ↔ tags

**Voorbereid voor later:**
- `species` - Soorten database (schema klaar, UI later)
- `deck_stars` - Ratings (Sprint 3)
- `tag_suggestions` - Smart tagging (Sprint 4+)

### Deployment
- GitHub repository
- Vercel voor hosting (automatic deploys)
- Supabase project
- Custom domain setup

---

## Startcontent

Voor Sprint 1 maken we twee voorgebouwde leersets:

### 1. Nederlandse Amfibieën
- 16 soorten
- Foto's (met attributie)
- Geluiden (met attributie)
- Bron: eigen materiaal + waarneming.nl + xeno-canto

### 2. Nederlandse Sprinkhanen
- 48 soorten
- Foto's (met attributie)
- Geluiden (bestaande Spotify collectie omzetten)
- Bron: eigen materiaal

### Toekomstig: Trekvogels
- Geluiden + foto's
- Bestaande lokale afspeellijst beschikbaar

---

## Metrics Dashboard

Voor elke sprint een dashboard met:
- Cohort retention curves
- Feature adoption funnels
- User journey analytics
- Tag usage analytics
- A/B test resultaten

---

## Risk Mitigation

### Technische risico's
- PWA limitaties op iOS → Test vroeg op iPhone
- Foto upload/storage kosten → Monitor gebruik, client-side resize, optimaliseer afbeeldingsformaat
- Audio formaat compatibiliteit → Test MP3/WebM across browsers

### Business risico's
- Lage retention → Focus op kern leerervaring
- Geen viral growth → Partner met natuurorganisaties
- Te complex → Start simpel, voeg features toe op basis van feedback

### Content risico's
- Auteursrechten → Zorgvuldige attributie, focus op CC-licenties
- Incorrecte soortinformatie → Later: curator/verificatie systeem

---

## Go/No-Go Beslismomenten

Na elke sprint:
1. Zijn de success criteria gehaald?
2. Wat hebben we geleerd?
3. Pivot, persevere of stop?

**Runway**: 4-6 maanden bij current burn rate
**Pivots beschikbaar**: ~3 (elke 6-8 weken)

---

## Gerelateerde Documentatie

- [Database Architectuur](database-architecture.md) - Volledige schema, RLS policies, storage
- [Data Flow Architectuur](data-flow-architecture.md) - API patterns, auth flow, caching
- [Design Systeem](design-system.md) - Components, tokens, UI patterns

---

*Dit document wordt bijgewerkt na elke sprint met learnings en aanpassingen.*
