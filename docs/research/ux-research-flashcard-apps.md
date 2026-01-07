# UX Research: Flashcard & Spaced Repetition Apps

*Research uitgevoerd: januari 2026*

Dit document analyseert de UX patterns van Quizlet, Anki en andere flashcard-apps om de beste aanpak voor Naturae te bepalen.

---

## 1. Quizlet

### Study Modes Overzicht

| Mode | Type | Beschrijving | Status |
|------|------|--------------|--------|
| **Flashcards** | Passief | Digitale kaarten die je flipt om het antwoord te zien | ✅ Gratis |
| **Learn** | Adaptief | AI-gestuurde mix van multiple choice, written en flashcards | ⚠️ Beperkt gratis |
| **Write** | Actief | Type het correcte antwoord | 💰 Betaald |
| **Spell** | Actief | Luister naar audio, type het antwoord | 💰 Betaald |
| **Test** | Assessment | Mix van written, matching, multiple choice, true/false | ⚠️ 1x gratis per set |
| **Match** | Game | Match woorden met definities op tijd | ✅ Gratis |
| **Gravity** | Game | Type antwoorden voor vallende "meteoren" | ❌ Verwijderd |

### Learn Mode - Hoe het werkt

1. **Quick review** bij start om niveau te bepalen
2. **Vraagtype escalatie**: Begint met multiple choice → wordt moeilijker met written questions naarmate je verbetert
3. **Chunking**: Sets worden opgedeeld in chunks van ~20 kaarten
4. **Confusion Alert**: Waarschuwt wanneer je termen door elkaar haalt
5. **Aanpasbaar**: Kies tussen termen/definities, alleen starred, shuffle, etc.

### Key UX Decisions

- **Set size recommendation**: ≤20 kaarten per set voor optimale leerervaring
- **Progressie-gebaseerd**: Makkelijkere vragen eerst, moeilijkere later
- **Immediaat feedback**: Direct zien of antwoord correct is
- **Customization**: Gebruiker kan vraagtypen aan/uitzetten

