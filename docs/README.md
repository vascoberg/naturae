# Naturae Documentatie

> Flashcard platform voor natuurliefhebbers om soortherkenning te leren.

## Structuur

```
docs/
├── naturae-mvp-design.md      # Hoofddocument: visie, features, roadmap
├── implementation-plan.md      # Sprint planning en voortgang
├── backlog.md                  # Geplande features na MVP
│
├── architecture/               # Technische architectuur
│   ├── database-architecture.md    # Database schema, RLS, migraties
│   └── data-flow-architecture.md   # Server/client patterns, auth flows
│
├── design/                     # UI/UX design
│   └── design-system.md           # Kleuren, typografie, componenten
│
├── features/                   # Feature documentatie
│   ├── gbif-media-learning-mode.md   # GBIF foto's in quiz
│   ├── photo-annotation-plan.md      # Foto annotatie editor
│   └── soortenpagina-species-page.md # Species info pagina
│
├── research/                   # Onderzoek en inspiratie
│   ├── ux-research-flashcard-apps.md   # Analyse van Anki, Quizlet, etc.
│   ├── quiz-mode-implementation-plan.md # Quiz mode planning
│   ├── naturae-taxonomie-feature.md    # GBIF taxonomie integratie
│   └── Reference/                       # Screenshots van BirdID
│
└── operations/                 # Beheer en deployment
    ├── deployment.md              # Vercel, Supabase setup
    ├── costs-and-limits.md        # Free tier limieten, kosten
    ├── business-model.md          # Freemium model
    └── naturae-noma-strategy.md   # NOMA/KNNV strategie
```

## Snelstart

1. **Wat is Naturae?** → [naturae-mvp-design.md](naturae-mvp-design.md)
2. **Huidige voortgang?** → [implementation-plan.md](implementation-plan.md)
3. **Backlog & roadmap?** → [backlog.md](backlog.md)
4. **Database schema?** → [architecture/database-architecture.md](architecture/database-architecture.md)
5. **Design tokens?** → [design/design-system.md](design/design-system.md)

## Context

Dit project is gestart als hobbyproject, geïnspireerd door:
- BirdID app van Nord University (zie [research/Reference/](research/Reference/))
- LinkedIn discussie met Jaap Graveland (KNNV) over soortherkenning tools (zie [research/knnv-feedback-jaap-graveland.md](research/knnv-feedback-jaap-graveland.md))
- Frustratie dat Anki/Quizlet niet ontworpen zijn voor media-rijke soortherkenning

### KNNV Contact

Jaap Graveland van de KNNV (Koninklijke Nederlandse Natuurhistorische Vereniging) heeft interesse getoond in flashcard tools voor soortherkenning. De KNNV overweegt een "Natuuracademie" op te richten in samenwerking met Observation.org. Zie [research/knnv-feedback-jaap-graveland.md](research/knnv-feedback-jaap-graveland.md) voor de volledige correspondentie en analyse.

## Status

- **Sprint 1:** ✅ Afgerond (Auth, FSRS flashcards, basis UI)
- **Sprint 2:** ✅ Afgerond (Bulk import, WYSIWYG editor, sessie-modi)
- **Sprint 3:** ✅ Afgerond (Discover, gastgebruik, landing page, hartjes, tags)
- **MVP+ Features:** ✅ Afgerond (GBIF taxonomie, foto-annotatie, quiz mode fase 1)
- **Backlog:** Zie [backlog.md](backlog.md) voor geplande features
