-- Naturae MVP - Database Schema
-- Voer dit script uit in Supabase SQL Editor (https://supabase.com/dashboard/project/bmkxhnktszwqiuiywwbz/sql)
--
-- Dit script maakt alle tabellen, RLS policies, indexes en triggers aan.

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABELLEN
-- ============================================================================

-- 2.1 Profiles - Gebruikersprofielen
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,  -- Wordt ingevuld tijdens onboarding
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT username_length CHECK (username IS NULL OR (char_length(username) >= 3 AND char_length(username) <= 30)),
  CONSTRAINT username_format CHECK (username IS NULL OR username ~ '^[a-z0-9_]+$')
);

-- 2.2 Species - Soorten Database (voor toekomstige Species Book)
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scientific_name TEXT NOT NULL UNIQUE,
  common_names JSONB NOT NULL DEFAULT '{}',
  taxonomy JSONB DEFAULT '{}',
  descriptions JSONB DEFAULT '{}',
  facts JSONB DEFAULT '{}',
  external_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users ON DELETE SET NULL
);

-- 2.3 Decks - Leersets
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  copied_from_deck_id UUID REFERENCES decks ON DELETE SET NULL,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT title_max_length CHECK (char_length(title) <= 100),
  CONSTRAINT description_max_length CHECK (description IS NULL OR char_length(description) <= 500)
);

-- 2.4 Cards - Flashcards
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES decks ON DELETE CASCADE,
  species_id UUID REFERENCES species ON DELETE SET NULL,
  front_text TEXT,
  back_text TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints: back_text is verplicht OF species_id moet ingevuld zijn
  CONSTRAINT has_answer CHECK (
    (back_text IS NOT NULL AND char_length(trim(back_text)) > 0)
    OR species_id IS NOT NULL
  )
);

-- 2.5 Card Media - Foto's en audio met attributie
CREATE TABLE card_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards ON DELETE CASCADE,
  species_id UUID REFERENCES species ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'front',
  attribution_name TEXT,
  attribution_url TEXT,
  attribution_source TEXT,
  license TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_type CHECK (type IN ('image', 'audio')),
  CONSTRAINT valid_position CHECK (position IN ('front', 'back')),
  CONSTRAINT has_parent CHECK (card_id IS NOT NULL OR species_id IS NOT NULL)
);

-- 2.6 User Progress - Leervoortgang & Spaced Repetition
CREATE TABLE user_progress (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards ON DELETE CASCADE,
  stability REAL DEFAULT 0,
  difficulty REAL DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state INTEGER DEFAULT 0,  -- 0=New, 1=Learning, 2=Review, 3=Relearning
  last_review TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, card_id)
);

-- 2.7 Deck Stars - Ratings (Sprint 3)
CREATE TABLE deck_stars (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, deck_id),
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

-- 2.8 Tags - Labels systeem
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  names JSONB NOT NULL DEFAULT '{}',
  type TEXT NOT NULL DEFAULT 'topic',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_type CHECK (type IN ('topic', 'region', 'language', 'difficulty', 'content-type', 'other'))
);

-- 2.9 Deck Tags - Koppeling tussen decks en tags
CREATE TABLE deck_tags (
  deck_id UUID NOT NULL REFERENCES decks ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (deck_id, tag_id)
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Species
CREATE INDEX idx_species_scientific_name ON species(scientific_name);
CREATE INDEX idx_species_common_names ON species USING GIN (common_names);

-- Decks
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_decks_public ON decks(is_public) WHERE is_public = true;

-- Cards
CREATE INDEX idx_cards_deck_position ON cards(deck_id, position);
CREATE INDEX idx_cards_species ON cards(species_id) WHERE species_id IS NOT NULL;

-- User Progress
CREATE INDEX idx_progress_user_next_review ON user_progress(user_id, next_review);
CREATE INDEX idx_progress_user_card ON user_progress(user_id, card_id);

-- Card Media
CREATE INDEX idx_card_media_card_id ON card_media(card_id) WHERE card_id IS NOT NULL;
CREATE INDEX idx_card_media_species_id ON card_media(species_id) WHERE species_id IS NOT NULL;

-- Tags
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_type ON tags(type);
CREATE INDEX idx_tags_names ON tags USING GIN (names);

-- Deck Tags
CREATE INDEX idx_deck_tags_deck ON deck_tags(deck_id);
CREATE INDEX idx_deck_tags_tag ON deck_tags(tag_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 4.1 Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4.2 Species
ALTER TABLE species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Species are viewable by everyone"
  ON species FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create species"
  ON species FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update species"
  ON species FOR UPDATE
  USING (auth.uid() = created_by);

-- 4.3 Decks
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and public decks"
  ON decks FOR SELECT
  USING (
    deleted_at IS NULL
    AND (user_id = auth.uid() OR is_public = true)
  );

CREATE POLICY "Users can create decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- 4.4 Cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cards of accessible decks"
  ON cards FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.deleted_at IS NULL
      AND (decks.user_id = auth.uid() OR decks.is_public = true)
    )
  );

