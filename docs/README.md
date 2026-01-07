# Naturae Documentatie

> Flashcard platform voor natuurliefhebbers om soortherkenning te leren.

## Structuur

```
docs/
├── naturae-mvp-design.md      # Hoofddocument: visie, features, roadmap
├── implementation-plan.md      # Sprint planning en voortgang
│
├── architecture/               # Technische architectuur
│   ├── database-architecture.md    # Database schema, RLS, migraties
│   └── data-flow-architecture.md   # Server/client patterns, auth flows
│
├── design/                     # UI/UX design
│   └── design-system.md           # Kleuren, typografie, componenten
│
├── research/                   # Onderzoek en inspiratie
│   ├── ux-research-flashcard-apps.md  # Analyse van Anki, Quizlet, etc.
│   └── Reference/                      # Screenshots van BirdID als inspiratie
│
└── operations/                 # Beheer en deployment
    ├── deployment.md              # Vercel, Supabase setup
    ├── costs-and-limits.md        # Free tier limieten, kosten
    └── business-model.md          # Freemium model, toekomstplannen
```

## Snelstart

1. **Wat is Naturae?** → [naturae-mvp-design.md](naturae-mvp-design.md)
2. **Huidige voortgang?** → [implementation-plan.md](implementation-plan.md)
3. **Database schema?** → [architecture/database-architecture.md](architecture/database-architecture.md)
4. **Design tokens?** → [design/design-system.md](design/design-system.md)

## Context

Dit project is gestart als hobbyproject, geïnspireerd door:
- BirdID app van Nord University (zie [research/Reference/](research/Reference/))
- LinkedIn discussie over soortherkenning tools
- Frustratie dat Anki/Quizlet niet ontworpen zijn voor media-rijke soortherkenning

## Status

- **Sprint 1:** ✅ Afgerond (Auth, FSRS flashcards, basis UI)
- **Sprint 2:** 🚧 In progress (User generated content)
- **Sprint 3:** ⏳ Gepland (Sharing & Community)
