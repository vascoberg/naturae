-- Voeg bio kolom toe aan profiles tabel
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Constraint voor bio lengte (max 500 karakters)
ALTER TABLE profiles ADD CONSTRAINT bio_length CHECK (bio IS NULL OR char_length(bio) <= 500);
