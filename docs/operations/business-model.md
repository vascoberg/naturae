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

## Pricing Analyse (Februari 2026)

> Analyse van pricing tiers en waarom "storage-only" geen goede optie is.

### Overwogen Opties

| Optie | Prijs | Wat krijgt de user |
|-------|-------|-------------------|
| **A: Storage-only** | €5/jaar | Alleen extra opslag (500 MB → 1 GB) |
| **B: Premium all-in** | €50/jaar | Extra opslag (1 GB) + alle premium features |

### Waarom Storage-Only Niet Werkt

#### 1. Kosten vs Opbrengst

```
Supabase Pro upgrade trigger: wanneer 1 GB vol is
Supabase Pro kosten: $25/maand = ~€280/jaar

Bij €5/jaar voor 500 MB extra:
- Break-even: 280 / 5 = 56 betalende users nodig
- Maar: 56 users × 500 MB = 28 GB storage
- Conclusie: marge is laag, veel users nodig
```

#### 2. Exploitatie Risico (het "churner" scenario)

```
Januari: User betaalt €5, krijgt 500 MB extra
         → Upload 400 MB aan media
Februari: User zegt op, terug naar gratis (50 MB limiet)
         → Heeft nog steeds 400 MB data
         → Kan gratis blijven leren met al die content
         → Betaalt nooit meer
```

**Probleem:** User krijgt permanente waarde (opgeslagen media) voor eenmalige betaling.

#### 3. Andere Redenen

| Probleem | Uitleg |
|----------|--------|
| **Lage perceived value** | "Alleen opslag" voelt niet premium |
| **Commodity pricing** | Concurreren op prijs i.p.v. waarde |
| **Complexiteit** | Twee betaalde tiers = meer code, edge cases |
| **Geen lock-in** | Makkelijk op te zeggen, geen feature-afhankelijkheid |

### Aanbevolen Pricing Model

| Tier | Prijs | Storage | Features |
|------|-------|---------|----------|
| **Free** | €0 | 50 MB | Basis functionaliteit |
| **Premium** | €50/jaar (~€4.17/maand) | 1 GB | Alles |

### Financiële Scenario's

#### Aannames
- 10% conversie (industry standaard freemium)
- Premium users gebruiken gemiddeld 50% van hun storage limiet

#### Scenario A: 100 gebruikers

| Segment | Users | Storage gebruikt |
|---------|-------|------------------|
| Free (90%) | 90 | 90 × 25 MB = 2.25 GB |
| Premium (10%) | 10 | 10 × 500 MB = 5 GB |
| **Totaal** | 100 | **7.25 GB** |

| | Bedrag |
|--|--------|
| Omzet | 10 × €50 = **€500/jaar** |
| Kosten (Supabase Pro) | ~€280/jaar |
| **Winst** | **€220/jaar** |

#### Scenario B: 500 gebruikers

| Segment | Users | Storage |
|---------|-------|---------|
| Free | 450 | 11.25 GB |
| Premium | 50 | 25 GB |
| **Totaal** | 500 | **36.25 GB** |

| | Bedrag |
|--|--------|
| Omzet | **€2.500/jaar** |
| Kosten | ~€280/jaar |
| **Winst** | **€2.220/jaar** |

#### Scenario C: 1.000 gebruikers

| Segment | Users | Storage |
|---------|-------|---------|
| Free | 900 | 22.5 GB |
| Premium | 100 | 50 GB |
| **Totaal** | 1000 | **72.5 GB** |

| | Bedrag |
|--|--------|
| Omzet | **€5.000/jaar** |
| Kosten | ~€280/jaar |
| **Winst** | **€4.720/jaar** |

---

## Downgrade Scenario's

> Wat gebeurt er als een betalende user stopt met betalen?

### Het Probleem

```
Situatie:
- User heeft Premium (1 GB limiet)
- Heeft 800 MB aan media geüpload
- Zegt abonnement op
- Nu: 800 MB data, maar 50 MB limiet

Vraag: Wat doen we met die 750 MB "overschot"?
```

### Mogelijke Strategieën

#### ❌ Optie 1: Hard Delete
Automatisch media verwijderen tot onder limiet.

