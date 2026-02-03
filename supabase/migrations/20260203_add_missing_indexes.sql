-- Add missing indexes for frequently queried foreign keys
-- Gebaseerd op Supabase Performance Advisor recommendations

-- deck_stars.deck_id - gebruikt bij ophalen van deck ratings
CREATE INDEX IF NOT EXISTS idx_deck_stars_deck_id
ON public.deck_stars(deck_id);

-- user_progress.card_id - gebruikt bij laden van study progress
CREATE INDEX IF NOT EXISTS idx_user_progress_card_id
ON public.user_progress(card_id);

-- Niet geïndexeerd (zelden gequeried):
-- - deck_tags.added_by (wie tag toevoegde, niet relevant voor queries)
-- - decks.copied_from_deck_id (toekomstige remix feature)
-- - species.created_by (admin only)
-- - tags.created_by (admin only)
