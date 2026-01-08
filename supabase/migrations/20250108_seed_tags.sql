-- Seed data voor standaard tags
-- Deze tags zijn beschikbaar voor alle gebruikers om te gebruiken bij hun leersets

INSERT INTO tags (slug, names, type, usage_count) VALUES
  -- Topic tags (onderwerpen)
  ('vogels', '{"nl": "Vogels", "en": "Birds"}', 'topic', 0),
  ('planten', '{"nl": "Planten", "en": "Plants"}', 'topic', 0),
  ('zoogdieren', '{"nl": "Zoogdieren", "en": "Mammals"}', 'topic', 0),
  ('insecten', '{"nl": "Insecten", "en": "Insects"}', 'topic', 0),
  ('paddenstoelen', '{"nl": "Paddenstoelen", "en": "Mushrooms"}', 'topic', 0),
  ('reptielen', '{"nl": "Reptielen", "en": "Reptiles"}', 'topic', 0),
  ('amfibieen', '{"nl": "Amfibieën", "en": "Amphibians"}', 'topic', 0),
  ('vissen', '{"nl": "Vissen", "en": "Fish"}', 'topic', 0),
  ('bomen', '{"nl": "Bomen", "en": "Trees"}', 'topic', 0),
  ('bloemen', '{"nl": "Bloemen", "en": "Flowers"}', 'topic', 0),
  ('vlinders', '{"nl": "Vlinders", "en": "Butterflies"}', 'topic', 0),
  ('libellen', '{"nl": "Libellen", "en": "Dragonflies"}', 'topic', 0),
  ('schelpen', '{"nl": "Schelpen", "en": "Shells"}', 'topic', 0),
  ('spinnen', '{"nl": "Spinnen", "en": "Spiders"}', 'topic', 0),
  ('mossen', '{"nl": "Mossen", "en": "Mosses"}', 'topic', 0),
  ('korstmossen', '{"nl": "Korstmossen", "en": "Lichens"}', 'topic', 0),

  -- Region tags (regio's)
  ('nederland', '{"nl": "Nederland", "en": "Netherlands"}', 'region', 0),
  ('belgie', '{"nl": "België", "en": "Belgium"}', 'region', 0),
  ('europa', '{"nl": "Europa", "en": "Europe"}', 'region', 0),
  ('wereldwijd', '{"nl": "Wereldwijd", "en": "Worldwide"}', 'region', 0),

  -- Content-type tags (type content)
  ('fotos', '{"nl": "Foto''s", "en": "Photos"}', 'content-type', 0),
  ('geluiden', '{"nl": "Geluiden", "en": "Sounds"}', 'content-type', 0),
  ('tekeningen', '{"nl": "Tekeningen", "en": "Drawings"}', 'content-type', 0),

  -- Difficulty tags (moeilijkheid)
  ('beginner', '{"nl": "Beginner", "en": "Beginner"}', 'difficulty', 0),
  ('gevorderd', '{"nl": "Gevorderd", "en": "Intermediate"}', 'difficulty', 0),
  ('expert', '{"nl": "Expert", "en": "Expert"}', 'difficulty', 0)

ON CONFLICT (slug) DO NOTHING;