| Pro | Con |
|-----|-----|
| Simpel te implementeren | **Dataverlies** - onacceptabel |
| Duidelijk voor user | Slechte PR, boze users |
| | Juridische risico's |

**Conclusie:** Niet doen.

#### ✅ Optie 2: Soft Lock (Aanbevolen)
Data behouden, maar nieuwe uploads blokkeren.

| Pro | Con |
|-----|-----|
| Geen dataverlies | User kan "gratis" blijven leren |
| Goede UX | Kost ons storage |
| Industry standaard | |

**Implementatie:**
```
Bij downgrade:
1. Behoud alle bestaande data
2. Blokkeer nieuwe media uploads
3. Blokkeer nieuwe deck creatie (als boven deck limiet)
4. Toon banner: "Je bent boven je limiet. Upgrade of verwijder content."
5. Bestaande content blijft volledig bruikbaar
```

#### ⚠️ Optie 3: Grace Period
X dagen om te exporteren/verwijderen, daarna soft lock of delete.

| Pro | Con |
|-----|-----|
| Geeft user tijd | Complexer te implementeren |
| Fair warning | Nog steeds dataverlies risico |

**Bruikbaar als:** Combinatie met Optie 2 - grace period voordat soft lock actief wordt.

#### ❌ Optie 4: Grandfather (Legacy)
Bestaande data voor altijd behouden zonder restricties.

| Pro | Con |
|-----|-----|
| Maximale goodwill | **Exploiteerbaar** |
| | Geen incentive om te blijven betalen |

**Conclusie:** Te exploiteerbaar.

### Aanbevolen Implementatie: Soft Lock

```typescript
// Pseudo-code voor upload check
async function canUpload(userId: string, fileSize: number) {
  const { used, limit, planType } = await getStorageUsage(userId);

  // Altijd checken tegen huidige plan limiet
  if (used + fileSize > limit) {
    return {
      allowed: false,
      reason: planType === 'free'
        ? 'storage_limit_free'
        : 'storage_limit_premium',
      suggestion: planType === 'free'
        ? 'Upgrade naar Premium voor meer opslag'
        : 'Je hebt je opslaglimiet bereikt'
    };
  }

  return { allowed: true };
}
```

### UI/UX bij Downgrade

#### Direct na downgrade
```
┌────────────────────────────────────────────┐
│ ⚠️ Je account is teruggezet naar Gratis    │
│                                            │
│ Je huidige opslag: 800 MB                  │
│ Gratis limiet: 50 MB                       │
│                                            │
│ Je bestaande content blijft beschikbaar,   │
│ maar je kunt geen nieuwe media uploaden.   │
│                                            │
│ [Upgrade naar Premium]  [Beheer opslag]    │
└────────────────────────────────────────────┘
```

#### In de app (persistent banner)
```
┌────────────────────────────────────────────┐
│ 📦 Je bent boven je opslaglimiet (800/50MB)│
│ [Upgrade] of [Verwijder content]           │
└────────────────────────────────────────────┘
```

#### Bij upload poging
```
┌────────────────────────────────────────────┐
│ ❌ Upload niet mogelijk                     │
│                                            │
│ Je bent boven je opslaglimiet.             │
│ Verwijder eerst media of upgrade.          │
│                                            │
│ [Upgrade naar Premium]  [Beheer opslag]    │
└────────────────────────────────────────────┘
```

### Edge Cases

| Scenario | Gedrag |
|----------|--------|
| User maakt nieuw deck (boven deck limiet) | Blokkeren, toon upgrade prompt |
| User bewerkt bestaand deck | Toegestaan |
| User voegt kaart toe (zonder media) | Toegestaan |
| User voegt kaart toe met media | Blokkeren upload |
| User verwijdert media | Toegestaan, update storage_used |
| User exporteert deck | Altijd toegestaan |

---

## Hoe Limieten Normaal Werken

> Vergelijking met hoe andere apps dit doen.

### Huidige Naturae Implementatie (Simpel)

```sql
-- profiles tabel
storage_used_bytes BIGINT DEFAULT 0
plan_type TEXT DEFAULT 'free'

-- Bij upload: check tegen hardcoded limiet
-- Bij delete: decrement storage_used_bytes
```