**Bron**: [Quizlet Study Modes](https://quizlet.com/gb/features/study-modes), [Quizlet Help Center](https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn)

---

## 2. Anki

### Spaced Repetition Algoritmes

#### SM-2 (Legacy, 1987)
- **4 antwoordopties**: Again, Hard, Good, Easy
- **Ease factor**: Bepaalt interval groei
- **Probleem**: "Low interval hell" - herhaalde fouten zorgen voor vastgelopen kaarten
- **Beperkingen**: Ease nooit onder 130%, maximum interval limiet

#### FSRS (Modern, 2023)
- **Machine learning**: Getraind op 700 miljoen reviews van 20.000 gebruikers
- **Three Component Model of Memory**:
  - **Retrievability (R)**: Kans op succesvolle recall
  - **Stability (S)**: Tijd tot R daalt van 100% naar 90%
  - **Difficulty (D)**: Inherente moeilijkheid van de kaart
- **Desired retention**: Gebruiker kiest target (80-95%, 90% aanbevolen)
- **Voordeel**: 20-30% minder reviews voor dezelfde retentie

**Bron**: [Anki FAQs - Algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm), [FSRS Wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs)

### Card Types

| Type | Beschrijving | Gebruik |
|------|--------------|---------|
| **Basic** | Front → Back | Simpele feiten |
| **Basic (and reversed)** | Front ↔ Back | Bidirectionele kennis |
| **Cloze Deletion** | Tekst met [...]gaten | Context behouden |
| **Image Occlusion** | Afbeelding met verborgen delen | Visueel leren (anatomie, kaarten) |

### Review Flow

```
[Kaart front] → [Mental recall] → [Reveal answer] → [Self-grade: Again/Hard/Good/Easy]
```

**Key insight**: Anki gebruikt **self-grading** - de gebruiker beoordeelt zelf hoe goed ze het antwoord wisten. Dit vereist eerlijkheid maar is sneller dan typen.

**Bron**: [Anki Manual - Editing](https://docs.ankiweb.net/editing.html), [Anki - Image Occlusion](https://dev.to/juliafmorgado/anki-cloze-and-image-occlusion-features-n8n)

---

## 3. Interactie Patronen: Flip vs Swipe

### Flip (Tap to reveal)
- **Voordeel**: Natuurlijke "onthulling" - simuleert fysieke kaart
- **Voordeel**: Gebruiker bepaalt eigen tempo
- **Voordeel**: Werkt goed op desktop én mobile
- **Nadeel**: Vereist extra actie na flip (beoordeling)

### Swipe (Tinder-style)
- **Voordeel**: Snelle binaire beslissing (ken ik / ken ik niet)
- **Voordeel**: Gamification element
- **Nadeel**: Geen nuance (alleen ja/nee)
- **Nadeel**: Minder geschikt voor desktop

### Tap Answer / Multiple Choice
- **Voordeel**: Lagere cognitieve drempel
- **Voordeel**: Objectieve beoordeling
- **Nadeel**: Herkenning ≠ recall (makkelijker dan echt onthouden)

### Type Answer
- **Voordeel**: Meest objectieve verificatie
- **Voordeel**: Dwingt active recall
- **Nadeel**: Langzamer
- **Nadeel**: Typo's kunnen frustreren

**Bron**: [Nielsen Norman Group - Cards](https://www.nngroup.com/articles/cards-component/), [Medium - Modern Flashcard App UI](https://medium.com/@prajapatisuketu/modern-flashcard-app-ui-ux-design-2025-4545294a17b4)

---

## 4. BirdID.no - Gespecialiseerd voor Soortherkenning

BirdID is een platform van Nord University specifiek voor vogelherkenning. Zeer relevant voor Naturae's doelgroep.

### Quiz Modes

| Mode | Beschrijving | Media |
|------|--------------|-------|
| **Afbeeldingen Quiz** | Vogelherkenning op basis van foto's | 📷 Foto |
| **Geluid Quiz** | Identificatie via vogelgeluiden | 🔊 Audio |
| **Meervoudige Geluiden** | Meerdere geluiden tegelijk (geavanceerd) | 🔊🔊 Multi-audio |
| **Voor Beginners** | Combinatie van foto's én geluiden | 📷🔊 Mixed |
| **Sudden Death** | 3 levens, fout = leven kwijt | 🎮 Game |
| **Custom Quiz** | Zelf soorten en moeilijkheid kiezen | ⚙️ Customizable |

### Scoring Systeem

```
Correct antwoord:  +1 punt
Fout antwoord:     -1 punt
"Weet niet":        0 punten
```

**Rationale voor negatieve punten**: Getraind op wetenschappelijke nauwkeurigheid - veldwerkers moeten leren "weet ik niet" te zeggen in plaats van gokken (voorkomt slechte data in onderzoek).

### Tijdslimiet
- Standaard: 30 seconden per vraag
- Aanpasbaar per modus

### Key Features
- **45.000+ taken** beschikbaar
- **~380 soorten** in de vogelgids
- **Offline downloadbaar** voor quizsets
- **Vergelijkende kenmerken**: Na quiz worden verwante soorten getoond met onderscheidende kenmerken (pijlen)

### Relevantie voor Naturae

BirdID bewijst dat er vraag is naar gespecialiseerde soortherkenning-tools met:
- **Multi-media**: Foto's én geluid essentieel
- **Gradaties in moeilijkheid**: Van beginner tot expert
- **Custom content**: Gebruikers maken eigen quizsets
- **Wetenschappelijke insteek**: Nauwkeurigheid > snelheid

**Bron**: [BirdID Quiz](https://birdid.no/quiz-modes), [BirdID App - Google Play](https://play.google.com/store/apps/details?id=phoot.pimms.hintbird)

---

## 5. Industry Best Practices

### Cognitieve Wetenschap

1. **Active Recall** > Passive Review
   - Zelf het antwoord ophalen uit geheugen is effectiever dan alleen lezen
   - Flip-en-beoordeel stimuleert dit beter dan alleen browsen

2. **Spaced Repetition**
   - Items terugzien net voordat je ze vergeet
   - "Recalled with effort" is de sweet spot (~75% van reviews)
   - ~10% vergeten is normaal en zelfs wenselijk

3. **Interleaving**
   - Mix van verschillende kaarten/onderwerpen
   - Beter dan blocked practice (alle soortgelijke kaarten achter elkaar)

4. **Desirable Difficulty**
   - Leren moet iets moeite kosten om effectief te zijn
   - Te makkelijk = geen leereffect

### UX Principes

1. **Simplicity**: Elk scherm heeft één doel
2. **Focus**: Tijdens studeren alleen de kaart tonen, geen afleidingen
3. **Immediate Feedback**: Direct weten of antwoord correct is
4. **Progress Visibility**: Gebruiker moet voortgang kunnen zien
5. **Chunking**: Grote sets opdelen in behapbare stukken (max ~20)

**Bron**: [RemNote - Spaced Repetition](https://help.remnote.com/en/articles/6022755-getting-started-with-spaced-repetition)

---

## 6. Algoritmes: Licenties & Implementaties

### Kun je SM-2 en FSRS zomaar gebruiken?

| Algoritme | Licentie | Beschikbaarheid |
|-----------|----------|-----------------|
| **SM-2** (1987) | ✅ Vrij beschikbaar | Publiek algoritme, veel open source implementaties |
| **SM-8, SM-15, SM-18** | ❌ Proprietary | SuperMemo licentie vereist |
| **FSRS** (2023) | ✅ MIT License | Volledig open source |

**Conclusie**: SM-2 en FSRS zijn beide vrij te gebruiken. Dit is ook waarom Anki (open source) deze gebruikt.

### TypeScript/JavaScript Implementaties

#### FSRS (Aanbevolen voor productie)

| Package | Beschrijving | Install |
|---------|--------------|---------|
| **[ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)** | Meest complete, ESM/CJS/UMD | `npm install ts-fsrs` |
| **[femto-fsrs](https://github.com/RickCarlino/femto-fsrs)** | Minimalistisch, zero dependencies | `npm install femto-fsrs` |
| **[fsrs.js](https://github.com/open-spaced-repetition/fsrs.js)** | Basis implementatie | Via GitHub |

**ts-fsrs** is de officiële implementatie van de Open Spaced Repetition organisatie. Vereist Node.js 18+.

#### SM-2

SM-2 is simpel genoeg om zelf te implementeren (~50 regels code), maar er zijn ook packages beschikbaar via [spaced-repetition-algorithm topic](https://github.com/topics/spaced-repetition-algorithm) op GitHub.

### Aanbeveling voor Naturae

**Start met FSRS via `ts-fsrs`**:
- Modern algoritme (2023) vs SM-2 (1987)
- 20-30% efficiënter (minder reviews voor zelfde retentie)
- Actief onderhouden door open-spaced-repetition community
- Makkelijk te integreren: TypeScript types, goed gedocumenteerd

```typescript
import { fsrs, Rating } from 'ts-fsrs';

const f = fsrs();
const card = createEmptyCard();
const schedulingCards = f.repeat(card, new Date());

// Na gebruiker feedback:
const updatedCard = schedulingCards[Rating.Good].card;
```

**Bron**: [ts-fsrs npm](https://www.npmjs.com/package/ts-fsrs), [Open Spaced Repetition GitHub](https://github.com/open-spaced-repetition)

---

## 7. Aanbevelingen voor Naturae

### Fase 1: Aanmaak/Preview Mode
**Interactie**: Pure flip
- Kaart tonen → Tap om te flippen → Zie achterkant
- Geen beoordeling nodig
- Doel: Content bekijken en controleren

### Fase 2: Learn Mode
**Interactie**: Flip + Self-grade (Anki-style)

```
[Foto] → [Tap to flip] → [Nederlandse naam] → [Ken ik niet | Twijfel | Ken ik]
```

**Rationale**:
- Self-grading is sneller dan typen (belangrijk voor soortherkenning met veel kaarten)
- 3 opties in plaats van 4 (simpeler dan Anki)
- Visuele herkenning is primaire skill

### Fase 3: Test Mode (optioneel, later)
**Interactie**: Type answer of Multiple Choice

```
[Foto] → [Type naam] → [Feedback: Correct! / Fout, het was: X]
```

**Rationale**:
- Voor gebruikers die objectieve verificatie willen
- Kan als "examen" functie dienen

### Spaced Repetition Algoritme

**Aanbeveling**: Start met simpele SM-2 variant, upgrade later naar FSRS

Simpele implementatie:
```
Ken ik niet  → interval = 0 (direct terug)
Twijfel      → interval = interval × 1.2
Ken ik       → interval = interval × 2.5

Intervals: 1 dag → 3 dagen → 7 dagen → 14 dagen → 30 dagen → ...
```

### Card Design voor Soortherkenning

```
┌─────────────────────────┐
│                         │
│     [Foto van soort]    │
│                         │
├─────────────────────────┤
│                         │
│    [Tap om te flippen]  │
│                         │
└─────────────────────────┘

         ↓ flip ↓

┌─────────────────────────┐
│      Gewone pad         │
│      Bufo bufo          │
│                         │
│   [Ken ik niet] [Ken ik]│
└─────────────────────────┘
```

---

## 6. Conclusie

| Aspect | Naturae Keuze | Rationale |
|--------|---------------|-----------|
| **Primaire interactie** | Flip (niet swipe) | Meer controle, desktop-friendly |
| **Antwoordmethode** | Self-grading | Sneller voor visuele herkenning |
| **Gradaties** | 3 opties | Simpeler dan Anki's 4 |
| **Algorithm** | Simpele SM-2 | MVP, later upgraden |
| **Set size** | Max 20-25 kaarten aanbevolen | Cognitive load |
| **Multiple images** | Later toevoegen | Verschillende foto's van zelfde soort |

### Beslissingen (januari 2026)

| Vraag | Beslissing | Toelichting |
|-------|------------|-------------|
| **Reverse mode** | ❌ Niet voor MVP | Kan later toegevoegd worden |
| **Wetenschappelijke namen** | ⚙️ Door gebruiker te bepalen | Afhankelijk van hoe set is ontworpen |
| **Audio ondersteuning** | ✅ Vanaf begin | Essentieel voor vogelgeluiden, kikkergeroep, etc. |
| **Gamification** | ❌ Niet voor MVP | Later toevoegen |

### Middle Ground: Quizlet-style + Spaced Repetition

Jouw observatie is terecht: pure self-grading (Anki) vs objectieve verificatie (Quizlet) hoeven geen OF-OF keuze te zijn.

**Hybride aanpak voor Naturae:**

```
┌─────────────────────────────────────────────────────────────┐
│  LEARN MODE (spaced repetition + objectieve verificatie)   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. [Foto/Audio tonen]                                      │
│                                                             │
│  2. [Multiple choice OF type antwoord]                      │
│                                                             │
│  3. [Systeem checkt: GOED of FOUT]                          │
│                                                             │
│  4. [FSRS bepaalt wanneer kaart terugkomt]                  │
│     - Fout → kort interval                                  │
│     - Goed → langer interval                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Voordelen:**
- Geen zelfbeoordeling nodig (objectief)
- Foute antwoorden komen automatisch terug (zoals Quizlet)
- FSRS optimaliseert de herhaling (beter dan Quizlet's simpele systeem)

### Visie: Breder dan Flashcards

Naturae als **modulair leerplatform** voor soortherkenning en ecologie:

| Module | Beschrijving | Voorbeeld |
|--------|--------------|-----------|
| **Flashcards** | Basis foto/audio → naam | "Welke soort is dit?" |
| **Quiz (BirdID-style)** | Multiple choice met timer | Competitief, gamified |
| **Vergelijkingen** | 2 soorten naast elkaar | "Wat is het verschil?" |
| **Ecologie vragen** | Open/MC over gedrag, habitat | "Waar broedt deze soort?" |
| **Geluid matching** | Geluid → soort koppelen | Audio-first learning |

**Scope MVP**: Start met flashcards + quiz, breid later uit.

**Flexibiliteit**: Gebruikers ontwerpen sets zelf. Als iemand geologie of scheikunde wil leren, kan dat - de infrastructuur is generiek.

---

## Bronnen

- [Quizlet Study Modes](https://quizlet.com/gb/features/study-modes)
- [Quizlet Help Center - Learn](https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn)
- [Anki FAQs - Algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm)
- [FSRS Wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs)
- [FSRS vs SM-2 Guide](https://memoforge.app/blog/fsrs-vs-sm2-anki-algorithm-guide-2025/)
- [Nielsen Norman Group - Cards](https://www.nngroup.com/articles/cards-component/)
- [RemNote - Spaced Repetition](https://help.remnote.com/en/articles/6022755-getting-started-with-spaced-repetition)
- [Anki Manual - Editing](https://docs.ankiweb.net/editing.html)
- [Medium - Modern Flashcard App UI](https://medium.com/@prajapatisuketu/modern-flashcard-app-ui-ux-design-2025-4545294a17b4)
- [BirdID Quiz](https://birdid.no/quiz-modes)
- [BirdID App - Google Play](https://play.google.com/store/apps/details?id=phoot.pimms.hintbird)
- [ts-fsrs npm](https://www.npmjs.com/package/ts-fsrs)
- [Open Spaced Repetition GitHub](https://github.com/open-spaced-repetition)
