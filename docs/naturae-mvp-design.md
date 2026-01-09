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

### Sprint 1: Absolute MVP (Week 1-2) ✅ AFGEROND
**Doel**: Test Value Hypothesis - willen mensen flashcards voor natuurstudie gebruiken?

**Features:**
- Email/password authenticatie (Supabase) ✅
- Username kiezen tijdens onboarding ✅
- Twee voorgebouwde leersets:
  - "Nederlandse Amfibieën" (16 soorten, foto's + geluiden) ⏳ Content nog toe te voegen
  - "Nederlandse Sprinkhanen" (48 soorten, foto's + geluiden) ⏳ Content nog toe te voegen
- Flashcard interface: ✅
  - Foto/audio op voorkant
  - Nederlandse naam op achterkant
  - Drie knoppen: "Opnieuw" / "Moeilijk" / "Goed"
- FSRS spaced repetition algoritme (ts-fsrs): ✅
  - "Opnieuw" → kaart komt direct terug in sessie
  - "Moeilijk" → kort interval
  - "Goed" → optimaal interval (FSRS berekend)
  - Intervallen worden dynamisch berekend op basis van geheugensterkte
  - Je kunt altijd oefenen, ongeacht de geplande review datum
- Simpel voortgangsdashboard ✅
- Inline audiospeler voor geluidskaarten ✅

**Geïmplementeerde technische details:**
- FSRS via `ts-fsrs` library met standaard parameters
- Keyboard shortcuts: Spatie/Enter om te flippen, 1/2/3 voor rating
- Sessie statistieken (bekeken, correct, opnieuw)
- Kaarten sortering: due cards eerst, dan nieuwe, dan op positie

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
- Next.js 16+ met App Router ✅
- TypeScript ✅
- Tailwind CSS v4 ✅
- Supabase (auth + database + storage) ✅
- Vercel (hosting) ⏳ Geconfigureerd, deployment debugging later
- PWA setup voor mobile ✅

---

### Sprint 2: User Generated Content (Week 3-4)
**Voorwaarde**: Value hypothesis gevalideerd (mensen gebruiken de app)
**Doel**: Test of gebruikers eigen content willen maken

**Features:**
- "Maak eigen leerset" functionaliteit:
  - Titel + beschrijving
  - Upload foto's en audio
  - Voor/achterkant tekst invullen
  - Media attributie (bronvermelding als één veld)
- **Bulk Import functionaliteit:**
  - Drag & drop meerdere audiobestanden (MP3, WAV)
  - Automatische metadata extractie uit bestandsnamen:
    - Naamconventie: `{nummer}. {groep} - {subgroep} - {naam} - {wetenschappelijke naam}.mp3`
  - ID3 tag parsing voor rijke metadata:
    - Auteur (TPE1), Copyright (WCOP), Bron URL (WOAF)
    - Embedded afbeeldingen (APIC tag) automatisch extracten
    - XC-referenties en locatiedata uit comments
  - Preview van te importeren kaarten
  - Deck titel en beschrijving instellen
  - Eén-klik import naar nieuwe leerset
- **WYSIWYG kaart bewerken:**
  - Bewerk-interface toont kaart zoals in leermodus
  - Direct visuele feedback bij aanpassingen
  - Media preview op voor- en/of achterkant zichtbaar
- **Media beheer:**
  - Bronvermelding achteraf bewerken
  - Positie wijzigen (voorkant/achterkant/beide)
  - Media vervangen zonder verwijderen
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

### Sprint 3: Sharing & Network Effects (Week 5-6) ✅ AFGEROND
**Voorwaarde**: Gebruikers maken eigen content
**Doel**: Test Growth Hypothesis - delen gebruikers sets?

**Features:**
- Publiek/privé toggle voor leersets ✅
- "Ontdek" pagina met publieke sets: ✅
  - Filteren op tags ✅
  - Zoeken op titel ✅
  - Sorteren op populariteit/datum ✅
- Hartjes systeem (like/unlike) ✅
- **Gastgebruik zonder account:** ✅
  - Publieke decks bekijken en leren via directe link ✅
  - Sessie voortgang in browser (verloren bij sluiten) ✅
  - "Probeer zonder account" knop op publieke deck pagina ✅
- **JSON Export:** ✅
  - Exporteer leerset als JSON (metadata + kaarten + media info) ✅
  - Data ownership: gebruikers kunnen hun data downloaden ✅
- **Landing page voor gasten:** ✅
  - Publieke homepage met populaire leersets ✅
  - Thumbnails tonen op deck cards ✅
  - Zoekbalk naar discover pagina ✅
  - Header/footer met navigatie ✅
- **WYSIWYG kaart editor:** ✅
  - Side-by-side layout (voorkant links, achterkant rechts) ✅
  - Media upload, vervangen en verwijderen ✅
  - Attribution bewerken ✅
  - Responsive: gestapeld op mobiel ✅
- **Verbeterde instellingen pagina:** ✅
  - Profielfoto uploaden/wijzigen ✅
  - Bio/beschrijving toevoegen ✅
  - Wachtwoord wijzigen ✅

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

**Verplaatst naar MVP+:**
- Deel-functionaliteit (share token voor private sharing)
- Clone/Remix deck functie
- ZIP export met media bestanden

---

## Leermodi Architectuur

> Een deck ondersteunt meerdere manieren van leren en verschillende sessie-modi.

### Concept

Eén leerset (deck) kan op verschillende manieren worden geoefend:

| Modus | Beschrijving | MVP | Later |
|-------|--------------|-----|-------|
| **Flashcards** | Self-grading met "Opnieuw" / "Moeilijk" / "Goed" (FSRS) | ✅ | - |
| **Quiz** | Multiple choice, systeem beoordeelt | ❌ | v2 |
| **Typing** | Typ het antwoord, systeem controleert | ❌ | v3+ |

### Sessie-modi (Kaart Volgorde)

Bij het starten van een leersessie kan de gebruiker kiezen hoe kaarten worden gepresenteerd:

| Sessie-modus | Beschrijving | MVP | Later |
|--------------|--------------|-----|-------|
| **Op volgorde** | Kaarten in de volgorde zoals ze in de deck staan | ✅ | - |
| **Shuffle** | Willekeurige volgorde, elke kaart 1x per sessie | ✅ | - |
| **Spaced Repetition** | FSRS algoritme bepaalt welke kaarten en wanneer | ✅ | - |

**MVP Implementatie:** ✅ GEÏMPLEMENTEERD
- Keuze-dialog vóór start sessie via "Start met leren" knop
- Geen default - gebruiker kiest altijd expliciet een modus
- Bij "Volgorde" en "Shuffle": alle kaarten in sessie, voortgang wordt NIET opgeslagen
- Bij "Slim leren": alleen due cards, voortgang wordt opgeslagen via FSRS
- Sessie stats (bekeken, correct, opnieuw) worden getoond na afloop

### Toekomstige Sessie-uitbreidingen (v2+)

**Sessie instellingen:**
- Aantal kaarten per sessie limiet (bijv. max 20 kaarten)
- Alleen nieuwe kaarten / alleen review / mix
- Timer per kaart (optioneel, voor snelheidstraining)

**Extra sessie-modi:**
- **Moeilijke kaarten** - Focus op kaarten met lage success rate
- **Omgekeerd** - Antwoord tonen, vraag raden (handig voor vogelgeluiden: geluid horen → naam raden vs. naam zien → geluid herkennen)
- **Alleen audio** - Geen tekst/afbeelding tonen, puur op gehoor

**Progress tracking per modus:**
- Aparte stats voor "ken ik op gehoor" vs "ken ik op beeld"

### MVP: Alleen Flashcards

Voor MVP implementeren we uitsluitend de flashcard modus:
- Gebruiker ziet vraag (foto/audio)
- Gebruiker bedenkt antwoord
- Gebruiker draait kaart om
- Gebruiker beoordeelt zichzelf (3 knoppen: Opnieuw/Moeilijk/Goed)
- FSRS algoritme bepaalt wanneer kaart terugkomt (bij Spaced Repetition modus)

### Later: Quiz Modus

Zie [Quiz Modus (v2)](#quiz-modus-v2) hieronder voor de geplande uitbreiding.

### Leerset Pagina UI (v2+)

> De leerset pagina moet intuïtief tonen welke leermodi beschikbaar zijn.

**Huidige MVP:** ✅ Deck pagina met "Start met leren" knop die modus-selectie dialog opent.

**Toekomstige UI-organisatie:**
- Duidelijke sectie voor leerset info (titel, beschrijving, statistieken)
- Visuele knoppen/kaarten per leermodus (Flashcards, Quiz, etc.)
- Elke modus toont eigen voortgang
- Bewerken-knop alleen zichtbaar voor eigenaar
- Consistente layout voor eigen én publieke leersets

---

## MVP+ Features (Toekomstig)

> Features die na de MVP core sprints geïmplementeerd kunnen worden.

### Engagement & Retention (voorheen Sprint 4)

- Voortgangstracking en statistieken dashboard
- Streak tracking
- Meerdere foto's per kaart
- Basis notificaties/reminders (PWA push)
- Tag suggesties bij aanmaken leerset
- **Leerinstellingen per leerset:**
  - Gebruiksvriendelijke UI bovenop FSRS algoritme
  - Intuïtieve slider/opties voor herhalingsintensiteit
  - Preset profielen: "Snel leren", "Op je gemak", "Examenvoorbereiding"

### Private Sharing & Remix

- **Deel-functionaliteit (share token):**
  - Private decks delen via unieke link
  - URL: `/decks/share/{token}`
  - Token intrekken mogelijk
- **Clone/Remix deck functie:**
  - Leerset kopiëren naar eigen account
  - `copied_from_deck_id` tracking voor attributie
  - Teller: "X keer geremixed"
- **ZIP export met media bestanden**

### Species Book (v2)
> Database infrastructuur is voorbereid, maar UI wordt later gebouwd.
> Geïnspireerd door BirdID's "Species Info" scherm.

- Gedeelde species database (wetenschappelijke naam als identifier)
- Rijke informatie per soort:
  - Meerdere foto's met annotaties
  - Geluidsfragmenten
  - Beschrijvingen (uiterlijk, geluid, gedrag)
  - Feiten (afmetingen, gewicht)
  - Externe links (waarneming.nl, xeno-canto)
- Cards kunnen linken naar species
- "Bekijk in Species Book" knop vanuit flashcard (📖 icoon)
- Vanuit leermodus: klik op boekje → modal/pagina met soortinfo

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

**Gratis tier:**
- Basis bulk import (bestandsnaam parsing, ID3 tags, embedded images)
- Handmatig kaarten aanmaken
- Onbeperkt leren

**Premium tier - AI-Assisted Import:**
| Feature | Beschrijving | AI Model |
|---------|--------------|----------|
| **Auto-categorisatie** | AI herkent soort uit audio/foto en vult metadata aan | Vision + Audio model |
| **Kwaliteitscheck** | AI beoordeelt of audio/foto geschikt is voor leren | Vision model |
| **Auto-tagging** | AI suggereert tags (habitat, gedrag, seizoen) | LLM |
| **Moeilijkheidsschatting** | AI voorspelt hoe moeilijk een soort te herkennen is | LLM |
| **Vergelijkbare soorten** | AI linkt naar verwarringssoorten | Embedding similarity |
| **Beschrijving genereren** | AI schrijft herkenningshints | LLM |

**Business model opties:**
- X imports gratis per maand, daarna premium
- Credits systeem voor AI calls
- Maandelijks abonnement voor onbeperkt AI gebruik

**Overige premium features:**
- Geavanceerde quiz modi
- Offline synchronisatie
- Certificaten/badges
- Expert-geverifieerde sets
- Prioriteit support

### Community Features
- Comments op sets
- Uitgebreide gebruikersprofielen
- Volg systeem
- Challenges/competities
- Vergelijkbare soorten ("Similar Species" zoals BirdID)

### Foto Annotatie Editor (v3+)
> Geïnspireerd door BirdID's annotated species photos (zie [research/Reference/BirdID-04-SpeciesExplanation1.PNG](research/Reference/BirdID-04-SpeciesExplanation1.PNG))

**Probleem:** Voor effectief leren van soortherkenning zijn foto's met visuele annotaties essentieel - labels die wijzen naar specifieke kenmerken (bijv. "brown", "Heavy streaking", "lead-grey"). Gebruikers moeten nu foto's extern bewerken voordat ze uploaden.

**Oplossing:** In-app foto-editor waarmee gebruikers geüploade foto's kunnen annoteren:
- Tekst labels toevoegen
- Lijntjes/pijlen trekken van label naar kenmerk
- Cirkels/ellipsen voor het markeren van gebieden
- Kleuren kiezen voor contrast
- Annotaties opslaan als overlay (originele foto blijft intact)

**Te onderzoeken:**
- Canvas-gebaseerde editors (Fabric.js, Konva.js)
- SVG overlays op afbeeldingen
- Touch-friendly drawing op mobile
- Opslag: annotaties als JSON + SVG overlay of samengevoegde afbeelding?
- Performance op grote afbeeldingen

### Import/Export
> Voorkomt vendor lock-in en maakt migratie mogelijk.

**Fasering:**

| Feature | Sprint | Prioriteit | Status |
|---------|--------|------------|--------|
| Bulk Audio Import (MP3/WAV + ID3 tags) | Sprint 2 | ✅ Hoog | Gepland |
| JSON Export (volledige deck backup) | Sprint 3 | ✅ Hoog | Gepland |
| JSON Import (Naturae backup restore) | Sprint 4 | Medium | Gepland |
| CSV Export (universeel, tekst-only) | Sprint 4 | Medium | Gepland |
| CSV Import (basis import) | Sprint 4+ | Medium | Gepland |
| Anki Export (.apkg) | Post-MVP | Laag | Onderzoek nodig |
| Anki Import (.apkg) | Post-MVP | Laag | Onderzoek nodig |
| Quizlet Import | Post-MVP | Laag | Via API, onderzoek nodig |

**JSON Export (Sprint 3):**
```json
{
  "version": "1.0",
  "exported_at": "2025-01-06T12:00:00Z",
  "deck": {
    "title": "Nederlandse Trekvogels",
    "description": "98 soorten met geluid en foto",
    "is_public": false,
    "tags": ["vogels", "Nederland", "geluid"]
  },
  "cards": [
    {
      "front_text": null,
      "back_text": "Gierzwaluw",
      "position": 1,
      "media": [
        {
          "type": "audio",
          "filename": "gierzwaluw.mp3",
          "position": "front",
          "attribution": "Dean McDonnell",
          "source_url": "https://xeno-canto.org/738385"
        },
        {
          "type": "image",
          "filename": "gierzwaluw.jpg",
          "position": "front",
          "attribution": "Dean McDonnell"
        }
      ]
    }
  ],
  "media_files": ["gierzwaluw.mp3", "gierzwaluw.jpg"]
}
```

**Export opties:**
- JSON alleen (metadata, zonder media bestanden)
- JSON + media (ZIP met JSON + alle bestanden)

### Gastgebruik (v2)
> Geïnspireerd door Anki's "geen account nodig" aanpak.

**Wat kan zonder account:**
- Publieke decks bekijken en leren via directe link
- Sessie voortgang (in browser, verloren bij sluiten)

**Wat vereist account:**
- Eigen decks aanmaken
- Voortgang opslaan (spaced repetition)
- Decks markeren als favoriet
- Delen en community features

**Implementatie:** "Probeer zonder account" knop op publieke deck pagina, soft prompt na X sessies.

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

Voorgebouwde leersets voor lancering:

### 1. Nederlandse Amfibieën
- 16 soorten
- Foto's (met attributie)
- Geluiden (met attributie)
- Bron: eigen materiaal + waarneming.nl + xeno-canto
- Status: ⏳ Content nog toe te voegen

### 2. Nederlandse Sprinkhanen
- 41 soorten (3 groepen: Sabelsprinkhanen, Krekels, Veldsprinkhanen)
- Geluiden (WAV/MP3 met xeno-canto attributie)
- Bron: lokale collectie met ID3 metadata
- Naamconventie: `{nr}. {groep} - {wetenschappelijke naam} - {Nederlandse naam}.wav`
- Status: ✅ Dataset beschikbaar, import via Bulk Import UI

### 3. Nederlandse Trekvogels
- 98 soorten (categorieën: Zangvogels, diverse families)
- Geluiden (MP3 met embedded JPEG foto's ~128KB per bestand)
- Rijke metadata: auteur, locatie, datum, xeno-canto URL
- Naamconventie: `{nr}. {groep} - {familie} - {Nederlandse naam} - {wetenschappelijke naam}.mp3`
- Bron: xeno-canto via ID3 tags
- Status: ✅ Dataset beschikbaar, import via Bulk Import UI

---

## Metrics Dashboard

Voor elke sprint een dashboard met:
- Cohort retention curves
- Feature adoption funnels
- User journey analytics
- Tag usage analytics
- A/B test resultaten

---

## Backlog: UX Verbeteringen

### Loading Feedback & Transitions (TODO)

**Huidige staat:**
- `-webkit-tap-highlight-color` geeft instant visuele feedback bij touch
- `isSubmitting` state disabled rating buttons tijdens API calls
- `LoadingSpinner` component voor initieel laden van pagina's

**Te implementeren:**

1. **Spinner in buttons tijdens submit**
   - Voeg loading spinner toe aan buttons wanneer `isSubmitting` true is
   - Voorkomt dubbele clicks en geeft duidelijke feedback
   - Voorbeeld: rating buttons, form submit buttons

2. **Page transition animaties**
   - Fade/slide animaties bij navigatie tussen pagina's
   - Voorkomt "harde" page switches
   - Opties: Next.js built-in transitions of Framer Motion

**Aandachtspunten:**
- Race conditions vermijden bij async operaties
- Performance impact monitoren
- Mobile-first testen

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
