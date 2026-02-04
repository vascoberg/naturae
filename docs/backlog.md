# Naturae Backlog

> Centrale plek voor alle features, ideeën en taken. Pak wat je wilt, wanneer je wilt.

**Laatste update:** 4 februari 2026

---

## Nu Actief

*Waar je deze week aan werkt. Max 2-3 items.*

### KNNV Demo Pagina (voor meeting Jaap)
**Deadline:** Volgende week (meeting met Jaap)

Basic organisatie pagina met KNNV styling als demo/concept.
- Niet volledig functioneel, maar als eerste idee wat mogelijk is
- KNNV branding/kleuren
- Features die op een organisatie pagina kunnen komen:
  - Gecureerde leersets
  - Organisatie logo en beschrijving
  - Leden overzicht (mockup)

Gerelateerd: [Organisatie Pagina's (uitgebreide planning)](features/organization-pages.md)

---

## Quick Wins & UX Polish

*Kleine verbeteringen die snel opgepakt kunnen worden.*

### Homepage Content Update ✅
~~De homepage content is geschreven toen Naturae alleen flashcards had.~~

**Afgerond 3 feb 2026:**
- [x] H1: "Leer de natuur kennen"
- [x] Tagline: "Ontdek leersets van de community en leer soorten herkennen op beeld en geluid."
- [x] "Hoe het werkt" sectie: Updated met quiz-modus en soortenpagina's
- [x] Zoekbalk placeholder: "Zoek op titel of soort..."

### Nieuwe Deck Flow Fix ✅
**Afgerond 3 feb 2026:**
- [x] Na aanmaken deck direct naar edit modus (ipv overzichtspagina)

### Cookie Banner / Privacy Compliance
Naturae tracked niets behalve Vercel Analytics. Is een cookie banner nodig?
- [ ] Onderzoek: wat eist AVG voor Vercel Analytics?
- [ ] Bestaande privacy pagina: `/privacy`
- [ ] Conclusie documenteren

---

## Klaar voor Implementatie

*Uitgewerkt en klaar om op te pakken wanneer je zin hebt.*

### Clone/Remix Deck
"Remix" knop op publieke deck → kopie naar eigen account.
- `copied_from_deck_id` tracking
- Media delen (niet dupliceren)
- "X keer geremixed" teller

### Transfer Deck Ownership
Deck overdragen naar andere gebruiker (bijv. bij account verwijdering).
- Admin functie of user-initiated
- Handig voor populaire publieke decks
- Gerelateerd aan Clone/Remix (zelfde mechaniek)

### Private Sharing (Share Tokens)
Private decks delen via unieke link.
- `/decks/share/{token}` URL
- Token intrekken mogelijk
- Toegang zonder account

### Zoeken op Soort in Discover ✅
~~Op `/discover` kun je nu zoeken op leerset-titel.~~

**Afgerond 3 feb 2026:**
- [x] Zoeken op soortnaam via `cards.back_text`
- [x] Gecombineerde query: titel OR soortnaam match
- [x] Placeholder aangepast naar "Zoek op titel of soort..."

### Annotatie Tool Verbeteringen ✅
De annotatie-editor is sterk verbeterd. [Rosanne feedback]

**Afgerond:**
- [x] Stroke width slider (1-50, default 25) + numerieke input
- [x] Font size slider (12-100, default 32) + numerieke input
- [x] Color picker met 7 presets + native picker
- [x] Edit bestaande annotaties (kleur/dikte/grootte wijzigen)
- [x] Layers panel voor z-index control
- [x] Proportionele pijlpunten
- [x] Image viewer in deck editor (klik om te vergroten)
- [x] Diverse bug fixes (hard refresh, delete, label)

**Nog te doen (lage prioriteit):**
- [x] Undo/redo functionaliteit (Ctrl+Z / Cmd+Z)
- [ ] Mobile touch support verbeteren

[Documentatie](features/annotation-tool-improvements.md)

### Flashcard Layout Verbetering ✅
~~De huidige flashcard-weergave maakt slecht gebruik van schermruimte vergeleken met Quizlet.~~

**Afgerond 3 feb 2026:**
- [x] Mobile: Responsive aspect ratio (16/9 → 4/3), compactere buttons en gaps
- [x] Desktop: Grotere container (max-w-lg → max-w-2xl/3xl), multi-line soortnamen
- [x] Verwijderd: truncate class op antwoordopties

[Documentatie](features/flashcard-layout-improvement.md)

### Quiz Keyboard Shortcuts
Snel antwoorden met toetsenbord.
- 1-4 voor opties
- Enter voor volgende
- Esc voor stoppen

### Quiz Timer
Optionele tijdslimiet per vraag.
- 15s / 30s / 60s / uit
- Visuele countdown
- Auto-volgende bij timeout

### Anki Export
Deck exporteren als .apkg voor Anki.
- Onderzoek Anki format nodig
- Cards + media bundelen

---

## Ideeën & Research

*Nog uitwerken of onderzoeken voordat het opgepakt kan worden.*

### Organisatie Pagina's
Organisatiefunctionaliteit voor KNNV, onderwijsinstellingen (HVHL) en adviesbureaus.

**Uitgebreide planning:** [organization-pages.md](features/organization-pages.md)

**Doelgroepen:**
- KNNV (natuurvereniging) - cursusmateriaal, gecureerde sets
- HVHL (onderwijs) - lesmateriaal, toetsen, studentvoortgang
- De Boominspecteurs (adviesbureau) - interne training, certificering

**MVP scope:**
- Organisatie landing page met branding
- Gecureerde/aanbevolen leersets
- Voortgang dashboard voor beheerders
- Leden uitnodigen via link/code

**Gerelateerd:**
- [Premium Features - Organisatie tier](features/premium-features.md)
- [KNNV Feedback Jaap](research/knnv-feedback-jaap-graveland.md)

### Internationalisering (i18n)
Engels ondersteunen naast Nederlands voor internationale uitrol.

**Waarom prioriteit:**
- Platform is inherent internationaal (GBIF + Xeno-canto = alle soorten wereldwijd)
- Tagging systeem ondersteunt al regio/land filtering
- Latijnse soortnamen zijn universeel → cross-taal bruikbaar

**Technisch:**
- next-intl library
- URL routing `/en/...`
- [Uitgebreid onderzoek + implementatieplan](research/internationalisering-i18n.md) ✅

**Launch strategie:**
- Reddit posts op r/ecology, r/birding, r/botany etc.
- Transparant over vertaalkwaliteit → community feedback uitnodigen
- Andere aanpak dan NL soft launch (LinkedIn)

### Meerdere Media per Kaart
Variatie: meerdere foto's/geluiden per kaart, random selectie.
- Database: `card_media` tabel bestaat al
- UI voor media management
- Premium feature?

### Streak Tracking
Dagelijkse leerdoelen en streaks bijhouden.
- Motivatie feature
- PWA push notificaties

### GBIF Verspreidingskaart
Kaart met waarnemingen per soort embedden.
- GBIF occurrence API
- Leaflet of static image

### "Weet ik niet" Optie
Quiz optie voor 0 punten, toont direct antwoord.

### Score Leaderboards
Highscores per deck.
- Privacy overwegingen
- Alleen publieke decks?

### Omgekeerde Quiz
Antwoord zien → vraag raden (geluid bij naam).

### Alleen Audio Modus
Quiz zonder visuele hints, puur op gehoor.

### Mobile App (iPhone/Android)
Native app als "view-only" companion voor de web app.

**Scope:**
- ✅ Leersets bekijken en studeren
- ✅ Alle leermodi uitvoeren (flashcards, quiz, audio)
- ❌ Geen deck aanmaken/bewerken
- ❌ Geen annotaties maken

**Rationale:**
- Aanmaken en annoteren is complexer en geschikter voor desktop
- Mobile app focust op consumeren en leren
- Vermindert ontwikkelcomplexiteit aanzienlijk

**Technisch (later onderzoeken):**
- React Native of Flutter
- Shared API met web app
- Offline support voor leersets?

---

## Milestones

*Grote doelen op de horizon. Zie [roadmap.md](post-mvp-roadmap.md) voor details.*

| Milestone | Status | Wanneer |
|-----------|--------|---------|
| Production Ready | ✅ Afgerond | 01-02-2026 |
| Freemium Limieten | ✅ Afgerond | 02-02-2026 |
| Soft Launch (KNNV pilot) | 🔜 Volgende | Wanneer Jaap reageert |
| Stripe Betalingen | 📋 Gepland | Na soft launch |
| 100 MAU | 🎯 Doel | Q1 2026 |

---

## Afgerond ✅

### Februari 2026
- [x] **Bulk Import Configuratie** - Import instellingen en handmatig soorten zoeken
  - Foto positie: voorkant of achterkant
  - Naam taal: Nederlands / Latijn / Engels / NL + Latijn
  - Naam positie: voorkant / achterkant / beide
  - Handmatige soort zoeken voor niet-herkende bestanden
  - [Docs](features/bulk-import-configuration.md)
- [x] **Bulk Media Import Verbeteringen** - Robuustere filename parsing, stop-knoppen, storage limit
  - Parsing: underscores, hyphens, CamelCase, trailing metadata (male/female/adult/nummers)
  - Stop-knoppen tijdens species matching en uploaden
  - Storage limit check vóór upload start
  - [Docs](features/bulk-media-import-improvements.md)
- [x] **Bulk Tekst Import** - Copy/paste import vanuit Excel
  - Auto-detect separator (tab/komma/puntkomma)
  - Preview met "wissel kolommen" knop
  - "Tekst importeren" knop in deck editor
  - [Docs](features/bulk-text-import.md)
- [x] **Freemium Limieten** - Opslaglimiet voor gratis accounts
  - 50 MB gratis, 1 GB premium (later)
  - Storage tracking in profiles tabel
  - UI indicator in settings pagina
  - Toast meldingen bij limiet
  - [Docs](features/freemium-limits-plan.md)
- [x] **Xeno-canto API Integratie** - Alle 5 fasen voltooid
  - Service file, media picker, server action
  - Soortenpagina audio player
  - Quiz met Xeno-canto geluiden
  - [Docs](features/xeno-canto-audio-integration.md)
- [x] **Quiz verbeteringen**
  - Distractor algoritme: deck-first priority (soorten uit deck krijgen voorrang)
  - Distractor namen: gebruiken nu back_text van deck kaarten (consistente naamgeving)
  - Nederlandse namen fix: verbeterde GBIF naam selectie (`preferred` flag, trusted sources)
  - Kapitalisatie normalisatie (eerste letter hoofdletter, rest kleine letters)
  - IJ-uitzondering (IJsgors blijft IJsgors)
  - Offensieve term "negertje" → "Zwart wekkertje"
- [x] **UX Loading Feedback**
  - Active states (scale + opacity) op buttons, nav items, deck cards
  - Loading skeletons voor dashboard, my-decks, discover, settings, deck detail
  - Species search fix: JSONB query syntax (`->>` voor tekstextractie)
- [x] Error boundaries (global, public, main)
- [x] Accessibility fixes (aria-labels)
- [x] Mobile responsiveness test
- [x] Lighthouse audit (100/90/96/100)
- [x] Supabase security migratie
- [x] Toast feedback (DeckEditor, CardSideEditor)
- [x] Page transitions (View Transitions API)

### Januari 2026
- [x] Soortenpagina (Species Page) - alle 5 fases
- [x] CC-BY-NC Licentie Support
- [x] Quiz Mode Fase 1
- [x] GBIF Media Learning Mode
- [x] Foto Annotatie Editor

### MVP Sprints
- [x] Auth, FSRS, Flashcards (Sprint 1)
- [x] Bulk import, WYSIWYG editor (Sprint 2)
- [x] Discover, Gastgebruik, Landing (Sprint 3)
- [x] GBIF Taxonomie Integratie

---

## Parking Lot

*Misschien ooit. Lage prioriteit of nog vaag.*

### Performance Optimalisaties
- Lazy loading flashcard images
- Dashboard queries paralleliseren
- Bundle size analyse
- Slow queries optimaliseren (23 in Supabase)

### Community Features
- Comments op sets
- Uitgebreide profielen
- Volg systeem
- Challenges/competities
- Certificaten/badges

### Premium/AI Features
Zie [Premium Features](features/premium-features.md) voor details.
- AI-powered smart import
- AI soortherkenning uit foto
- Excel/PDF import met AI parsing
- Organisatie features (scholen/clubs)

### Overig
- Sentry error tracking
- API rate limiting
- CSV Import/Export
- JSON Import (backup restore)

---

## Documentatie Index

| Document | Beschrijving |
|----------|--------------|
| [post-mvp-roadmap.md](post-mvp-roadmap.md) | Milestones en validatie doelen |
| [business-model.md](operations/business-model.md) | Freemium model, pricing |
| [premium-features.md](features/premium-features.md) | Premium/AI features planning |
| [organization-pages.md](features/organization-pages.md) | Organisatie features planning |
| [bulk-text-import.md](features/bulk-text-import.md) | Copy/paste import feature |
| [bulk-media-import-improvements.md](features/bulk-media-import-improvements.md) | Filename parsing, stop buttons, storage |
| [bulk-import-configuration.md](features/bulk-import-configuration.md) | Import configuratie opties |
| [knnv-feedback.md](research/knnv-feedback-jaap-graveland.md) | KNNV gesprek status |
| [quiz-mode-plan.md](research/quiz-mode-implementation-plan.md) | Quiz features details |
| [i18n-research.md](research/internationalisering-i18n.md) | Internationalisering |

---

*Tip: Pak wat je leuk vindt. De "Milestones" zijn richtlijnen, geen deadlines.*
