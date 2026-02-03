# Organisatiepagina's - Feature Planning

> Planning voor organisatie-functionaliteit in Naturae, gericht op natuurverenigingen, onderwijsinstellingen en adviesbureaus.

**Status:** Research & Planning
**Datum:** 3 februari 2026

---

## Doelgroepen & Use Cases

### 1. Natuurverenigingen (KNNV, IVN)

**Voorbeeld:** KNNV met Jaap Graveland
**Context:** Zie [KNNV correspondentie](../research/knnv-feedback-jaap-graveland.md)

**Wat ze willen:**
- Cursusmateriaal aanbieden aan leden (bijv. 6-weekse plantenherkenningscursus)
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

**Business model vraag:**
Jaap zoekt subsidie. Partnerschap met jaarlijkse bijdrage?

---

### 2. Onderwijsinstellingen (HVHL, MBO, universiteiten)

**Voorbeeld:** Hogeschool Van Hall Larenstein
**Context:** Een docent heeft al een account. HVHL-studenten gebruiken nu Quizlet voor plantenherkenningstoetsen.

**Wat ze willen:**
- Lesmateriaal per vak/module (bijv. "Ecologie jaar 1")
- Toetsen afnemen (quiz mode met score registratie)
- Voortgang per student volgen
- Integratie met bestaande systemen (Canvas, Brightspace)?

**Specifieke behoeften:**
- [ ] Vakken/modules structuur
- [ ] Student uitnodigen via institutioneel e-mail
- [ ] Docent dashboard met voortgang per student
- [ ] Quiz resultaten exporteren (voor beoordeling)
- [ ] Mogelijkheid tot "gesloten" sets (alleen voor studenten)

**Business model vraag:**
Per docent/student licentie? Of school-wide deal?

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

**Business model vraag:**
B2B SaaS model? Per gebruiker per maand?

---

## Gemeenschappelijke Features

Alle drie de doelgroepen hebben behoefte aan:

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

---

## Differentiatie t.o.v. Concurrenten

### Waarom niet Quizlet?
- €6.000+/jaar voor organisatie met 500 gebruikers
- Geen natuur-specifieke features (GBIF, Xeno-canto)
- Geen taxonomische distractors in quiz
- Geen foto-annotaties
- Amerikaans bedrijf, geen invloed op roadmap

### Waarom niet Anki?
- Niet gebruiksvriendelijk ("designed in 2006")
- Geen organisatie features
- Geen centrale voortgang tracking
- Complexe setup voor niet-technische gebruikers

### Naturae voordelen:
- GBIF integratie (foto's met automatische attributie)
- Xeno-canto integratie (geluiden)
- Foto-annotaties voor kenmerken aanwijzen
- Taxonomische distractors (verwante soorten als foute opties)
- Nederlands platform, directe support
- Invloed op roadmap als partner

---

## Voorgestelde Architectuur

### Database Schema (conceptueel)

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

## MVP Scope (Fase 1)

Minimaal werkende versie voor eerste pilot:

### In scope:
- [ ] Organisatie aanmaken (naam, logo, beschrijving)
- [ ] Organisatie slug/URL (`/org/knnv`)
- [ ] Leden uitnodigen via link
- [ ] Leersets toevoegen aan organisatie
- [ ] Uitgelichte sets op organisatiepagina
- [ ] Basis admin rol (owner vs member)

### Out of scope (Fase 2+):
- [ ] Groepen/klassen
- [ ] Voortgang tracking per lid
- [ ] Certificaten
- [ ] Quiz scores exporteren
- [ ] Private/gesloten organisaties
- [ ] Stripe integratie voor betaling

---

## Pricing Model Opties

### Optie A: Tiered per organisatie

| Tier | Prijs | Features |
|------|-------|----------|
| Free | €0 | 1 admin, 10 leden, publieke sets |
| Pro | €25/maand | 5 admins, 100 leden, private sets |
| Enterprise | Custom | Onbeperkt, SSO, support |

### Optie B: Per gebruiker

| Type | Prijs | Volume korting |
|------|-------|----------------|
| Per lid | €2/maand | >50: €1.50, >200: €1 |
| Minimaal | €10/maand | - |

### Optie C: Partnerschap (non-profit)

Voor KNNV/IVN type organisaties:
- Jaarlijkse bijdrage (€500-2000)
- Invloed op roadmap
- Feature requests priority
- Geen per-gebruiker kosten

---

## Open Vragen

1. **Wat is de MVP?** Welke features zijn minimaal nodig voor een eerste pilot?

2. **Private vs publiek?**
   - KNNV wil waarschijnlijk publieke sets (community)
   - Bureaus willen private sets (interne training)
   - Hoe combineren?

3. **Pricing strategie?**
   - Non-profits anders behandelen dan commercieel?
   - Freemium of direct betaald?

4. **Technische integraties?**
   - SSO voor onderwijsinstellingen (SAML)?
   - LMS integratie (Canvas, Brightspace)?

5. **Content eigenaarschap?**
   - Wie bezit sets gemaakt door leden binnen org?
   - Wat gebeurt als org stopt?

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

## Gerelateerde Documentatie

- [KNNV Feedback Jaap](../research/knnv-feedback-jaap-graveland.md)
- [Quizlet Group Features Analyse](../research/group-features-quizlet.md)
- [Premium Features](premium-features.md)
- [Business Model](../operations/business-model.md)

---

*Laatst bijgewerkt: 3 februari 2026*
