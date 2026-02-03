# Organisatiepagina's - Feature Planning

> Planning voor organisatie-functionaliteit in Naturae, gericht op natuurverenigingen, onderwijsinstellingen en adviesbureaus.

**Status:** Research & Planning
**Laatste update:** 3 februari 2026

---

## Inhoudsopgave

1. [Doelgroepen & Use Cases](#doelgroepen--use-cases)
2. [Competitive Analyse](#competitive-analyse)
3. [Differentiatie & Kansen](#differentiatie--kansen)
4. [Feature Planning](#feature-planning)
5. [Database Architectuur](#database-architectuur)
6. [Pricing Model](#pricing-model)
7. [Implementatie Roadmap](#implementatie-roadmap)
8. [Open Vragen](#open-vragen)
9. [Bronnen](#bronnen)

---

## Doelgroepen & Use Cases

### 1. Natuurverenigingen (KNNV, IVN)

**Voorbeeld:** KNNV met Jaap Graveland
**Context:** Zie [KNNV correspondentie](../research/knnv-feedback-jaap-graveland.md)

**Scenario:** KNNV afdeling geeft 6-weekse cursus plantenherkenning.

**Wat ze willen:**
- Cursusmateriaal aanbieden aan leden
- Wekelijkse leersets toewijzen (Week 1: Composieten, Week 2: Kruisbloemigen)
- Gecureerde, gevalideerde leersets van experts
- KNNV Natuuracademie als merk/platform
- Voortgang van cursisten volgen
- Live quizzen tijdens excursies

**Specifieke behoeften:**
- [ ] Organisatiepagina met KNNV branding
- [ ] Gecureerde "aanbevolen" leersets
- [ ] Groepen/klassen voor cursussen
- [ ] Voortgang dashboard voor cursusleiders
- [ ] Certificaten na voltooien (optioneel)

**Business model:** Jaap zoekt subsidie. Partnerschap met jaarlijkse bijdrage?

---

### 2. Onderwijsinstellingen (HVHL, MBO, universiteiten)

**Voorbeeld:** Hogeschool Van Hall Larenstein
**Context:** Een docent heeft al een account. HVHL-studenten gebruiken nu Quizlet voor plantenherkenningstoetsen.

**Scenario:** Middelbare school of hogeschool, vak biologie.

**Wat ze willen:**
- Lesmateriaal per vak/module (bijv. "Ecologie jaar 1")
- Toetsen afnemen (quiz mode met score registratie)
- Voortgang per student volgen
- Resultaten exporteren voor beoordeling
- Huiswerk toewijzen
- Integratie met bestaande systemen (Canvas, Brightspace)?

**Specifieke behoeften:**
- [ ] Vakken/modules structuur
- [ ] Student uitnodigen via institutioneel e-mail
- [ ] Docent dashboard met voortgang per student
- [ ] Quiz resultaten exporteren (voor beoordeling)
- [ ] Mogelijkheid tot "gesloten" sets (alleen voor studenten)

**Business model:** Per docent/student licentie? Of school-wide deal?

---

### 3. Adviesbureaus (De Boominspecteurs, ecologische bureaus)

**Voorbeeld:** De Boominspecteurs (werkgever Rosanne)
**Context:** Rosanne maakt leerset voor oude boskernen. Bureaus willen veldmedewerkers trainen.

**Wat ze willen:**
- Training nieuwe medewerkers (soortherkenning op beeld/geluid)
- Interne kennisbank (niet publiek)
- Specialisaties: vleermuizen op geluid, planten op beeld, vogelgeluiden
- Certificering/competentiebewijs

**Specifieke behoeften:**
- [ ] Private organisatie (niet vindbaar)
- [ ] Medewerkers uitnodigen via bedrijfsmail
- [ ] Competentie tracking ("Jan kan vleermuizen op sonogram")
- [ ] Interne leersets (niet publiek)
- [ ] Rapportage voor HR/management

**Business model:** B2B SaaS model? Per gebruiker per maand?

---

## Competitive Analyse

### Quizlet - B2C vs B2B Model

**Waarom bestaat Quizlet for Schools naast individuele abonnementen?**

Quizlet heeft twee business modellen:

#### B2C: Individuele Abonnementen
| Plan | Prijs | Doelgroep |
|------|-------|-----------|
| Quizlet Free | €0 | Casual users |
| Quizlet Plus | ~€7.99/maand of €35.99/jaar | Studenten |
| Quizlet Plus for Teachers | €35.99/jaar | Individuele docenten |

**B2C Features:**
- Geen ads, offline access, custom media
- AI practice tests, Magic Notes
- **Teacher:** Class Progress dashboard, Quizlet Live hosting

#### B2B: Quizlet for Schools (Institutional)
- **Volume korting:** Hoe meer seats, hoe lager de prijs per user
- **Non-renewing licenses:** 1-jaar licenties zonder automatische verlenging
- **Centraal beheer:** Admin kan licenties toewijzen/intrekken
- **Pricing:** Custom quotes via [calculator](https://quizlet.com/upgrade/plus/group) - niet publiek

**Waarom kiezen organisaties B2B?**
1. **Kostenbesparing:** Substantieel lagere prijs per seat bij volume
2. **Administratie:** Centraal beheer van alle accounts
3. **Budgettering:** Vaste jaarlijkse kosten, geen verrassingen
4. **Compliance:** School kan garanderen dat studenten toegang hebben

**Quizlet Live (unieke feature):**
- Real-time multiplayer quiz voor in de klas
- Join via code - geen account nodig voor deelnemers
- Random teams, samenwerking vereist
- Fout antwoord → terug naar nul (spannend!)

**Bron:** [Quizlet for Schools](https://quizlet.com/features/quizletforschools), [Quizlet Pricing](https://www.getapp.com/education-childcare-software/a/quizlet/pricing/)

---

### Brainscape - Amerikaanse Concurrent

**Oorsprong & Achtergrond:**
- Opgericht door Andrew S. Cohen na frustratie met Rosetta Stone (2005-2007)
- Columbia University graduate research over Confidence-Based Repetition (CBR)
- Headquarters: Brooklyn, New York 🇺🇸
- **~40 medewerkers** across 5 continenten
- **$6.1M revenue** in 2024 met 40 personen
- Funding: $3M+ raised by 2015

**Unique Selling Point:** Confidence-Based Repetition (1-5 rating per kaart)

**Pricing Model:**

| Plan | Prijs | Features |
|------|-------|----------|
| **Free** | €0 | Create & study own flashcards, basic spaced repetition |
| **Pro Monthly** | $19.99/maand | Alles + images, audio, certified content, AI-cards |
| **Pro Semester** | $9.99/maand | 6 maanden commitment |
| **Pro Yearly** | $7.99/maand (~$96/jaar) | Jaarabonnement |
| **Pro Lifetime** | $199.99 eenmalig | Permanent access |

**Wat zit achter paywall:**
- Images en audio uploaden
- Access tot certified flashcard libraries
- Unlimited AI card creation
- Advanced statistics

**Bron:** [Brainscape Pricing](https://www.brainscape.com/pricing), [Brainscape Wikipedia](https://en.wikipedia.org/wiki/Brainscape), [Latka Revenue Data](https://getlatka.com/companies/brainscape)

---

### StudySmarter (Vaia) - Duitse Concurrent 🇩🇪

**Oorsprong & Achtergrond:**
- **Opgericht:** 2017 in München, Duitsland
- **Founders:** Till Sohlemann, Simon Hohentanner, Maurice Khudhir, Christian Felgenhauer
- **Spin-off** van TU Munich & LMU Munich
- **Funding:** $31-52M over 3 rounds (Series A: $16M in 2021)
- **Investeerders:** Goodwater Capital, Owl Ventures, Left Lane Capital
- **Rebranding:** In 2023 hernoemd naar "Vaia" voor US markt
- **Award:** Beste EdTech start-up in Duitsland en Europa

**Pricing Model:**

| Plan | Prijs | Features |
|------|-------|----------|
| **Free** | €0 | Flashcards, note-taking, quizzes, miljoenen study resources, ads |
| **Premium** | ~€5.80/maand (~€70/jaar, alleen jaarlijks) | Ad-free, offline, CSV export, unlimited sets, AI Assistant |

**Uniek:** Money-back guarantee als je zakt ondanks Premium gebruik.

**Zwaktes:**
- Alleen jaarabonnement (geen maandelijks)
- Geen natuur-specifieke features

**Bron:** [StudySmarter Pricing](https://www.studysmarter.com/our-rates), [TechCrunch](https://techcrunch.com/2021/05/05/studysmarter-books-15m-for-a-global-personalized-learning-push/)

---

### Pricing Benchmark Vergelijking

| Platform | Oorsprong | Free tier | Premium (jaar) | B2B/Institutional |
|----------|-----------|-----------|----------------|-------------------|
| **Quizlet** | VS 🇺🇸 (unicorn) | Beperkt | ~€36-96 | Custom quotes, volume korting |
| **Brainscape** | VS 🇺🇸 | Basis | ~€96 | Niet prominent |
| **StudySmarter** | DE 🇩🇪 | Goed | ~€70 | Partnerships met universiteiten |
| **Anki** | Open source | Volledig | N/A | N/A |
| **Naturae** | NL 🇳🇱 | Goed (50MB) | €TBD | In ontwikkeling |

---

### Andere Flashcard Apps

| App | Oorsprong | Prijsmodel | Sterke punt |
|-----|-----------|-----------|-------------|
| **Anki** | Open source | Gratis (desktop), $25 iOS | Krachtig, complex, "designed in 2006" |
| **RemNote** | VS | Freemium | Note-taking + auto flashcards |
| **Mochi Cards** | VS | Freemium | Markdown support, developer-friendly |

---

### Natuur-specifieke Apps

| App | Focus | Leren vs Identificatie |
|-----|-------|------------------------|
| **BirdID** | Vogels (EU) | ✅ Leren (quiz) |
| **Merlin** | Vogels (worldwide) | ❌ Alleen identificatie |
| **iNaturalist** | Alle soorten | ❌ Alleen identificatie |
| **Larkwire** | Vogelgeluiden | ✅ Leren (quiz games) |

---

### Gap in de Markt

**Geen enkele app combineert:**
- ✅ Leren (flashcards + quiz)
- ✅ Alle soortengroepen (niet alleen vogels)
- ✅ GBIF integratie (foto's met attributie)
- ✅ Xeno-canto integratie (geluiden)
- ✅ Foto-annotaties
- ✅ Taxonomische distractors

**Dit was de frustratie die tot Naturae leidde** - als ecoloog miste ik dit en besloot het zelf te bouwen. Dit is een krachtig verhaal voor de internationale uitrol.

---

## Differentiatie & Kansen

### Waarom niet Quizlet?

- €6.000+/jaar voor organisatie met 500 gebruikers
- Geen natuur-specifieke features (GBIF, Xeno-canto)
- Geen taxonomische distractors in quiz
- Geen foto-annotaties
- **Amerikaans big-tech bedrijf** - geen invloed op roadmap, data naar VS

### Waarom niet Anki?

- Niet gebruiksvriendelijk ("designed in 2006")
- Geen organisatie features
- Geen centrale voortgang tracking
- Complexe setup voor niet-technische gebruikers

### Waarom niet Brainscape/StudySmarter?

- Geen natuur-specifieke integraties
- Geen taxonomische kennis in quiz algoritme
- Geen foto-annotaties voor kenmerken

### Naturae's Unieke Positie

| Voordeel | Details |
|----------|---------|
| **GBIF integratie** | Foto's met automatische attributie |
| **Xeno-canto** | Vogelgeluiden uit hele wereld |
| **Foto-annotaties** | Kenmerken aanwijzen |
| **Taxonomische distractors** | Verwante soorten als foute opties |
| **Alle soortengroepen** | Niet alleen vogels |

### Europees Platform als USP 🇪🇺

In het huidige klimaat is "Europees alternatief" een sterke positionering:

| Aspect | Big Tech (Quizlet) | Naturae |
|--------|-------------------|---------|
| **Oorsprong** | San Francisco, VS | Nederland, EU |
| **Data** | Naar Amerikaanse servers | EU hosting (Vercel EU, Supabase EU) |
| **Invloed** | Geen - je bent een nummer | Direct contact met developer |
| **Roadmap** | Bepaald door investeerders | Bepaald door community |
| **Sentiment** | Anti-big-tech groeit | Pro-Europese IT autonomie |

**Voor pitch naar organisaties:**
- GDPR compliant by design
- Geen vendor lock-in met Amerikaanse tech giants
- Support in het Nederlands
- Features op maat mogelijk

### Unieke Feature Ideeën

**Excursie Mode:**
- GPS-gebaseerde quiz tijdens wandeling
- "Welke soorten kun je hier tegenkomen?"
- Offline beschikbaar

**Seizoensgebonden Leren:**
- Automatische suggesties: "Nu trekvogels leren!"
- Koppeling met waarneming.nl data

**Certificering:**
- Officiële samenwerking met KNNV/IVN
- Erkende certificaten voor soortenkennis

---

## Feature Planning

### Gemeenschappelijke Behoeften

| Feature | KNNV | HVHL | Bureau |
|---------|------|------|--------|
| Organisatiepagina met branding | ✅ | ✅ | ✅ |
| Leden/studenten uitnodigen | ✅ | ✅ | ✅ |
| Gecureerde leersets | ✅ | ✅ | ✅ |
| Voortgang dashboard | ✅ | ✅ | ✅ |
| Private/interne sets | ❓ | ✅ | ✅ |
| Groepen/klassen | ✅ | ✅ | ❓ |
| Certificaten | ❓ | ❓ | ✅ |
| Quiz scores exporteren | ❓ | ✅ | ✅ |

### Prioriteit 1: Basis Organisatie (MVP)

| Feature | Beschrijving | Complexiteit |
|---------|--------------|--------------|
| **Organisatie aanmaken** | Naam, logo, beschrijving, slug | Medium |
| **Organisatie URL** | `/org/knnv` landing page | Medium |
| **Leden uitnodigen** | Via link, met invite code | Medium |
| **Decks toewijzen** | Organisator selecteert decks | Laag |
| **Uitgelichte sets** | Featured op org pagina | Laag |
| **Basis rollen** | Owner vs Member | Laag |

### Prioriteit 2: Voortgang Tracking

| Feature | Beschrijving | Complexiteit |
|---------|--------------|--------------|
| **Organisatie dashboard** | Admin ziet wie wat heeft gestudeerd | Medium |
| **Per-lid statistieken** | Study tijd, scores, laatst actief | Medium |
| **Moeilijke kaarten** | Aggregate: welke kaarten zijn lastig | Medium |

### Prioriteit 3: Groepen/Klassen

| Feature | Beschrijving | Complexiteit |
|---------|--------------|--------------|
| **Groep aanmaken** | Binnen organisatie (bijv. "Cursus 2026") | Medium |
| **Groep leden** | Subset van org leden | Laag |
| **Groep decks** | Decks toewijzen aan groep met deadline | Laag |

### Prioriteit 4: Live Features

| Feature | Beschrijving | Complexiteit |
|---------|--------------|--------------|
| **Live Quiz** | Multiplayer quiz sessie (Quizlet Live-style) | Hoog |
| **Join via code** | Geen account nodig om mee te doen | Medium |
| **Realtime scores** | Leaderboard tijdens quiz | Hoog |

### Prioriteit 5: Enterprise

| Feature | Beschrijving | Complexiteit |
|---------|--------------|--------------|
| **Branding** | Custom kleuren, logo prominent | Laag |
| **Meerdere beheerders** | Co-admins toevoegen | Medium |
| **Certificaten** | Automatisch na voltooien | Medium |
| **Rapportage export** | CSV/PDF van voortgang | Medium |
| **SSO** | SAML voor onderwijsinstellingen | Hoog |

---

## Database Architectuur

### Huidige Status

**De huidige Supabase database heeft GEEN organization tabellen.**

Bestaande tabellen (uit `001_initial_schema.sql`):
- `profiles` - gebruikers (heeft `storage_used_bytes`, `plan_type`)
- `decks` - leersets (heeft `user_id`, geen `organization_id`)
- `cards`, `card_media` - kaarten en media
- `user_progress` - individuele voortgang
- `tags`, `deck_tags` - tagging systeem
- `deck_likes` - likes op decks

**Wat we moeten toevoegen:**
- Volledige organizations structuur (6 nieuwe tabellen)
- RLS policies voor org-based access
- Triggers voor licentie tracking
- Mogelijk: uitbreiding `profiles` met org membership cache

### Schema (Conceptueel)

```sql
-- Organisaties
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,        -- URL: /org/knnv
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  settings JSONB,                   -- { isPrivate: bool, allowPublicSets: bool }
  tier TEXT DEFAULT 'free',         -- 'free', 'pro', 'enterprise'
  created_at TIMESTAMP,
  created_by UUID REFERENCES profiles(id)
);

-- Organisatie leden
CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member',       -- 'owner', 'admin', 'member'
  joined_at TIMESTAMP,
  invited_by UUID REFERENCES profiles(id),
  PRIMARY KEY (organization_id, user_id)
);

-- Organisatie leersets (link tussen org en bestaande decks)
CREATE TABLE organization_decks (
  organization_id UUID REFERENCES organizations(id),
  deck_id UUID REFERENCES decks(id),
  is_featured BOOLEAN DEFAULT false,  -- Uitgelicht op org pagina
  is_required BOOLEAN DEFAULT false,  -- Verplicht voor leden
  added_at TIMESTAMP,
  added_by UUID REFERENCES profiles(id),
  PRIMARY KEY (organization_id, deck_id)
);

-- Groepen binnen organisatie (voor cursussen/klassen)
CREATE TABLE organization_groups (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP
);

-- Groep leden
CREATE TABLE organization_group_members (
  group_id UUID REFERENCES organization_groups(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member',       -- 'leader', 'member'
  joined_at TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);

-- Groep toegewezen leersets
CREATE TABLE organization_group_decks (
  group_id UUID REFERENCES organization_groups(id),
  deck_id UUID REFERENCES decks(id),
  due_date TIMESTAMP,               -- Optioneel: deadline
  assigned_at TIMESTAMP,
  PRIMARY KEY (group_id, deck_id)
);

-- Voortgang tracking (aggregate per groep)
CREATE TABLE organization_progress (
  organization_id UUID REFERENCES organizations(id),
  group_id UUID REFERENCES organization_groups(id),  -- nullable
  user_id UUID REFERENCES profiles(id),
  deck_id UUID REFERENCES decks(id),
  cards_studied INTEGER,
  cards_mastered INTEGER,
  study_time_seconds INTEGER,
  last_studied_at TIMESTAMP,
  PRIMARY KEY (organization_id, user_id, deck_id)
);
```

### URL Structuur

```
/org/knnv                    → Organisatie landing page
/org/knnv/sets               → Alle leersets van org
/org/knnv/members            → Ledenlijst (alleen voor leden)
/org/knnv/groups             → Groepen/cursussen
/org/knnv/groups/[id]        → Specifieke groep
/org/knnv/admin              → Admin dashboard
/org/knnv/admin/progress     → Voortgang overzicht
/org/knnv/admin/members      → Leden beheer
```

---

## Pricing Model

### Benchmark: Wat kost de concurrentie?

| Platform | Individueel/jaar | Per seat bij volume | 100 users/jaar |
|----------|-----------------|---------------------|----------------|
| **Quizlet** | €36 | ~€12-20 (geschat) | ~€1.200-2.000 |
| **Brainscape** | €96 | Niet prominent | ~€9.600 (geen korting) |
| **StudySmarter** | €70 | University partnerships | Onbekend |

**Conclusie:** Quizlet is de benchmark voor B2B pricing. ~€12-20/seat/jaar bij volume is marktconform.

---

### Optie A: Tiered per organisatie (aanbevolen voor start)

| Tier | Prijs | Leden | Features |
|------|-------|-------|----------|
| **Free** | €0 | Max 10 | 1 admin, publieke sets, basis voortgang |
| **Pro** | €25/maand (€300/jaar) | Max 100 | 5 admins, private sets, volle voortgang |
| **Enterprise** | Custom | Onbeperkt | SSO, branding, dedicated support |

**Effectieve prijs per seat:**
- Pro met 100 leden: €3/jaar/user (zeer competitief vs Quizlet)
- Pro met 50 leden: €6/jaar/user (nog steeds competitief)

---

### Optie B: Per gebruiker (schaalt beter)

| Volume | Prijs/user/maand | Prijs/user/jaar | 100 users/jaar |
|--------|------------------|-----------------|----------------|
| 1-10 | €2 | €24 | €2.400 |
| 11-50 | €1.50 | €18 | €1.800 |
| 51-200 | €1 | €12 | €1.200 |
| 200+ | €0.75 | €9 | - |

**Minimum:** €10/maand ongeacht aantal users.

---

### Optie C: Partnerschap (non-profit)

Voor KNNV/IVN type organisaties:
- Jaarlijkse bijdrage (€500-2000)
- Invloed op roadmap
- Feature requests priority
- Geen per-gebruiker kosten

**Voordeel:** Eenvoudig, voorspelbaar, bouwt relatie
**Nadeel:** Schaalt niet, niet geschikt voor commerciële bureaus

---

### B2C vs B2B: Wat krijgt een org-member?

**Scenario:** KNNV betaalt Pro (€25/maand), member Jan heeft geen eigen Premium.

**Optie 1: Alleen org-features**
- Jan kan org leersets studeren
- Jan kan NIET zelf 1GB storage krijgen
- Jan moet zelf Premium kopen voor individuele features

**Optie 2: Volledige Premium via org**
- Jan krijgt alle Premium features zolang hij org-lid is
- Complexer qua licentie tracking
- Kan kannibaliseren op individuele Premium verkoop

**Aanbeveling:** Start met Optie 1 (eenvoudiger), later uitbreiden.

---

## Implementatie Roadmap

### Fase 1: MVP Organisaties (4-6 weken)
- [ ] Organisatie CRUD (aanmaken, bewerken, verwijderen)
- [ ] Organisatie slug/URL (`/org/knnv`)
- [ ] Invite link systeem
- [ ] Leersets toevoegen aan organisatie
- [ ] Uitgelichte sets op organisatiepagina
- [ ] Basis admin rol (owner vs member)

### Fase 2: Voortgang (4-6 weken)
- [ ] Study tracking per org/deck/user
- [ ] Dashboard voor org admin
- [ ] "Moeilijke kaarten" aggregatie

### Fase 3: Groepen (4-6 weken)
- [ ] Groepen binnen organisatie
- [ ] Groep leden beheer
- [ ] Deck toewijzing met deadlines

### Fase 4: Live Features (6-8 weken)
- [ ] Multiplayer quiz mode
- [ ] Join via code (geen account)
- [ ] Realtime leaderboard

### Fase 5: Enterprise (later)
- [ ] Branding customization
- [ ] Certificaten genereren
- [ ] Rapportage export
- [ ] SSO voor onderwijsinstellingen
- [ ] API voor integraties

---

## Open Vragen

### Strategisch

1. **Wat is de absolute MVP?** Welke features zijn minimaal nodig voor een eerste pilot met KNNV?

2. **Private vs publiek?**
   - KNNV wil waarschijnlijk publieke sets (community)
   - Bureaus willen private sets (interne training)
   - Hoe combineren?

3. **Pricing strategie?**
   - Non-profits anders behandelen dan commercieel?
   - Freemium of direct betaald?
   - Hoe verhoudt onze pricing zich tot Quizlet (~€12/seat/jaar bij volume)?

### Licentie & Rollen Model

4. **Hoeveel licenties kan een owner uitdelen?**
   - Vaste hoeveelheid bij tier (Free: 10, Pro: 100)?
   - Of dynamisch inkopen per seat?

5. **Hoe lang zijn licenties geldig?**
   - 1 jaar zoals Quizlet for Schools?
   - Maandelijks opzegbaar?
   - Gekoppeld aan organisatie-abonnement?

6. **Wat krijgt een member via org-licentie?**
   - Alleen toegang tot org content?
   - Of ook Naturae Premium features (meer storage, etc.)?
   - Wat als member ook eigen Premium heeft?

7. **Rollen complexiteit:**
   - Owner → Admin → Member voldoende?
   - Of ook: Cursusleider, Student, Gast?
   - Verschillende rechten per groep binnen org?

### Technisch

8. **Technische integraties?**
   - SSO voor onderwijsinstellingen (SAML)?
   - LMS integratie (Canvas, Brightspace)?

9. **Study algoritmes & statistieken:**
   - Hoe aggregeren we voortgang over org?
   - Welke metrics tonen aan cursusleiders?
   - Lage prioriteit maar moet uitgedacht worden

### Juridisch

10. **Content eigenaarschap?**
    - Wie bezit sets gemaakt door leden binnen org?
    - Wat gebeurt als org stopt?
    - Kan member eigen sets meenemen bij vertrek?

---

## Volgende Stappen

1. **Feedback verzamelen:**
   - [ ] KNNV (Jaap): Wat zijn must-haves?
   - [ ] HVHL docent: Interesse in pilot?
   - [ ] De Boominspecteurs (via Rosanne): Behoefte verkennen

2. **MVP definiëren:**
   - [ ] Scope bepalen voor eerste versie
   - [ ] Database migratie schrijven
   - [ ] UI mockups maken

3. **Pilot plannen:**
   - [ ] Eerste organisatie selecteren
   - [ ] Timeline bepalen
   - [ ] Succes metrics definiëren

---

## Bronnen

### Quizlet
- [Quizlet for Teachers](https://quizlet.com/teachers)
- [Quizlet Class Progress](https://quizlet.com/features/teacher-class-progress)
- [Quizlet Live](https://quizlet.com/features/live)
- [Quizlet for Schools](https://quizlet.com/features/quizletforschools)
- [Quizlet Group Pricing Calculator](https://quizlet.com/upgrade/plus/group)
- [Is Quizlet Plus Worth It 2025](https://aiflowreview.com/is-quizlet-plus-worth-it-in-2025/)

### Brainscape
- [Brainscape Pricing](https://www.brainscape.com/pricing)
- [How Brainscape Was Born](https://www.brainscape.com/academy/how-brainscape-was-born/)
- [Brainscape Wikipedia](https://en.wikipedia.org/wiki/Brainscape)
- [Brainscape Revenue Data - Latka](https://getlatka.com/companies/brainscape)

### StudySmarter
- [StudySmarter Pricing](https://www.studysmarter.com/our-rates)
- [StudySmarter $15M Funding - TechCrunch](https://techcrunch.com/2021/05/05/studysmarter-books-15m-for-a-global-personalized-learning-push/)
- [StudySmarter Company Profile - Tracxn](https://tracxn.com/d/companies/studysmarter)

### Competitor Reviews
- [Best Anki Alternatives - Scholarly](https://scholarly.so/blog/best-anki-alternatives)
- [Best Flashcard Apps 2025 - Memrizz](https://www.memrizz.com/blogs/best-flashcard-apps-of-2025-top-ai-powered-tools-to-boost-your-study-sessions)

### Nature ID Apps
- [Best Apps for Birding - Audubon](https://www.audubon.org/magazine/best-apps-birding-and-field-identification)
- [Merlin Bird ID](https://merlin.allaboutbirds.org/)

### Gerelateerde Documentatie

| Document | Relatie |
|----------|---------|
| [KNNV Feedback Jaap](../research/knnv-feedback-jaap-graveland.md) | Context voor eerste pilot |
| [Premium Features](premium-features.md) | B2C premium tier als basis |
| [Business Model - Marktanalyse](../operations/business-model.md#marktanalyse-tamsomsom) | TAM/SAM/SOM voor B2B en B2C |
| [Internationalisering](../research/internationalisering-i18n.md) | Europese expansie strategie |

---

*Laatst bijgewerkt: 3 februari 2026*
