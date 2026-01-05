# Naturae Project Instructies

Dit bestand wordt automatisch gelezen aan het begin van elke Claude Code sessie.

## Documentatie Structuur

**BELANGRIJK**: Lees altijd eerst de relevante documentatie voordat je iets implementeert of wijzigt.

De project specificaties staan in `/docs/`:

| Bestand | Inhoud |
|---------|--------|
| `naturae-mvp-design.md` | Hoofddocument: features, sprints, roadmap, beslissingen |
| `database-architecture.md` | Database schema, RLS policies, tabellen, storage |
| `data-flow-architecture.md` | API patterns, auth flow, data flows |
| `design-system.md` | UI componenten, kleuren, typografie, layout patterns |
| `implementation-plan.md` | Technische implementatie stappen per fase |

## Werkwijze

1. **Voordat je implementeert**: Lees de relevante md files om te begrijpen wat er is afgesproken
2. **Bij twijfel**: Vraag de gebruiker, maak geen aannames
3. **Documentatie bijwerken**: Als je iets implementeert dat afwijkt van de docs, update de docs
4. **Geen over-engineering**: Bouw alleen wat expliciet gevraagd is

## Huidige Tech Stack

- Next.js 16+ met App Router
- TypeScript + Tailwind CSS v4
- Supabase (Auth, PostgreSQL, Storage)
- shadcn/ui + Radix UI componenten
- FSRS algoritme via `ts-fsrs` voor spaced repetition

## Project Conventies

- Nederlandse UI teksten
- Route groups: `(auth)` voor login/signup, `(main)` voor beschermde pagina's
- Server Actions in `/src/lib/actions/`
- Supabase clients in `/src/lib/supabase/`

## Huidige Status

Het project zit in Sprint 1 (MVP) - zie `naturae-mvp-design.md` voor de exacte scope.
