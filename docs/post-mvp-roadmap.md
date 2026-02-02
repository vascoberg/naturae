# Naturae Roadmap

> Grote milestones en validatie doelen. Voor specifieke taken, zie [backlog.md](backlog.md).

**Laatste update:** 1 februari 2026

---

## Validatie Doelen

### Les 1: Product-Market Fit
> Willen natuurliefhebbers leren via Naturae?

**Metrics:**
- 100 actieve gebruikers (MAU)
- 30% week-1 retention
- Positieve feedback van 5+ serieuze gebruikers

**Hoe valideren:**
- KNNV pilot (Jaap contact)
- LinkedIn post
- Organische groei meten

### Les 2: Betalingsbereidheid
> Willen gebruikers betalen voor premium features?

**Vereist eerst:** Les 1 gevalideerd

**Metrics:**
- Conversie gratis → pro
- Feedback op limieten

---

## Milestones

### ✅ Milestone 1: Production Ready
**Status:** Afgerond (01-02-2026)

- [x] UX Polish (page transitions, toast feedback)
- [x] Performance (Lighthouse 100/90/96/100)
- [x] Stabiliteit (error boundaries, Supabase security)
- [x] Content (3 voorbeelddecks)

### 🔜 Milestone 2: Soft Launch
**Status:** Volgende

**Doel:** Eerste echte gebruikers krijgen.

- [ ] KNNV pilot starten (wacht op Jaap)
- [ ] LinkedIn post publiceren
- [ ] Feedback verzamelen

**Wanneer:** Zodra Jaap reageert of zelf initiatief nemen

### ✅ Milestone 3: Freemium Limieten
**Status:** Afgerond (02-02-2026)

**Doel:** Basis guardrails voor gratis accounts.

- [x] Usage tracking in database (storage_used_bytes)
- [x] Limiet warnings in UI (settings pagina)
- [x] Toast meldingen bij limiet bereikt
- [ ] Pricing page (later, na validatie)
- [ ] Stripe voorbereiding (later)

**Referentie:** [freemium-limits-plan.md](features/freemium-limits-plan.md)

### 📋 Milestone 4: Premium Live
**Status:** Gepland (na Les 1 positief)

**Doel:** Betalingen live, conversie meten.

- [ ] Stripe in productie
- [ ] Pro tier activeren
- [ ] A/B test limieten

---

## Changelog

| Datum | Wijziging |
|-------|-----------|
| 2026-02-01 | Document geconsolideerd met backlog.md |
| 2026-02-01 | Milestone 1 (Production Ready) afgerond |
| 2026-01-30 | Initieel document |

---

*Voor alle taken en features: zie [backlog.md](backlog.md)*
