# Naturae Backlog

> Centrale plek voor alle features, ideeën en taken. Pak wat je wilt, wanneer je wilt.

**Laatste update:** 2 februari 2026

---

## Nu Actief

*Waar je deze week aan werkt. Max 2-3 items.*

_(Leeg - kies iets uit "Klaar voor Implementatie")_

---

## Klaar voor Implementatie

*Uitgewerkt en klaar om op te pakken wanneer je zin hebt.*

### Clone/Remix Deck
"Remix" knop op publieke deck → kopie naar eigen account.
- `copied_from_deck_id` tracking
- Media delen (niet dupliceren)
- "X keer geremixed" teller

### Private Sharing (Share Tokens)
Private decks delen via unieke link.
- `/decks/share/{token}` URL
- Token intrekken mogelijk
- Toegang zonder account

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

### Internationalisering (i18n)
Engels ondersteunen naast Nederlands.
- next-intl library
- URL routing `/en/...`
- [Onderzoek](research/internationalisering-i18n.md) ✅

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

---

## Milestones

*Grote doelen op de horizon. Zie [roadmap.md](post-mvp-roadmap.md) voor details.*

| Milestone | Status | Wanneer |
|-----------|--------|---------|
| Production Ready | ✅ Afgerond | 01-02-2026 |
| Soft Launch (KNNV pilot) | 🔜 Volgende | Wanneer Jaap reageert |
| Freemium Limieten | 📋 Gepland | Na validatie gebruikers |
| Stripe Betalingen | 📋 Gepland | Na freemium |
| 100 MAU | 🎯 Doel | Q1 2026 |

---

## Afgerond ✅

### Februari 2026
- [x] **Xeno-canto API Integratie** - Alle 5 fasen voltooid
  - Service file, media picker, server action
  - Soortenpagina audio player
  - Quiz met Xeno-canto geluiden
  - [Docs](features/xeno-canto-audio-integration.md)
- [x] **Quiz verbeteringen**
  - Distractor algoritme: deck-first priority (soorten uit deck krijgen voorrang)
  - Nederlandse namen fix: verbeterde GBIF naam selectie (`preferred` flag, trusted sources)
  - Kapitalisatie normalisatie (eerste letter hoofdletter, rest kleine letters)
  - IJ-uitzondering (IJsgors blijft IJsgors)
  - Offensieve term "negertje" → "Zwart wekkertje"
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
- AI soortherkenning uit foto
- Auto-tagging
- Kwaliteitscheck AI
- Offline sync

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
| [knnv-feedback.md](research/knnv-feedback-jaap-graveland.md) | KNNV gesprek status |
| [quiz-mode-plan.md](research/quiz-mode-implementation-plan.md) | Quiz features details |
| [i18n-research.md](research/internationalisering-i18n.md) | Internationalisering |

---

*Tip: Pak wat je leuk vindt. De "Milestones" zijn richtlijnen, geen deadlines.*
