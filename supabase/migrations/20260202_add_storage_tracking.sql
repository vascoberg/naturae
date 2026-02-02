-- Storage tracking voor freemium limieten
-- Alleen opslaglimiet: 50 MB gratis, 1 GB premium
-- GBIF/Xeno-canto externe links tellen niet mee

-- Voeg storage tracking kolommen toe aan profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';

-- Atomic increment functie voor storage tracking
CREATE OR REPLACE FUNCTION increment_storage_used(user_id UUID, bytes BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET storage_used_bytes = COALESCE(storage_used_bytes, 0) + bytes
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic decrement functie (met floor op 0 om negatieve waarden te voorkomen)
CREATE OR REPLACE FUNCTION decrement_storage_used(user_id UUID, bytes BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) - bytes)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
