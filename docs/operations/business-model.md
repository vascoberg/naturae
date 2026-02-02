# Business Model & Toekomstplannen

> Naturae is gestart als hobbyproject. Dit document beschrijft mogelijke commercialisering als er interesse groeit.

## Uitgangspunten

1. **Open by default** - De meeste functionaliteit blijft gratis
2. **Commercieel light** - Geen agressieve monetisatie
3. **Community first** - Waarde creëren voor natuurliefhebbers
4. **Geen vendor lock-in** - Export mogelijkheden (CSV, Anki)

---

## Freemium Model (Concept)

### Gratis Tier
- Onbeperkt leren van publieke decks
- Eigen decks aanmaken (max 10?)
- Kaarten met foto's en audio
- FSRS spaced repetition
- Basis statistieken
- **Export naar CSV/Anki**

### Pro Tier (~€5/maand)
- Onbeperkt eigen decks
- Geavanceerde statistieken
- Offline modus (PWA sync)
- Prioriteit bij support
- Geen ads (als die er ooit komen)

### Organisatie Tier (prijs op aanvraag)
- Voor KNNV, IVN, natuurorganisaties
- Branded decks
- Bulk gebruikersbeheer
- Analytics dashboard
- API toegang

---

## Premium Features - Brainstorm

> Features waar gebruikers daadwerkelijk voor zouden willen betalen.

### 🚗 Voice/Car Mode (Handsfree Leren)

**Use case:** Onderweg in de auto vogelgeluiden leren zonder naar het scherm te kijken.

**Concept:**
1. Gebruiker activeert "Car Mode" via spraak of knop
2. App vraagt: "Welke leerset wil je oefenen?"
3. Gebruiker zegt: "Trekvogelgeluiden"
4. App vraagt: "Welke modus en hoeveel kaarten?"
5. Gebruiker: "Shuffle, 30 kaarten"
6. App speelt geluid af → gebruiker zegt antwoord → app geeft feedback (goed/fout) → volgende

**Technische uitdagingen:**
- Speech-to-Text (Web Speech API / Whisper)
- Text-to-Speech (Web Speech API / ElevenLabs)
- Gelijktijdig audio afspelen EN luisteren naar gebruiker
- Fuzzy matching van gesproken soortnamen
- Achtergrondgeluid filtering (autogeluiden)

**Technologie opties:**
| Onderdeel | Optie 1 | Optie 2 |
|-----------|---------|---------|
| Speech-to-Text | Web Speech API (gratis) | Whisper API (betaald, nauwkeuriger) |
| Text-to-Speech | Web Speech API (gratis) | ElevenLabs (natuurlijker) |
| Wake word | Altijd luisteren | Push-to-talk knop |

**MVP aanpak:**
1. Simpele versie: Push-to-talk na elk geluid
2. Geen continue listening (te complex, batterij)
3. Web Speech API voor kosten te beperken

**Waarom premium:** Complexe feature, API kosten, duidelijke waarde voor serieuze leerders.

### 📸 Meerdere Media per Kaart

**Use case:** Variatie in leerervaring - niet altijd dezelfde foto bij een soort zien.

**Features:**
- Meerdere foto's per kaart (max 5?)
- Meerdere geluiden per kaart
- Random selectie bij elke review
- Voorkeur voor bepaalde media instellen

**Waarom premium:** Extra opslagruimte, complexere UI.

### 🔄 Geavanceerde Sync & Offline

**Features:**
- Volledige offline modus (PWA met background sync)
- Cross-device synchronisatie
- Conflict resolution bij offline edits

### 📊 Geavanceerde Analytics

**Features:**
- Leerpatronen analyse
- Voorspelling "wanneer ken ik dit deck"
- Vergelijking met andere leerders (anoniem)
- Export naar Excel/PDF

### 🎯 Andere Premium Ideeën

- [ ] AI-assisted import (soort herkenning uit foto)
- [ ] Aangepaste FSRS parameters per deck
- [ ] Priority support
- [ ] Early access tot nieuwe features
- [ ] Hogere upload limieten

---

## Gratis Account Limieten - Design

> Hoe om te gaan met limieten op gratis accounts.

### Voorgestelde Limieten

| Resource | Gratis | Pro |
|----------|--------|-----|
| Eigen decks | 10 | Onbeperkt |
| Kaarten per deck | 500 | Onbeperkt |
| Media opslag | 50 MB | 5 GB |
| Bulk import per maand | 100 kaarten | Onbeperkt |

### Edge Cases & UX

#### Scenario 1: Deck bewerken boven limiet

**Situatie:** Gebruiker heeft 10 decks (limiet bereikt), opent deck editor om bestaand deck te bewerken.

**Gedrag:**
- ✅ Bewerken van bestaande decks blijft mogelijk
- ✅ Kaarten toevoegen aan bestaand deck blijft mogelijk (tot kaartenlimiet)
- ❌ "Nieuw deck" knop is disabled met uitleg

#### Scenario 2: Media opslag overschreden

**Situatie:** Gebruiker heeft 48 MB gebruikt, upload 5 MB foto.

**Gedrag:**
- Toon waarschuwing VOOR upload: "Deze upload brengt je op 53 MB (boven de 50 MB limiet)"
- Opties:
  1. "Toch uploaden" → upload lukt, maar volgende uploads geblokkeerd
  2. "Annuleren"
  3. "Upgrade naar Pro"
- Na overlimiet: Banner in app met "Je bent boven je opslaglimiet. Verwijder media of upgrade."

#### Scenario 3: Bulk import overschrijdt limiet

**Situatie:** Gebruiker doet bulk import van 80 kaarten, maar heeft nog maar 30 over in limiet.