CREATE POLICY "Users can create cards in own decks"
  ON cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_id
      AND decks.user_id = auth.uid()
      AND decks.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can update cards in own decks"
  ON cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- 4.5 Card Media
ALTER TABLE card_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media of accessible cards"
  ON card_media FOR SELECT
  USING (
    -- Media gekoppeld aan cards
    (card_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM cards
      JOIN decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND cards.deleted_at IS NULL
      AND decks.deleted_at IS NULL
      AND (decks.user_id = auth.uid() OR decks.is_public = true)
    ))
    OR
    -- Media gekoppeld aan species (altijd zichtbaar)
    (species_id IS NOT NULL)
  );

CREATE POLICY "Users can add media to own cards"
  ON card_media FOR INSERT
  WITH CHECK (
    -- Media voor eigen cards
    (card_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM cards
      JOIN decks ON decks.id = cards.deck_id
      WHERE cards.id = card_id
      AND decks.user_id = auth.uid()
      AND decks.deleted_at IS NULL
    ))
    OR
    -- Media voor species (iedereen mag toevoegen)
    (species_id IS NOT NULL AND auth.uid() IS NOT NULL)
  );

CREATE POLICY "Users can update media of own cards"
  ON card_media FOR UPDATE
  USING (
    card_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM cards
      JOIN decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media of own cards"
  ON card_media FOR DELETE
  USING (
    card_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM cards
      JOIN decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND decks.user_id = auth.uid()
    )
  );

-- 4.6 User Progress
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON user_progress FOR ALL
  USING (auth.uid() = user_id);

-- 4.7 Deck Stars
ALTER TABLE deck_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
  ON deck_stars FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own ratings"
  ON deck_stars FOR ALL
  USING (auth.uid() = user_id);

-- 4.8 Tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update tags"
  ON tags FOR UPDATE
  USING (auth.uid() = created_by);

-- 4.9 Deck Tags
ALTER TABLE deck_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags of accessible decks"
  ON deck_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_tags.deck_id
      AND decks.deleted_at IS NULL
      AND (decks.user_id = auth.uid() OR decks.is_public = true)
    )
  );

CREATE POLICY "Users can add tags to own decks"
  ON deck_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from own decks"
  ON deck_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_tags.deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ============================================================================

-- 5.1 Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_species_updated_at
  BEFORE UPDATE ON species
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5.2 Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5.3 Update card_count on decks when cards are added/removed
CREATE OR REPLACE FUNCTION update_deck_card_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE decks SET card_count = card_count + 1 WHERE id = NEW.deck_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE decks SET card_count = card_count - 1 WHERE id = OLD.deck_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_card_count
  AFTER INSERT OR DELETE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_deck_card_count();

-- ============================================================================
-- 6. STORAGE BUCKETS
-- ============================================================================

-- Avatars bucket: publiek leesbaar
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Media bucket: voor card media (foto's en audio)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. STORAGE RLS POLICIES
-- ============================================================================

-- Avatars: publiek leesbaar, eigen avatar beheren
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Media: publiek leesbaar (voor MVP), eigen media beheren
CREATE POLICY "Media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Users can upload media to own folders"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- DONE!
-- ============================================================================
-- Het schema is aangemaakt. Je kunt nu:
-- 1. De app starten met: npm run dev
-- 2. Testen door te registreren - er wordt automatisch een profile aangemaakt