**Voordelen:** Simpel, werkt voor MVP
**Nadelen:** Geen subscription management, handmatig plan wijzigen

### Industry Standard Aanpak

#### 1. Subscription Management (Stripe/Paddle)

```
┌─────────────┐     webhook      ┌─────────────┐
│   Stripe    │ ───────────────→ │   Naturae   │
│  (billing)  │                  │  (backend)  │
└─────────────┘                  └─────────────┘
       │                                │
       │ customer.subscription.updated  │
       └────────────────────────────────┘
                     │
                     ▼
            ┌─────────────────┐
            │ UPDATE profiles │
            │ SET plan_type = │
            │ 'premium'       │
            └─────────────────┘
```

**Voordelen:**
- Automatische plan sync via webhooks
- Handles cancellations, upgrades, downgrades
- Payment retry, dunning emails
- Subscription analytics

#### 2. Entitlements Systeem (Geavanceerd)

```sql
-- Aparte tabel voor wat users mogen
CREATE TABLE user_entitlements (
  user_id UUID REFERENCES profiles(id),
  entitlement TEXT,  -- 'storage_1gb', 'premium_features', etc.
  granted_at TIMESTAMP,
  expires_at TIMESTAMP,
  source TEXT  -- 'subscription', 'gift', 'promotion'
);

-- Voorbeelden
INSERT INTO user_entitlements VALUES
  ('user-123', 'storage_1gb', NOW(), '2027-02-03', 'subscription'),
  ('user-456', 'storage_500mb', NOW(), NULL, 'gift');  -- nooit expireert
```

**Voordelen:**
- Flexibel: geef iemand gratis extra storage als gift
- Promoties: "1 maand gratis premium"
- Granular: specifieke features aan/uit zetten
- Audit trail: wanneer kreeg iemand wat

**Nadelen:**
- Complexer dan simpele plan_type kolom
- Meer queries nodig

#### 3. Usage-Based Billing (Complexst)

```sql
-- Track elke actie
CREATE TABLE usage_events (
  user_id UUID,
  event_type TEXT,  -- 'storage_upload', 'api_call', etc.
  amount BIGINT,
  created_at TIMESTAMP
);

-- Maandelijks aggregeren en factureren
SELECT
  user_id,
  SUM(amount) as total_storage_bytes,
  SUM(amount) * 0.00001 as cost_eur  -- €0.01 per MB
FROM usage_events
WHERE event_type = 'storage_upload'
  AND created_at > DATE_TRUNC('month', NOW())
GROUP BY user_id;
```

**Gebruikt door:** AWS, Vercel, sommige API services
**Niet geschikt voor:** Consumer apps zoals Naturae (te complex voor users)

### Aanbeveling voor Naturae

#### Fase 1: Nu (Soft Launch)
Huidige simpele implementatie is prima:
- `plan_type` in profiles
- Hardcoded limieten in code
- Handmatig upgraden via Supabase dashboard

#### Fase 2: Bij Stripe Integratie
```sql
-- Uitbreiding profiles
subscription_id TEXT,           -- Stripe subscription ID
subscription_status TEXT,       -- 'active', 'canceled', 'past_due'
subscription_ends_at TIMESTAMP, -- Wanneer loopt het af
```

Webhook handlers voor:
- `customer.subscription.created` → set plan_type = 'premium'
- `customer.subscription.deleted` → set plan_type = 'free'
- `customer.subscription.updated` → handle plan changes

#### Fase 3: Optioneel (Bij Groei)
Entitlements systeem alleen als nodig voor:
- Promoties/gifting
- Organisatie accounts met custom limieten
- A/B testing van limieten

---

## Implementatie Checklist Downgrade

- [ ] **Database:** Geen wijzigingen nodig (soft lock werkt met bestaande structuur)
- [ ] **Upload check:** Controleer altijd tegen huidige plan limiet
- [ ] **UI Banner:** Toon warning bij overschrijding
- [ ] **Stripe webhook:** Handle `subscription.deleted` event
- [ ] **Email:** Stuur notificatie bij downgrade
- [ ] **Export:** Zorg dat export altijd werkt (ook boven limiet)

