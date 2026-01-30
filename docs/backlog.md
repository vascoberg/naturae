# Naturae Backlog

> Geconsolideerde lijst van features na de MVP sprints. Gebaseerd op naturae-mvp-design.md, quiz-mode-implementation-plan.md, en nieuwe ideeën.

---

## Status Overzicht

### Afgerond ✅

| Feature | Sprint/Fase | Documentatie |
|---------|-------------|--------------|
| Auth, FSRS, Flashcards | Sprint 1 | [implementation-plan.md](implementation-plan.md) |
| Bulk import, WYSIWYG editor | Sprint 2 | [implementation-plan.md](implementation-plan.md) |
| Discover, Gastgebruik, Landing | Sprint 3 | [implementation-plan.md](implementation-plan.md) |
| GBIF Taxonomie Integratie | MVP+ | [research/naturae-taxonomie-feature.md](research/naturae-taxonomie-feature.md) |
| Foto Annotatie Editor | MVP+ | [features/photo-annotation-plan.md](features/photo-annotation-plan.md) |
| GBIF Media Learning Mode | MVP+ | [features/gbif-media-learning-mode.md](features/gbif-media-learning-mode.md) |
| Quiz Mode (Fase 1) | MVP+ | [research/quiz-mode-implementation-plan.md](research/quiz-mode-implementation-plan.md) |
| CC-BY-NC Licentie Support | MVP+ | Geïntegreerd in gbif-media.ts |
| **Soortenpagina (Species Page)** | MVP+ | [features/soortenpagina-species-page.md](features/soortenpagina-species-page.md) |

---

## Backlog: Prioriteit Hoog

### 1. ~~Licentie Toggle (CC-BY vs CC-BY-NC)~~ ✅ AFGEROND

**Status:** Afgerond (30-01-2026)

CC-BY-NC is nu standaard inbegrepen in alle GBIF media queries. Foto's tonen hun licentie type (CC0 groen, CC-BY blauw, CC-BY-NC oranje).

---

### 2. Xeno-canto API Integratie

**Status:** Gepland (uit quiz-mode-implementation-plan.md Fase 2)
**Geschatte omvang:** Medium (8-16 uur)

**Doel:** Vogelgeluiden ophalen van Xeno-canto voor quiz en soortenpagina's.

**Features:**
- `xeno-canto.ts` service voor API calls
- Media picker uitbreiden met "Geluiden" tabblad
- Geluid Quiz mode met Xeno-canto audio
- Audio preview in picker

**Vereisten:**
- Xeno-canto API key aanvragen (gratis)
- `XENO_CANTO_API_KEY` environment variable

