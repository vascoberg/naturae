# Naturae - Lean Startup MVP Design Document

## Project Overview
Een platform waar natuurliefhebbers flashcard sets kunnen maken en delen om soortherkenning te leren. Begint met een minimale implementatie voor het testen van kernhypotheses.

## Vision
Natuurkennis toegankelijk maken voor iedereen door moderne leertechnologie te combineren met de passie van natuurliefhebbers.

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

## Development Roadmap

### Sprint 1: Absolute MVP (Week 1-2)
**Doel**: Test Value Hypothesis - willen mensen flashcards voor natuurstudie gebruiken?

**Features:**
- Email/password authenticatie (Supabase)
- Één voorgebouwde leerset: "Nederlandse Amfibieën" (16 soorten)
- Flashcard interface:
  - Foto op voorkant
  - Nederlandse naam op achterkant
  - Swipe links (ken ik niet) / rechts (ken ik wel)
- Basis spaced repetition:
  - "Ken ik niet" → kaart komt direct terug
  - "Ken ik wel" → kaart komt later terug (na 1, 3, 7, 14 dagen)
- Simpel voortgangsdashboard

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
- Next.js + TypeScript
- Supabase (auth + database)
- Vercel (hosting)
- PWA setup voor mobile

---

### Sprint 2: User Generated Content (Week 3-4)
**Voorwaarde**: Value hypothesis gevalideerd (mensen gebruiken de app)
**Doel**: Test of gebruikers eigen content willen maken

**Features:**
- "Maak eigen leerset" functionaliteit:
  - Titel + beschrijving
  - Upload foto's (max 20 kaarten voor MVP)
  - Voor/achterkant tekst invullen
  - Basis categorisatie (bijv. "Vogels", "Planten", "Insecten")
- "Mijn leersets" overzicht
- Leersets zijn standaard privé

**Metrics:**
- % gebruikers dat een leerset aanmaakt
- Gemiddeld aantal kaarten per set
- % gebruikers dat terugkomt om eigen set te oefenen
- Tijd besteed aan set maken vs. oefenen

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
- Deel-functionaliteit (unieke link)
- "Ontdek" pagina met publieke sets
- Simpel ster-systeem
- "Kopieer naar mijn collectie" functie

**Metrics:**
- Share rate (% gebruikers dat deelt)
- Viral coefficient (nieuwe users per share)
- Click-to-signup conversion van deel-links
- % publieke vs privé sets

**Success criteria:**
- >15% gebruikers deelt een set
- Viral coefficient >0.5 (op weg naar 1.0)
- >20% signup conversion van links

---

### Sprint 4: Engagement & Retention (Week 7-8)
**Voorwaarde**: Basis sharing werkt
**Doel**: Verhoog engagement en retention

**Features:**
- Uitgebreide spaced repetition settings
- Meerdere foto's per soort
- Geluid toevoegen (optioneel)
- Basis notificaties/reminders
- Persoonlijke statistieken

**Metrics:**
- Verbetering in retention rates
- Toename in sessie frequentie
- Feature adoption rates

---

## Toekomstige Features (Post-MVP)

### Premium Features (Freemium model)
- AI-gestuurde leermodules
- Geavanceerde quiz modi
- Offline synchronisatie
- Certificaten/badges
- Expert-geverifieerde sets

### Community Features
- Comments op sets
- Gebruikersprofielen
- Volg systeem
- Challenges/competities

## Technische Architectuur

### Frontend
- Next.js 14+ met App Router
- TypeScript
- Tailwind CSS
- PWA configuratie
- Swipe gestures library

### Backend
- Supabase:
  - Authentication
  - PostgreSQL database
  - File storage (foto's)
  - Row Level Security
- Resend voor transactional emails

### Database Schema (MVP)
```sql
-- Users (managed by Supabase Auth)

-- Leersets
CREATE TABLE decks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Kaarten
CREATE TABLE cards (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES decks ON DELETE CASCADE,
  front_image_url TEXT,
  front_text TEXT,
  back_text TEXT,
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Voortgang
CREATE TABLE user_progress (
  user_id UUID REFERENCES auth.users,
  card_id UUID REFERENCES cards,
  last_seen TIMESTAMP,
  next_review TIMESTAMP,
  difficulty_rating INTEGER, -- 1-5, voor spaced repetition
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, card_id)
);
```

### Deployment
- GitHub repository
- Vercel voor hosting (automatic deploys)
- Supabase project
- Custom domain setup

## Metrics Dashboard

Voor elke sprint een dashboard met:
- Cohort retention curves
- Feature adoption funnels
- User journey analytics
- A/B test resultaten

## Risk Mitigation

### Technische risico's
- PWA limitaties op iOS → Test vroeg op iPhone
- Foto upload/storage kosten → Limiet op uploads in MVP

### Business risico's
- Lage retention → Focus op kern leerervaring
- Geen viral growth → Partner met natuurorganisaties

## Go/No-Go Beslismomenten

Na elke sprint:
1. Zijn de success criteria gehaald?
2. Wat hebben we geleerd?
3. Pivot, persevere of stop?

**Runway**: 4-6 maanden bij current burn rate
**Pivots beschikbaar**: ~3 (elke 6-8 weken)

---

*Dit document wordt bijgewerkt na elke sprint met learnings en aanpassingen.*