---

## Marktanalyse: TAM/SAM/SOM

> Schatting van de marktomvang op basis van gebruikersaantallen van natuurwaarnemingsplatforms.

**Gerelateerd:** [Organization Pages - Competitive Analyse](../features/organization-pages.md) voor B2B pricing benchmarks.

### Databronnen (Februari 2026)

| Platform | Bereik | Gebruikers | Waarnemingen | Bron |
|----------|--------|------------|--------------|------|
| **waarneming.nl** | Nederland | 100k+ actieve (2023), 230k accounts (2021) | 14M+ (2023) | [CLO](https://www.clo.nl/indicatoren/nl062501-citizen-science-voor-natuur), [Wikipedia](https://nl.wikipedia.org/wiki/Waarneming.nl) |
| **observation.org** | Wereldwijd | ~500k (doel) | 238M entries, 82M foto's | [LinkedIn](https://www.linkedin.com/company/observation-org), [GBIF](https://www.gbif.org/publisher/c8d737e0-2ff8-42e8-b8fc-6b805d26fc5f) |
| **iNaturalist** | Wereldwijd | 3.3M observers, ~600k MAU, ~245k uploaders/maand | 200M+ (sept 2024) | [iNat Blog](https://www.inaturalist.org/blog/91752-3-000-000-observers), [BioScience](https://academic.oup.com/bioscience/article/75/11/953/8185761) |
| **eBird** | Wereldwijd | 122k nieuwe (2024), 1.3M Global Big Day | 2 miljard (juni 2025) | [eBird Year Review 2024](https://ebird.org/news/2024-year-in-review) |
| **Merlin Bird ID** | Wereldwijd | 7.5M nieuwe (2024) | - | [eBird Year Review 2024](https://ebird.org/news/2024-year-in-review) |

**Opmerking:** "Actieve" gebruiker = minimaal 1 waarneming/jaar. MAU = monthly active users.

### Natuur-specifieke Apps (Identificatie & Leren)

| App | Type | Gebruikers | Details | Bron |
|-----|------|------------|---------|------|
| **Merlin Bird ID** | Identificatie | 23M totaal downloads, 12M actief in 2024 | Cornell Lab, Sound ID populairste feature (1.3B IDs) | [eBird 2024 Review](https://ebird.org/news/2024-year-in-review), [Cornell](https://alumni.cornell.edu/cornellians/merlin-bird-app/) |
| **BirdID** | Leren (quiz) | ~100k downloads | Nord University, 380 Europese soorten, meertalig | [Aptoide](https://birdid-nord-university.en.aptoide.com/app) |
| **Picture Bird** | Identificatie | 1M+ users | Glority, AI foto/geluid herkenning, 1000+ soorten | [SimilarWeb](https://www.similarweb.com/app/google-play/com.glority.picturebird/statistics/) |
| **ObsIdentify** | Identificatie | Onbekend | Observation.org, Europa focus, AI herkenning 28k soorten | [Observation.org](https://observation.org/apps/obsidentify/) |
| **Larkwire** | Leren (quiz) | Onbekend (niche) | Game-based vogelgeluid leren, betaald | [Larkwire](https://www.larkwire.com/) |

**Belangrijke inzichten:**
- Merlin domineert de identificatie-markt met 23M downloads
- BirdID is de enige echte concurrent voor quiz-based leren, maar heeft slechts ~100k downloads
- De leer-markt (quiz/flashcards) is veel kleiner dan identificatie-markt
- Naturae's niche (alle soortengroepen + GBIF/Xeno-canto + quiz) heeft weinig directe concurrentie

### Total Addressable Market (TAM) - Wereldwijd

De TAM bestaat uit alle mensen die actief bezig zijn met soorten herkennen in de natuur.

| Segment | Geschatte grootte | Onderbouwing |
|---------|------------------|--------------|
| **Vogels** | 10-15M actieve birders | eBird cumulatief + Merlin groeicijfers, minus overlap |
| **Biodiversiteit breed** | 3-5M observers | iNaturalist (3.3M) + Observation.org (~500k), minus overlap |
| **Overlap correctie** | -20% | Conservatieve schatting; veel birders ook op iNat |
| **TAM Totaal** | **~10-16M mensen wereldwijd** | Actieve natuurwaarnemers die soorten willen leren |

**Kanttekening:** Niet iedereen die waarneemt wil ook *leren*. Veel gebruikers doen alleen identificatie (Merlin, iNat Seek). De subset die actief wil studeren is kleiner - schatting 30-50% van bovenstaande.

**B2B TAM:** Organisaties die soortherkenning trainen (grove schattingen)
- Natuurverenigingen: ~5.000 wereldwijd
- Universiteiten (biologie/ecologie): ~3.000 programma's
- Adviesbureaus ecologie: ~2.000 bedrijven
- NME/educatiecentra: ~10.000

### Serviceable Addressable Market (SAM) - Europa

Naturae's realistische markt gegeven taal (NL/EN) en focus:

| Segment | Geschatte grootte | Berekening |
|---------|------------------|------------|
| **Nederland** | 150-200k | waarneming.nl actief + casual interesse |
| **België (NL)** | 50-75k | waarnemingen.be + Vlaamse natuurverenigingen |
| **West-Europa (EN)** | 500k-1M | UK, Duitsland, Scandinavië (Engels als fallback) |
| **SAM B2C Totaal** | **~700k-1.3M mensen** | Europese natuurwaarnemers |

**B2B SAM Europa:**
| Type | Aantal | Voorbeelden |
|------|--------|-------------|
| Natuurverenigingen | ~500 | KNNV, IVN, NABU, RSPB |
| Hogescholen/universiteiten | ~200 | HVHL, WUR, etc. |
| Ecologische adviesbureaus | ~300 | Arcadis, Tauw, etc. |
| NME centra | ~500 | Regionale educatiecentra |
| **Totaal** | **~1.500 organisaties** | |

### Serviceable Obtainable Market (SOM) - Realistische Doelen

Wat Naturae daadwerkelijk kan bereiken in de eerste jaren:

#### B2C (Individuele Gebruikers)

| Fase | Tijdframe | Doelgebruikers | % van SAM |
|------|-----------|----------------|-----------|
| Soft launch | Q1 2026 | 100-500 | <0.1% |
| Groei NL | 2026 | 1.000-5.000 | 0.5-2.5% |
| Europese expansie | 2027 | 10.000-25.000 | 1-2% |
| Matuur | 2028+ | 50.000-100.000 | 5-10% |

**Revenue potentieel B2C (bij 10% conversie naar Premium €50/jaar):**

| Users | Premium users | Jaaromzet |
|-------|---------------|-----------|
| 1.000 | 100 | €5.000 |
| 10.000 | 1.000 | €50.000 |
| 50.000 | 5.000 | €250.000 |

#### B2B (Organisaties)

| Fase | Tijdframe | Organisaties | Revenue model |
|------|-----------|--------------|---------------|
| Pilot | Q1 2026 | 1-3 (KNNV) | Gratis/feedback |
| Early adopters | 2026 | 5-15 | €500-2.000/jaar |
| Groei | 2027 | 30-50 | €1.000-5.000/jaar |
| Matuur | 2028+ | 100-200 | €2.000-10.000/jaar |

**Revenue potentieel B2B:**

| Organisaties | Gem. contract | Jaaromzet |
|--------------|---------------|-----------|
| 10 | €1.000 | €10.000 |
| 50 | €2.000 | €100.000 |
| 150 | €3.000 | €450.000 |

### Marktpositionering

#### Unieke Positie

```
                    Algemeen leren          Soorten leren
                    ─────────────────────────────────────
Grote platformen    │ Quizlet, Anki       │ (leeg)      │
                    ─────────────────────────────────────
Niche apps          │ Brainscape          │ BirdID,     │
                    │                     │ NATURAE ←   │
                    ─────────────────────────────────────
```

**Waarom deze positie werkt:**
1. Quizlet/Anki zijn niet geoptimaliseerd voor media-heavy soortherkenning
2. BirdID is alleen vogels, geen community/sharing
3. Naturae combineert GBIF/Xeno-canto data met leerplatform UX

#### Concurrentievoordelen per Segment

| Segment | Concurrent | Naturae's voordeel |
|---------|------------|-------------------|
| Hobbyist birders | BirdID | Alle soortengroepen, community decks |
| Natuurstudenten | Anki + eigen media | Geïntegreerde GBIF/Xeno-canto, minder werk |
| KNNV/IVN | Losse tools | Centrale plek, voortgang dashboard |
| Adviesbureaus | Interne training | Standaard platform, extern curriculum |

### Risico's en Aannames

| Aanname | Risico | Mitigatie |
|---------|--------|-----------|
| 10% conversie | Kan lager zijn voor niche | Focus op power users, waarde bieden |
| Europese groei | Taalbarrière voor niet-NL | Snelle EN vertaling, community vertalingen |
| B2B interesse | Organisaties hebben vaak legacy tools | Gratis pilots, integratie opties |
| Platform stickiness | Users vertrekken naar Anki/eigen oplossingen | Export mogelijk, maar betere UX als lock-in |

### Conclusie

**B2C:**
- Realistische markt in NL/BE: 100-200k potentiële users
- Met Europese expansie: 500k-1M bereikbaar
- Revenue potentieel: €50k-250k/jaar bij 10-50k users

**B2B:**
- ~1.500 relevante organisaties in Europa
- Revenue potentieel: €100k-450k/jaar bij 50-150 organisaties
- Hogere marges dan B2C, maar langere salescycles

**Aanbeveling:** Start B2C voor validatie en merkbekendheid, ontwikkel B2B als premium/enterprise tier voor stabiele recurring revenue.

---

## Revenue Analyse: TAM/SAM/SOM × Pricing

> Concrete revenue projecties door marktomvang te koppelen aan pricing modellen.

### Samenvatting Pricing Modellen

| Segment | Model | Prijs |
|---------|-------|-------|
| **B2C Free** | Freemium | €0 (50 MB) |
| **B2C Premium** | Jaarabonnement | €50/jaar |
| **B2B Tiered (Pro)** | Per organisatie | €300/jaar (max 100 leden) |
| **B2B Per-User** | Volume staffel | €9-24/user/jaar |
| **B2B Partnership** | Flat fee (non-profit) | €500-2.000/jaar |

### B2C Revenue Projecties

**Aannames:**
- 10% conversie gratis → Premium (industry standaard freemium)
- Premium prijs: €50/jaar

| Fase | Users | % van SAM (1M) | Premium (10%) | Revenue/jaar |
|------|-------|----------------|---------------|--------------|
| **Soft launch** (Q1 2026) | 500 | 0.05% | 50 | **€2.500** |
| **NL groei** (2026) | 3.000 | 0.3% | 300 | **€15.000** |
| **EU uitrol** (2027) | 15.000 | 1.5% | 1.500 | **€75.000** |
| **Matuur** (2028+) | 75.000 | 7.5% | 7.500 | **€375.000** |

**Gevoeligheidsanalyse conversie:**

| Users | 5% conversie | 10% conversie | 15% conversie |
|-------|--------------|---------------|---------------|
| 10.000 | €25.000 | €50.000 | €75.000 |
| 50.000 | €125.000 | €250.000 | €375.000 |
| 100.000 | €250.000 | €500.000 | €750.000 |

**Insight:** Bij 10% conversie is 50.000 users nodig voor €250k/jaar. Dit is ~5% van de SAM.

### B2B Revenue Projecties

**SAM:** ~1.500 organisaties in Europa

#### Scenario 1: Tiered Model (€300/jaar per org)

Effectieve prijs: €3-6/user/jaar (zeer competitief vs Quizlet €12-20/user)

| Fase | Organisaties | % van SAM | Revenue/jaar |
|------|--------------|-----------|--------------|
| **Pilot** (Q1 2026) | 3 | 0.2% | **€900** (gratis pilots) |
| **Early adopters** (2026) | 10 | 0.7% | **€3.000** |
| **Groei** (2027) | 40 | 2.7% | **€12.000** |
| **Matuur** (2028+) | 150 | 10% | **€45.000** |

**Probleem:** €300/org is te goedkoop voor serieuze revenue.

#### Scenario 2: Per-User Model (€12/user/jaar avg)

Vergelijkbaar met Quizlet volume pricing.

| Fase | Orgs | Avg. users/org | Total seats | Revenue/jaar |
|------|------|----------------|-------------|--------------|
| **Pilot** | 3 | 30 | 90 | **€1.080** |
| **Early adopters** | 10 | 50 | 500 | **€6.000** |
| **Groei** | 40 | 75 | 3.000 | **€36.000** |
| **Matuur** | 150 | 100 | 15.000 | **€180.000** |

**Insight:** Per-user schaalt beter dan flat-fee per organisatie.

#### Scenario 3: Partnership Model (non-profit focus)

| Type organisatie | Aantal | Avg. bijdrage | Revenue/jaar |
|------------------|--------|---------------|--------------|
| Natuurverenigingen (KNNV, IVN) | 20 | €1.000 | €20.000 |
| Hogescholen/universiteiten | 15 | €1.500 | €22.500 |
| NME centra | 30 | €750 | €22.500 |
| **Totaal (matuur)** | **65** | | **€65.000** |

**Voordeel:** Eenvoudig, voorspelbaar, bouwt relaties
**Nadeel:** Schaalt niet naar €100k+

#### Scenario 4: Hybrid (Aanbevolen)

Combineer partnership voor non-profits met per-user voor commercieel:

| Segment | Model | Orgs | Revenue |
|---------|-------|------|---------|
| **Non-profit** | Partnership €1.000/jaar | 50 | €50.000 |
| **Commercieel** (bureaus) | Per-user €15/user | 50 orgs × 80 users | €60.000 |
| **Enterprise** | Custom €5.000+/jaar | 10 | €50.000 |
| **Totaal (matuur)** | | **110** | **€160.000** |

### Gecombineerde Revenue Scenarios

| Scenario | B2C | B2B | **Totaal** | Tijdframe |
|----------|-----|-----|------------|-----------|
| **Minimum Viable** | €15.000 (3k users) | €10.000 (10 orgs) | **€25.000** | 2026 |
| **Break-even+** | €50.000 (10k users) | €36.000 (40 orgs) | **€86.000** | 2027 |
| **Sustainable** | €150.000 (30k users) | €100.000 (80 orgs) | **€250.000** | 2028 |
| **Scale** | €375.000 (75k users) | €180.000 (150 orgs) | **€555.000** | 2029+ |

### Break-Even Analyse

**Geschatte kosten (jaarlijks):**

| Kostenpost | Nu (hobby) | Schaal (10k users) | Schaal (50k users) |
|------------|------------|--------------------|--------------------|
| Supabase | €0 (free tier) | €280 (Pro) | €1.000+ |
| Vercel | €0 (hobby) | €240 (Pro) | €500+ |
| Domain + misc | €50 | €100 | €200 |
| Xeno-canto API | €0 | €0 (gratis) | €0 |
| GBIF API | €0 | €0 (gratis) | €0 |
| **Totaal infra** | **€50** | **€620** | **€1.700** |

**Personeelskosten (indien fulltime):**

| Rol | Salaris/jaar |
|-----|--------------|
| Developer (1 FTE) | €60.000-80.000 |
| Support/community (0.5 FTE) | €25.000-35.000 |
| Marketing (0.5 FTE) | €25.000-35.000 |
| **Totaal** | **€110.000-150.000** |

**Break-even points:**

| Scenario | Benodigd | Vereiste schaal |
|----------|----------|-----------------|
| **Hobby (infra only)** | €620/jaar | ~15 Premium users |
| **Part-time (€30k/jaar)** | €30.620/jaar | 600 Premium + 20 orgs |
| **Full-time (€80k/jaar)** | €80.620/jaar | 1.600 Premium + 50 orgs |
| **Klein team (€150k/jaar)** | €150.620/jaar | 3.000 Premium + 80 orgs |

### Key Metrics per Fase

| KPI | Soft Launch | Groei | Matuur |
|-----|-------------|-------|--------|
| **MAU** | 200 | 5.000 | 30.000 |
| **Registered users** | 500 | 15.000 | 75.000 |
| **Premium conversion** | 8-10% | 10% | 10-12% |
| **B2B orgs** | 3 | 40 | 150 |
| **MRR** | €200 | €7.000 | €46.000 |
| **ARR** | €2.500 | €86.000 | €555.000 |

### Conclusie Revenue Analyse

**B2C (Premium €50/jaar):**
- Schaalt lineair met users
- 10% conversie is conservatief voor niche-product (power users)
- Potentieel €375k/jaar bij 75k users (7.5% van SAM)
- Laagdrempelig, maar individuele support intensief

**B2B (Hybrid model):**
- Non-profit partnerships voor stabiele relaties (€50k)
- Per-user voor commerciële bureaus (€60k)
- Enterprise custom deals voor grote spelers (€50k)
- Potentieel €160k/jaar bij 110 organisaties (~7% van SAM)
- Hogere gemiddelde waarde, langere salescycles

**Aanbeveling:**
1. **Start B2C** voor product-market fit en brand awareness
2. **Pilots B2B** met KNNV voor testimonials en case study
3. **Scale B2B** als stabiele recurring revenue naast B2C
4. **Target ARR:** €100k-250k in 2028 is haalbaar met 5-10% SAM penetratie

**Risico's:**
- Lagere conversie dan 10% (educatieve niche kan hoger zijn)
- B2B salescycles kunnen 6-12 maanden duren
- Afhankelijkheid van enkele grote organisaties

**Upside:**
- Niche met weinig directe concurrentie
- GBIF/Xeno-canto integratie als moat
- Community effect (decks delen) kan viraal groeien

---

### Bronnen Marktanalyse

**Waarnemingsplatforms:**
- [Compendium voor de Leefomgeving - Citizen Science](https://www.clo.nl/indicatoren/nl062501-citizen-science-voor-natuur)
- [iNaturalist - 3 Million Observers](https://www.inaturalist.org/blog/91752-3-000-000-observers)
- [iNaturalist - BioScience artikel](https://academic.oup.com/bioscience/article/75/11/953/8185761)
- [eBird 2024 Year in Review](https://ebird.org/news/2024-year-in-review)
- [eBird 2025 Year in Review](https://ebird.org/news/2025-year-in-review)
- [Observation.org - GBIF Publisher](https://www.gbif.org/publisher/c8d737e0-2ff8-42e8-b8fc-6b805d26fc5f)

**Natuur-apps:**
- [Merlin Bird ID - Cornell Cornellians](https://alumni.cornell.edu/cornellians/merlin-bird-app/)
- [BirdID Europe - Aptoide](https://birdid-nord-university.en.aptoide.com/app)
- [Picture Bird - SimilarWeb](https://www.similarweb.com/app/google-play/com.glority.picturebird/statistics/)
- [ObsIdentify - Observation.org](https://observation.org/apps/obsidentify/)
- [Larkwire](https://www.larkwire.com/)

---

## Gerelateerde Documentatie

| Document | Relatie |
|----------|---------|
| [Organization Pages](../features/organization-pages.md) | B2B features, competitive analyse, pricing benchmarks |
| [Premium Features](../features/premium-features.md) | B2C premium tier details |
| [Internationalisering](../research/internationalisering-i18n.md) | Strategie voor Europese markt |

---

## Changelog

| Datum | Wijziging |
|-------|-----------|
| 2025-01-06 | Initieel document aangemaakt |
| 2026-01-30 | Premium features brainstorm toegevoegd (voice/car mode, etc.) |
| 2026-01-30 | Gratis account limieten design toegevoegd |
| 2026-02-03 | Pricing analyse toegevoegd (storage-only vs all-in) |
| 2026-02-03 | Downgrade scenario's en soft lock strategie |
| 2026-02-03 | Vergelijking subscription/entitlements systemen |
| 2026-02-03 | Marktanalyse TAM/SAM/SOM toegevoegd |
| 2026-02-03 | Natuur-apps sectie toegevoegd (Merlin, BirdID, etc.) |
| 2026-02-03 | Revenue analyse: TAM/SAM/SOM × Pricing toegevoegd |