**Documentatie:** [quiz-mode-implementation-plan.md sectie 13](research/quiz-mode-implementation-plan.md#13-xeno-canto-api---geluiden-integratie)

---

### 3. ~~Soortenpagina (Species Book)~~ ✅ AFGEROND

**Status:** Afgerond (30-01-2026)

Volledig geïmplementeerd met alle 5 fases:
- ✅ Fase 1: Basis pagina & Sheet/Dialog component
- ✅ Fase 2: Book icon integratie (quiz, flashcard, card grid)
- ✅ Fase 3: GBIF metadata (sex, lifeStage, filters)
- ✅ Fase 4: Wikipedia beschrijving & verwante soorten
- ✅ Fase 5: Foto picker uitbreiding met metadata

**Documentatie:** [features/soortenpagina-species-page.md](features/soortenpagina-species-page.md)

---

### 4. Quiz Media Selectie Verbeteren

**Status:** ✅ Voldoende voor nu
**Geschatte omvang:** n.v.t.

**Bevinding (jan 2026):** De huidige implementatie is voldoende:
- MediaType selector (foto/audio/mix) werkt voor eigen media
- GBIF quiz heeft alleen foto's (audio komt met Xeno-canto integratie)
- Mix modus selecteert willekeurig per vraag

Eventuele toekomstige verbeteringen (lage prioriteit):
- "Alleen kaarten met audio EN foto" filter voor mix modus
- Voorkeur onthouden per deck (localStorage)

---

## Backlog: Prioriteit Medium

### 5. Knop Interacties / Loading Feedback

**Status:** Onderzoek afgerond ✅
**Geschatte omvang:** Klein-Medium (4-8 uur) voor implementatie

**Probleem:** Soms geen zichtbare feedback na klikken op links of knoppen.

**Onderzoek bevindingen:**
- ✅ Goede patterns: Optimistic updates (LikeButton), progress tracking (BulkImport)
- ⚠️ Inconsistent: Toast gebruik varieert per component
- ❌ Missend: DeckEditor save feedback, quiz completion, stille CRUD failures

**Aanbevolen implementatie (uit onderzoek):**
- Fase 1: LoadingButton component + feedback utilities
- Fase 2: Toast toevoegen aan alle async operaties
- ~~Fase 3: Page transitions~~ ✅ Geïmplementeerd (30-01-2026)

**Documentatie:** [research/loading-feedback-ux.md](research/loading-feedback-ux.md)

---

### 6. Internationalisering (i18n)

**Status:** Onderzoek afgerond ✅
**Geschatte omvang:** 16-24 uur voor volledige implementatie

**Aanbevolen aanpak:**
- URL-based routing (`/nl/...`, `/en/...`)
- next-intl library
- `localePrefix: 'as-needed'` (geen `/nl/` voor default taal)

**Huidige meertaligheid:**
- Tags hebben al `names` JSON veld met `{"nl": "...", "en": "..."}`
- Species hebben `common_names` met taalcodes

**Documentatie:** [research/internationalisering-i18n.md](research/internationalisering-i18n.md)

---

### 7. Quiz Geavanceerde Features (Fase 2-4)

**Status:** Gepland
**Geschatte omvang:** Medium per feature

**Features uit quiz-mode-implementation-plan.md:**
- [ ] Timer per vraag (15s, 30s, 60s, uit)
- [ ] "Weet ik niet" optie met 0 punten
- [ ] Keyboard shortcuts (1-4 voor optie selectie)
- [ ] Difficulty levels (aantal opties: 3/4/6)
- [ ] Score leaderboards per deck

---

### 8. Private Sharing (Share Tokens)

**Status:** Gepland (uit naturae-mvp-design.md)
**Geschatte omvang:** Medium (8-12 uur)

**Features:**
- Genereer unieke share token voor private deck
- URL: `/decks/share/{token}`
- Toegang zonder account
- Token intrekken mogelijk

---

### 9. Clone/Remix Deck

**Status:** Gepland
**Geschatte omvang:** Medium (8-12 uur)

**Features:**
- "Remix" knop op publieke deck pagina
- Kopieert deck + kaarten naar eigen account
- Media wordt gedeeld (niet gedupliceerd)
- `copied_from_deck_id` tracking
- Teller: "X keer geremixed"

---

### 10. Website Performance & Snelheid

**Status:** Nieuw - onderzoek nodig
**Geschatte omvang:** Te bepalen na onderzoek

**Doel:** Algehele performance van de website verbeteren qua laadtijd en responsiviteit.

**Onderzoeken:**
- [ ] Lighthouse audit uitvoeren (Core Web Vitals)
- [ ] Bundle size analyseren (next/bundle-analyzer)
- [ ] Image loading optimalisatie (lazy loading, blur placeholders)
- [ ] API response times meten
- [ ] Database query performance (Supabase)

**Mogelijke verbeteringen:**
- Next.js Image component optimalisatie
- Code splitting en lazy imports
- Caching strategie (SWR/React Query)
- Database indexen toevoegen
- CDN voor statische assets
- Server-side caching

**Metrics om te meten:**
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- TTFB (Time to First Byte)

---

## Backlog: Prioriteit Laag

### 11. Engagement & Retention Features

- [ ] Voortgangstracking dashboard
- [ ] Streak tracking
- [ ] Meerdere foto's per kaart
- [ ] PWA push notificaties
- [ ] Leerinstellingen per leerset (FSRS presets UI)

### 12. Import/Export Uitbreidingen

- [ ] JSON Import (backup restore)
- [ ] CSV Import/Export
- [ ] ZIP Export met media bestanden
- [ ] Anki Export/Import (.apkg) - onderzoek nodig
- [ ] Quizlet Import - onderzoek nodig

### 13. Community Features

- [ ] Comments op sets
- [ ] Uitgebreide gebruikersprofielen
- [ ] Volg systeem
- [ ] Challenges/competities

### 14. Premium Features (later)

- [ ] AI-assisted import (soort herkenning uit foto/audio)
- [ ] Kwaliteitscheck AI
- [ ] Auto-tagging
- [ ] Offline synchronisatie

---

## Ideeën Parking Lot

*Features die genoemd zijn maar nog niet uitgewerkt:*

- Verspreidingskaart per soort (GBIF occurrence map embed)
- ~~Externe links op soortenpagina (waarneming.nl, xeno-canto, GBIF)~~ ✅ Afgerond
- ~~"Similar Species" vergelijking~~ ✅ Afgerond (verwante soorten chips)
- Omgekeerde quiz (antwoord zien → vraag raden)
- Alleen audio modus (geen visuele hints)
- Certificaten/badges systeem

---

*Laatste update: 30 januari 2026*
