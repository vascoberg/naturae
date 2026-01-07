-- Deck Likes tabel voor hartjes systeem
-- Simpele like/unlike toggle (geen rating)

CREATE TABLE IF NOT EXISTS deck_likes (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, deck_id)
);

-- Index voor snel tellen van likes per deck
CREATE INDEX idx_deck_likes_deck ON deck_likes(deck_id);

-- Denormalized like_count kolom toevoegen aan decks tabel
ALTER TABLE decks ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Index voor sorteren op populariteit
CREATE INDEX IF NOT EXISTS idx_decks_like_count ON decks(like_count DESC);

-- RLS Policies
ALTER TABLE deck_likes ENABLE ROW LEVEL SECURITY;

-- Iedereen kan likes zien (voor count)
CREATE POLICY "Anyone can view likes"
  ON deck_likes FOR SELECT
  USING (true);

-- Alleen ingelogde users kunnen liken
CREATE POLICY "Authenticated users can like"
  ON deck_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users kunnen alleen eigen likes verwijderen
CREATE POLICY "Users can unlike"
  ON deck_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger om like_count bij te werken
CREATE OR REPLACE FUNCTION update_deck_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE decks SET like_count = like_count + 1 WHERE id = NEW.deck_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE decks SET like_count = like_count - 1 WHERE id = OLD.deck_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_deck_like_change ON deck_likes;
CREATE TRIGGER on_deck_like_change
  AFTER INSERT OR DELETE ON deck_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_deck_like_count();
