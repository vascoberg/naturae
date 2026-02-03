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

## Changelog

| Datum | Wijziging |
|-------|-----------|
| 2025-01-06 | Initieel document aangemaakt |
| 2026-01-30 | Premium features brainstorm toegevoegd (voice/car mode, etc.) |
| 2026-01-30 | Gratis account limieten design toegevoegd |
| 2026-02-03 | Pricing analyse toegevoegd (storage-only vs all-in) |
| 2026-02-03 | Downgrade scenario's en soft lock strategie |
| 2026-02-03 | Vergelijking subscription/entitlements systemen |
