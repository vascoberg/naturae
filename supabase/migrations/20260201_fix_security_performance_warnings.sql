-- Fix Supabase Security & Performance Warnings
-- Date: 2026-02-01
--
-- This migration fixes:
-- 1. Function search_path mutable (6 functions)
-- 2. RLS auth.uid() re-evaluation per row (25 policies)
-- 3. Multiple permissive policies on deck_stars and decks

-- ============================================================================
-- 1. FIX FUNCTION SEARCH_PATH (Security)
-- ============================================================================
-- Adding SET search_path = '' to prevent search path manipulation attacks

-- 1.1 update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1.2 handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- 1.3 update_deck_card_count
CREATE OR REPLACE FUNCTION public.update_deck_card_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.decks SET card_count = card_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.decks SET card_count = card_count - 1 WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 1.4 update_deck_like_count
CREATE OR REPLACE FUNCTION public.update_deck_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.decks SET like_count = like_count + 1 WHERE id = NEW.deck_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.decks SET like_count = like_count - 1 WHERE id = OLD.deck_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 1.5 increment_tag_usage
CREATE OR REPLACE FUNCTION public.increment_tag_usage(tag_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.tags
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = tag_id_param;
END;
$$;

-- 1.6 decrement_tag_usage
CREATE OR REPLACE FUNCTION public.decrement_tag_usage(tag_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.tags
  SET usage_count = GREATEST(COALESCE(usage_count, 0) - 1, 0)
  WHERE id = tag_id_param;
END;
$$;

-- ============================================================================
-- 2. FIX RLS POLICIES - auth.uid() -> (select auth.uid())
-- ============================================================================
-- Using (select auth.uid()) prevents re-evaluation for each row

-- 2.1 Profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- 2.2 Species
DROP POLICY IF EXISTS "Authenticated users can create species" ON public.species;
CREATE POLICY "Authenticated users can create species"
  ON public.species FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Creators can update species" ON public.species;
CREATE POLICY "Creators can update species"
  ON public.species FOR UPDATE
  USING ((select auth.uid()) = created_by);

-- 2.3 Decks - Also fix multiple policies issue
-- First drop all SELECT policies, then create one combined policy
DROP POLICY IF EXISTS "Users can view own and public decks" ON public.decks;
DROP POLICY IF EXISTS "Anyone can view public decks" ON public.decks;
DROP POLICY IF EXISTS "Users can view own decks" ON public.decks;

CREATE POLICY "Users can view own and public decks"
  ON public.decks FOR SELECT
  USING (
    deleted_at IS NULL
    AND (user_id = (select auth.uid()) OR is_public = true)
  );

DROP POLICY IF EXISTS "Users can create decks" ON public.decks;
CREATE POLICY "Users can create decks"
  ON public.decks FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own decks" ON public.decks;
CREATE POLICY "Users can update own decks"
  ON public.decks FOR UPDATE
  USING ((select auth.uid()) = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can delete own decks" ON public.decks;
CREATE POLICY "Users can delete own decks"
  ON public.decks FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 2.4 Cards
DROP POLICY IF EXISTS "Users can view cards of accessible decks" ON public.cards;
CREATE POLICY "Users can view cards of accessible decks"
  ON public.cards FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id
      AND decks.deleted_at IS NULL
      AND (decks.user_id = (select auth.uid()) OR decks.is_public = true)
    )
  );

DROP POLICY IF EXISTS "Users can create cards in own decks" ON public.cards;
CREATE POLICY "Users can create cards in own decks"
  ON public.cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = deck_id
      AND decks.user_id = (select auth.uid())
      AND decks.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can update cards in own decks" ON public.cards;
CREATE POLICY "Users can update cards in own decks"
  ON public.cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete cards in own decks" ON public.cards;
CREATE POLICY "Users can delete cards in own decks"
  ON public.cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = (select auth.uid())
    )
  );

