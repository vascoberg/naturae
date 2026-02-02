# User Deletion Policy

> Documentatie over wat er gebeurt wanneer een gebruiker wordt verwijderd.

**Laatste update:** 2 februari 2026

---

## Overzicht

Wanneer een gebruiker wordt verwijderd (via Supabase Admin of eigen account deletion), wordt alle gerelateerde data automatisch verwijderd via PostgreSQL CASCADE deletes.

## Wat wordt verwijderd?

### Data van de verwijderde user

| Data | Tabel | Actie |
|------|-------|-------|
| Profiel | `profiles` | Verwijderd |
| **Eigen decks** | `decks` | **Verwijderd** (inclusief publieke!) |
| Kaarten in eigen decks | `cards` | Verwijderd |
| Media in eigen decks | `card_media` | DB referenties verwijderd* |
| Leervoortgang | `user_progress` | Verwijderd |
| Gegeven likes | `deck_likes` | Verwijderd |
| Gegeven stars | `deck_stars` | Verwijderd |
| Tags op eigen decks | `deck_tags` | Verwijderd |

*\* Media bestanden in Supabase Storage worden niet automatisch verwijderd. Zie "Storage Cleanup" hieronder.*

### Impact op andere users

| Situatie | Impact |
|----------|--------|
| User A liked deck van User B, User B wordt verwijderd | Deck is weg, like is weg |
| User A leerde deck van User B, User B wordt verwijderd | Deck is weg, voortgang is weg |
| User A liked deck van User B, User A wordt verwijderd | Deck blijft, like is weg |

### Wat blijft bestaan?

- Decks van andere gebruikers
- Species data (gedeeld, niet user-owned)
- Tags (gedeeld, alleen `deck_tags` koppeling verdwijnt)

## Storage Cleanup

Media bestanden in Supabase Storage (`/media/{user_id}/...`) worden **niet** automatisch verwijderd bij user deletion.

**Opties voor cleanup:**

1. **Handmatig:** Verwijder folder via Storage dashboard
2. **Lifecycle policy:** Configureer auto-delete voor orphaned files (toekomstig)
3. **Pre-deletion script:** Verwijder storage eerst, dan user (toekomstig)

## Toekomstige Features

### Transfer Deck Ownership (Backlog)

Voor populaire publieke decks: mogelijkheid om eigendom over te dragen naar andere user voordat account wordt verwijderd.

Zie: [backlog.md](../backlog.md#transfer-deck-ownership)

## Technische Implementatie

De CASCADE deletes werken via:
1. Foreign key constraints met `ON DELETE CASCADE`
2. RLS policies die `auth.uid() IS NULL` toestaan (voor system-level deletes)

Migratie: `20260202_fix_cascade_delete_policies.sql`

---

## Gerelateerde Documenten

- [Freemium Limits](freemium-limits-plan.md) - Storage tracking
- [Backlog](../backlog.md) - Transfer Ownership feature
