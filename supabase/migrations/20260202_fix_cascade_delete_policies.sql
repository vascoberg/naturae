-- =============================================================================
-- FIX: RLS policies voor CASCADE deletes bij user deletion
-- =============================================================================
--
-- PROBLEEM:
-- Wanneer een user wordt verwijderd via Supabase Admin API, probeert PostgreSQL
-- automatisch gerelateerde data te verwijderen (CASCADE). Maar RLS policies
-- blokkeren dit omdat `auth.uid()` NULL is tijdens een CASCADE operatie.
--
-- OPLOSSING:
-- Voeg `OR (select auth.uid()) IS NULL` toe aan DELETE policies.
-- Dit staat CASCADE deletes toe terwijl normale user-initiated deletes
-- nog steeds gecontroleerd worden.
--
-- =============================================================================
-- WAT GEBEURT ER ALS EEN USER WORDT VERWIJDERD?
-- =============================================================================
--
-- De volgende data wordt AUTOMATISCH verwijderd (CASCADE):
--
-- 1. profiles        - Profiel van de user
-- 2. decks           - ALLE decks van de user (inclusief publieke!)
-- 3. cards           - Alle kaarten in die decks
-- 4. card_media      - Alle media (foto's, audio) van die kaarten
-- 5. user_progress   - Leervoortgang van de user
-- 6. deck_likes      - Likes die de user heeft gegeven
-- 7. deck_stars      - Stars die de user heeft gegeven
--
-- LET OP:
-- - Publieke decks worden OOK verwijderd!
-- - Media bestanden in Supabase Storage worden NIET automatisch verwijderd
--   (dit vereist een aparte cleanup of storage lifecycle policy)
-- - Overweeg "Transfer Ownership" feature voor populaire decks
--
-- =============================================================================

-- 1. Decks: sta CASCADE delete toe
DROP POLICY IF EXISTS "Users can delete own decks" ON public.decks;
CREATE POLICY "Users can delete own decks"
  ON public.decks FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IS NULL  -- CASCADE from auth.users deletion
  );

-- 2. Cards: sta CASCADE delete toe
DROP POLICY IF EXISTS "Users can delete cards in own decks" ON public.cards;
CREATE POLICY "Users can delete cards in own decks"
  ON public.cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = (select auth.uid())
    )
    OR (select auth.uid()) IS NULL  -- CASCADE from deck/user deletion
  );

-- 3. Card Media: sta CASCADE delete toe
DROP POLICY IF EXISTS "Users can delete media in own decks" ON public.card_media;
CREATE POLICY "Users can delete media in own decks"
  ON public.card_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cards
      JOIN public.decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND decks.user_id = (select auth.uid())
    )
    OR (select auth.uid()) IS NULL  -- CASCADE from card/deck/user deletion
  );

-- 4. User Progress: sta CASCADE delete toe
DROP POLICY IF EXISTS "Users can delete own progress" ON public.user_progress;
CREATE POLICY "Users can delete own progress"
  ON public.user_progress FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IS NULL  -- CASCADE from user deletion
  );

-- 5. Deck Likes: sta CASCADE delete toe
DROP POLICY IF EXISTS "Users can unlike decks" ON public.deck_likes;
CREATE POLICY "Users can unlike decks"
  ON public.deck_likes FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IS NULL  -- CASCADE from user/deck deletion
  );

-- 6. Deck Stars: sta CASCADE delete toe
DROP POLICY IF EXISTS "Users can unstar decks" ON public.deck_stars;
CREATE POLICY "Users can unstar decks"
  ON public.deck_stars FOR DELETE
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) IS NULL  -- CASCADE from user/deck deletion
  );

-- 7. Deck Tags: sta CASCADE delete toe
DROP POLICY IF EXISTS "Deck owners can remove tags" ON public.deck_tags;
CREATE POLICY "Deck owners can remove tags"
  ON public.deck_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = deck_tags.deck_id
      AND decks.user_id = (select auth.uid())
    )
    OR (select auth.uid()) IS NULL  -- CASCADE from deck/user deletion
  );

-- 8. Profiles: sta CASCADE delete toe (vanuit auth.users)
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (
    (select auth.uid()) = id
    OR (select auth.uid()) IS NULL  -- CASCADE from auth.users deletion
  );
