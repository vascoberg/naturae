# Premium Features

> Features die gepland zijn voor het betaalde Premium abonnement.

**Status:** Planning
**Gerelateerd:** [Business Model](../operations/business-model.md)

---

## Overzicht

Naturae volgt een freemium model. De basis features zijn gratis, premium features zijn bedoeld voor power users en organisaties.

### Gratis vs Premium

| Feature | Gratis | Premium |
|---------|--------|---------|
| Leersets aanmaken | ✅ | ✅ |
| Flashcards & Quiz | ✅ | ✅ |
| GBIF/Xeno-canto media | ✅ | ✅ |
| Eigen media upload | 50 MB | 1 GB+ |
| Bulk tekst import | ✅ | ✅ |
| AI-powered import | ❌ | ✅ |
| AI soortherkenning | ❌ | ✅ |
| Priority support | ❌ | ✅ |

---

## Premium Features (Gepland)

### 1. AI-Powered Import

**Beschrijving:**
Intelligente import die elke tekststructuur begrijpt en automatisch parseert.

**Use Case:**
Gebruiker plakt chaotische lijst, AI herkent:
- Welke kolom soortnamen bevat
- Nederlandse vs wetenschappelijke namen
- Extra metadata (familie, orde, etc.)

**Implementatie idee:**
```
User plakt tekst →
  ↓
Claude API analyseert structuur →
  ↓
"We herkennen 25 soorten:
 - Kolom 1: Afkorting (skip)
 - Kolom 3: Nederlandse naam
 - Kolom 4: Wetenschappelijke naam

 Klopt dit?" →
  ↓
User bevestigt → Kaarten aangemaakt
```

**Technisch:**
- Claude API call (~$0.01 per import)
- Prompt: "Analyseer deze lijst en identificeer soortnamen"
- Output: Gestructureerde JSON met voor/achter mapping

**Kosten:**
- API kosten doorberekenen in premium prijs
- Rate limit: max 10 AI imports per dag

---

### 2. AI Soortherkenning uit Foto

**Beschrijving:**
Upload een foto → AI identificeert de soort → voeg toe aan deck.

**Use Case:**
Gebruiker maakt foto van plant tijdens wandeling, wil direct toevoegen aan leerset.

**Implementatie:**
- Claude Vision API of iNaturalist Computer Vision API
- Confidence threshold (>80%)
- Link naar GBIF species

**Kosten:**
- ~$0.02-0.05 per foto analyse
- Rate limit nodig

---

### 3. Excel/PDF Smart Import

**Beschrijving:**
Upload Excel of PDF → AI extraheert soortenlijst automatisch.

**Use Case:**
Docent heeft cursusmateriaal als PDF, wil snel leerset maken.

**Waarom premium:**
- Complexe parsing
- AI nodig voor ongestructureerde data
- Hoge compute kosten

---

### 4. Geavanceerde Quiz Modi

**Potentiële premium quiz features:**
- Typ-modus (spelling oefenen)
- Custom timer per vraag
- Gedetailleerde statistieken
- Export voortgang naar CSV

---

### 5. Organisatie Features

**Voor scholen/natuurorganisaties:**
- Meerdere gebruikers onder één account
- Gedeelde leersets (niet publiek)
- Voortgang dashboard voor docenten
- Branded experience (logo, kleuren)

---

## Implementatie Volgorde

| Fase | Feature | Geschatte effort |
|------|---------|------------------|
| 1 | Stripe integratie | Medium |
| 2 | Premium tier check | Klein |
| 3 | AI Import | Medium |
| 4 | AI Soortherkenning | Medium |
| 5 | Organisatie features | Groot |

---

## Open Vragen

1. **Prijsmodel:** Per maand of per jaar? €5/maand, €50/jaar?
2. **Trial:** 7-14 dagen premium trial voor nieuwe users?
3. **Educatie korting:** Gratis/korting voor scholen?

---

## Gerelateerde Documenten

- [Business Model](../operations/business-model.md)
- [Freemium Limits](freemium-limits-plan.md)
- [Bulk Text Import](bulk-text-import.md) - Gratis MVP versie
