-- Test Deck voor Development
-- Dit is een test deck om de flashcard functionaliteit te testen.
-- Voer uit in Supabase SQL Editor.

-- Eerst een system user aanmaken voor seed data (of gebruik je eigen user_id)
-- We gebruiken een placeholder UUID die je kunt vervangen met je eigen user_id

-- Stap 1: Maak het test deck aan
-- BELANGRIJK: Vervang 'YOUR_USER_ID' met je eigen user ID uit de profiles tabel
-- Je kunt je user_id vinden via: SELECT id FROM profiles LIMIT 1;

DO $$
DECLARE
  v_user_id UUID;
  v_deck_id UUID;
  v_card_id UUID;
BEGIN
  -- Haal de eerste user op (jouw account)
  SELECT id INTO v_user_id FROM profiles LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Geen gebruiker gevonden. Registreer eerst een account.';
  END IF;

  -- Maak test deck aan
  INSERT INTO decks (id, user_id, title, description, is_public)
  VALUES (
    gen_random_uuid(),
    v_user_id,
    '[TEST] Nederlandse Bomen',
    'Dit is een TEST deck om de flashcard functionaliteit te testen. Bevat 5 voorbeeldkaarten met Nederlandse bomen.',
    true
  )
  RETURNING id INTO v_deck_id;

  -- Kaart 1: Eik
  INSERT INTO cards (deck_id, front_text, back_text, position)
  VALUES (v_deck_id, 'Welke boom heeft grote, gelobde bladeren en eikels als vruchten?', 'Eik (Quercus robur)', 0);

  -- Kaart 2: Beuk
  INSERT INTO cards (deck_id, front_text, back_text, position)
  VALUES (v_deck_id, 'Welke boom heeft gladde, grijze bast en ovale bladeren met een golvende rand?', 'Beuk (Fagus sylvatica)', 1);

  -- Kaart 3: Berk
  INSERT INTO cards (deck_id, front_text, back_text, position)
  VALUES (v_deck_id, 'Welke boom is herkenbaar aan zijn witte, afbladderende bast?', 'Berk (Betula pendula)', 2);

  -- Kaart 4: Linde
  INSERT INTO cards (deck_id, front_text, back_text, position)
  VALUES (v_deck_id, 'Welke boom heeft hartvormige bladeren en geurt heerlijk in de zomer?', 'Linde (Tilia)', 3);

  -- Kaart 5: Els
  INSERT INTO cards (deck_id, front_text, back_text, position)
  VALUES (v_deck_id, 'Welke boom groeit vaak langs water en heeft kleine, houtachtige proppen als vruchten?', 'Els (Alnus glutinosa)', 4);

  RAISE NOTICE 'Test deck aangemaakt met ID: %', v_deck_id;
  RAISE NOTICE 'Deck bevat 5 kaarten voor gebruiker: %', v_user_id;
END $$;

-- Verificatie query
SELECT
  d.id as deck_id,
  d.title,
  d.card_count,
  d.is_public,
  p.username as owner
FROM decks d
JOIN profiles p ON p.id = d.user_id
WHERE d.title LIKE '%TEST%'
ORDER BY d.created_at DESC
LIMIT 1;