-- 2.5 Card Media
DROP POLICY IF EXISTS "Users can view media of accessible cards" ON public.card_media;
CREATE POLICY "Users can view media of accessible cards"
  ON public.card_media FOR SELECT
  USING (
    (card_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.cards
      JOIN public.decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND cards.deleted_at IS NULL
      AND decks.deleted_at IS NULL
      AND (decks.user_id = (select auth.uid()) OR decks.is_public = true)
    ))
    OR
    (species_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can add media to own cards" ON public.card_media;
CREATE POLICY "Users can add media to own cards"
  ON public.card_media FOR INSERT
  WITH CHECK (
    (card_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.cards
      JOIN public.decks ON decks.id = cards.deck_id
      WHERE cards.id = card_id
      AND decks.user_id = (select auth.uid())
      AND decks.deleted_at IS NULL
    ))
    OR
    (species_id IS NOT NULL AND (select auth.uid()) IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can update media of own cards" ON public.card_media;
CREATE POLICY "Users can update media of own cards"
  ON public.card_media FOR UPDATE
  USING (
    card_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.cards
      JOIN public.decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND decks.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete media of own cards" ON public.card_media;
CREATE POLICY "Users can delete media of own cards"
  ON public.card_media FOR DELETE
  USING (
    card_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.cards
      JOIN public.decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND decks.user_id = (select auth.uid())
    )
  );

-- 2.6 User Progress
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
CREATE POLICY "Users can manage own progress"
  ON public.user_progress FOR ALL
  USING ((select auth.uid()) = user_id);

-- 2.7 Deck Stars - Fix multiple permissive policies issue
-- Remove duplicate SELECT access, keep simple structure
DROP POLICY IF EXISTS "Users can view all ratings" ON public.deck_stars;
DROP POLICY IF EXISTS "Users can manage own ratings" ON public.deck_stars;

-- Public SELECT for everyone
CREATE POLICY "Anyone can view ratings"
  ON public.deck_stars FOR SELECT
  USING (true);

-- Authenticated users can INSERT/UPDATE/DELETE their own
CREATE POLICY "Users can insert own ratings"
  ON public.deck_stars FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.deck_stars FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.deck_stars FOR DELETE
  USING ((select auth.uid()) = user_id);

-- 2.8 Tags
DROP POLICY IF EXISTS "Authenticated users can create tags" ON public.tags;
CREATE POLICY "Authenticated users can create tags"
  ON public.tags FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Creators can update tags" ON public.tags;
CREATE POLICY "Creators can update tags"
  ON public.tags FOR UPDATE
  USING ((select auth.uid()) = created_by);

-- 2.9 Deck Tags
DROP POLICY IF EXISTS "Users can view tags of accessible decks" ON public.deck_tags;
CREATE POLICY "Users can view tags of accessible decks"
  ON public.deck_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = deck_tags.deck_id
      AND decks.deleted_at IS NULL
      AND (decks.user_id = (select auth.uid()) OR decks.is_public = true)
    )
  );

DROP POLICY IF EXISTS "Users can add tags to own decks" ON public.deck_tags;
CREATE POLICY "Users can add tags to own decks"
  ON public.deck_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = deck_id
      AND decks.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can remove tags from own decks" ON public.deck_tags;
CREATE POLICY "Users can remove tags from own decks"
  ON public.deck_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = deck_tags.deck_id
      AND decks.user_id = (select auth.uid())
    )
  );

-- 2.10 Deck Likes
DROP POLICY IF EXISTS "Authenticated users can like" ON public.deck_likes;
CREATE POLICY "Authenticated users can like"
  ON public.deck_likes FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unlike" ON public.deck_likes;
CREATE POLICY "Users can unlike"
  ON public.deck_likes FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- DONE!
-- ============================================================================
-- After running this migration:
-- 1. Run Supabase Security Advisor again to verify fixes
-- 2. Enable "Leaked Password Protection" in Dashboard > Authentication > Settings