**Gedrag (opties):**

**Optie A: Blokkeren**
- "Deze import bevat 80 kaarten, maar je limiet is nog 30. Verminder het aantal of upgrade."
- Pro: Duidelijk, geen half werk

**Optie B: Partial import**
- "We kunnen 30 van de 80 kaarten importeren. Doorgaan?"
- Con: Welke 30? Gebruiker moet kiezen.

**Aanbevolen: Optie A** (blokkeren met duidelijke uitleg)

#### Scenario 4: Deck niet afgemaakt

**Situatie:** Gebruiker werkt aan deck, raakt limiet, deck is nog niet klaar.

**Gedrag:**
- Deck kan worden opgeslagen (draft state)
- Waarschuwing: "Je bent boven de limiet. Je kunt dit deck afmaken maar geen nieuwe starten."
- Graceful degradation, niet data verlies

### Notificatie Hiërarchie

1. **Zacht (70% limiet):** "Je nadert je opslaglimiet (35/50 MB)"
2. **Waarschuwing (90%):** "Bijna vol! Nog 5 MB over"
3. **Hard (100%):** "Limiet bereikt. Upgrade of verwijder content."
4. **Overschreden (>100%):** Banner + blocked uploads

### Database Tracking

```sql
-- Toevoegen aan profiles tabel
storage_used_bytes BIGINT DEFAULT 0,
cards_created_count INTEGER DEFAULT 0,
monthly_import_count INTEGER DEFAULT 0,
monthly_import_reset_at TIMESTAMP
```

### UI Elementen

- Settings pagina: Usage meter (progress bar)
- Upload dialog: Remaining space indicator
- Bulk import: Pre-check met limiet info
- Global: Toast bij 90% bereikt

---

## Gastgebruik (Zonder Account)

> Jaap's feedback: "Anki had ik in krap uurtje zonder hulp door en werkend, er is geen wachtwoord/account nodig."

### Wat kan zonder account:
- Publieke decks bekijken en leren
- Direct via link naar deck (bijv. `naturae.app/decks/abc123`)
- Sessie voortgang (in browser, verloren bij sluiten)

### Wat vereist account:
- Eigen decks aanmaken
- Voortgang opslaan (spaced repetition)
- Decks markeren als favoriet
- Delen en community features

### Implementatie
- "Probeer zonder account" knop op publieke deck pagina
- Soft prompt na X sessies: "Maak account om voortgang op te slaan"

---

## Import/Export (Toekomst)

### Export formaten
| Formaat | Beschrijving | Status |
|---------|--------------|--------|
| CSV | Universeel, tekst-only | Gepland |
| Anki (.apkg) | Voor Anki gebruikers | Gepland |
| JSON | Volledige data backup | Gepland |

### Import formaten
| Formaat | Beschrijving | Status |
|---------|--------------|--------|
| CSV | Basis import | Gepland |
| Anki (.apkg) | Migratie van Anki | Onderzoek nodig |
| Quizlet | Via API of export | Onderzoek nodig |

### Privacy overwegingen
- Export bevat alleen eigen data
- Gedeelde decks: alleen als creator toestemming geeft?

---

## Vergelijking met Alternatieven

| Feature | Naturae | Anki | Quizlet | BirdID |
|---------|---------|------|---------|--------|
| **Gratis** | ✅ (freemium) | ✅ | ⚠️ (beperkt) | ✅ |
| **Account nodig** | ⚠️ (optioneel) | ❌ | ✅ | ✅ |
| **Media focus** | ✅ | ⚠️ | ⚠️ | ✅ |
| **Foto annotaties** | 🚧 (gepland) | ❌ | ❌ | ✅ |
| **Soortherkenning** | ✅ | ❌ | ❌ | ✅ (vogels) |
| **Alle soortengroepen** | ✅ | ✅ | ✅ | ❌ |
| **Community decks** | ✅ | ✅ | ✅ | ❌ |
| **Export** | 🚧 (gepland) | ✅ | ⚠️ | ❌ |
| **Open source** | 🤔 (overwegen) | ✅ | ❌ | ❌ |

---

## Mogelijke Partnerships

### Natuurorganisaties
- KNNV, IVN, Vogelbescherming
- Branded decks voor cursussen
- "Powered by Naturae" white-label

### Educatie
- Universiteiten (biologie, ecologie)
- Middelbaar onderwijs
- NME centra

### Content creators
- Natuurfotografen (foto's met attributie)
- Vogelgeluiden experts (xeno-canto integratie?)
- Soortenexperts (curated decks)

---

## Beheer & Eigendom

### Huidige situatie
- **Eigenaar:** Vasco van den Berg
- **Type:** Hobbyproject
- **Hosting:** Persoonlijke accounts (Vercel, Supabase)

### Bij groei
- Stichting oprichten? (non-profit)
- BV oprichten? (commercieel)
- Open source community model?

### Overdracht
Als het project moet stoppen of overgedragen:
1. Data export voor alle gebruikers
2. Code is al op GitHub (als open source → community kan overnemen)
3. Database dump voor archivering

---

## Open Vragen

- [ ] Open source maken? (MIT/Apache license)
- [ ] Wanneer Pro tier introduceren?
- [ ] Hoe omgaan met content moderatie?
- [ ] GDPR compliance (privacy policy, data deletion)
- [ ] Partnerships actief zoeken of organisch laten groeien?

---

## Changelog

| Datum | Wijziging |
|-------|-----------|
| 2025-01-06 | Initieel document aangemaakt |
| 2026-01-30 | Premium features brainstorm toegevoegd (voice/car mode, etc.) |
| 2026-01-30 | Gratis account limieten design toegevoegd |
