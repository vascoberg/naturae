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
