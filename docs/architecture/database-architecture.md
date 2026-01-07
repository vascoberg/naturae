# Database Architectuur - Naturae

> Dit document beschrijft de database architectuur voor Naturae. Het is een levend document dat we iteratief verfijnen.

## Inhoudsopgave
1. [Design Principes](#design-principes)
2. [Schema Overzicht](#schema-overzicht)
3. [Tabellen](#tabellen)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Indexen](#indexen)
6. [SQL Migraties](#sql-migraties)

---

## Design Principes

### Server-side First
- **Alle data-validatie** gebeurt in de database via constraints en RLS policies
- **Geen vertrouwen op client-side validatie** voor security - alleen voor UX
- **Business logic in RLS policies** waar mogelijk, zodat de API-laag dun blijft

### Waarom Server-side?
| Concern | Server-side | Client-side |
|---------|-------------|-------------|
| Authenticatie | Supabase Auth (JWT) | - |
| Autorisatie | RLS policies | - |
| Data validatie | CHECK constraints | UX feedback alleen |
| Business rules | Database triggers/functions | - |
| Optimistic updates | - | Alleen voor UX snelheid |

### Industry Standards
- **OWASP**: Nooit client-side security vertrouwen
- **Defense in Depth**: Meerdere lagen beveiliging
- **Principle of Least Privilege**: RLS geeft alleen toegang tot eigen data

---

## Schema Overzicht

```
                                    ┌─────────────────┐
                                    │      tags       │
                                    │  (labels)       │
                                    └────────┬────────┘
                                             │
┌─────────────────┐       ┌─────────────────┐│      ┌─────────────────┐
│   auth.users    │       │     profiles    ││      │   deck_tags     │
│   (Supabase)    │◄──────│   (public info) ││      │   (many-to-many)│
└────────┬────────┘       └─────────────────┘│      └────────┬────────┘
         │                                   │               │
         │ user_id                           └───────────────┤
         ▼                                                   │
┌─────────────────┐       ┌─────────────────┐                │
│     decks       │◄──────│  deck_stars     │◄───────────────┘
│   (leersets)    │       │  (ratings)      │
└────────┬────────┘       └─────────────────┘
         │
         │ deck_id
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     cards       │◄──────│ user_progress   │       │    species      │
│   (flashcards)  │       │ (SRS state)     │       │ (soorten DB)    │
└────────┬────────┘       └─────────────────┘       └────────┬────────┘
         │                                                   │
         │ card_id                                           │ species_id
         ▼                                                   │
┌─────────────────┐                                          │
│   card_media    │◄─────────────────────────────────────────┘
│ (foto's, audio) │
└─────────────────┘
```

### Kernconcepten

| Concept | Beschrijving |
|---------|--------------|
| **Species** | Gedeelde database van soorten (Boerenzwaluw = 1 record, gebruikt in meerdere decks) |
| **Cards** | Specifieke flashcard in een deck, kan linken naar een species |
| **Tags** | Flexibele labels voor decks (meertalig, community-driven) |
| **Card Media** | Foto's en audio, met attributie, gelinkt aan card én optioneel aan species |

---

## Tabellen

### 1. `profiles` - Gebruikersprofielen

> Uitbreiding op Supabase Auth voor publieke gebruikersinfo

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9_]+$')
);
```

**Beslissingen:**
- [x] ~~Willen we usernames verplicht maken?~~ **Ja, verplicht**
- [ ] Moeten we bio/beschrijving toevoegen voor Sprint 3 (community)?

> **Note:** Username wordt gevraagd tijdens onboarding na eerste login. De auto-create trigger maakt een profiel aan zonder username, waarna de gebruiker deze moet invullen voordat ze verder kunnen.

---

### 2. `decks` - Leersets

```sql
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,

  -- Visibility & Sharing
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE, -- Sprint 3: Voor private sharing via link

  -- Copy tracking
  copied_from_deck_id UUID REFERENCES decks ON DELETE SET NULL,

  -- Metadata
  card_count INTEGER DEFAULT 0, -- Denormalized voor performance
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT title_max_length CHECK (char_length(title) <= 100),
  CONSTRAINT description_max_length CHECK (char_length(description) <= 500)
);
```

**Beslissingen:**
- [x] ~~Moeten we een `category` enum maken of vrije tekst toestaan?~~ **Vervangen door tags systeem**
- [x] ~~`share_token` voor private sharing~~ **Ja, maar Sprint 3**
- [x] ~~Soft deletes?~~ **Ja, via `deleted_at` kolom**
- [x] ~~Copy tracking?~~ **Via `copied_from_deck_id` kolom (simpeler dan aparte tabel)**

> **Note:** Categorisatie gaat via het `tags` systeem (zie hieronder). Dit maakt flexibele, meertalige labels mogelijk.

---

### 3. `cards` - Flashcards

```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES decks ON DELETE CASCADE,

  -- Link naar species (optioneel)
  species_id UUID REFERENCES species ON DELETE SET NULL,

  -- Front (vraag) - tekst optioneel, media via card_media tabel
  front_text TEXT,

  -- Back (antwoord) - verplicht tenzij species gekoppeld is
  back_text TEXT,

  -- Ordering
  position INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Constraints: back_text is verplicht OF species_id moet ingevuld zijn
  CONSTRAINT has_answer CHECK (
    back_text IS NOT NULL AND char_length(trim(back_text)) > 0
    OR species_id IS NOT NULL
  )
);
```

**Beslissingen:**
- [x] ~~Max aantal cards per deck?~~ **Geen limiet**
- [x] ~~Soft deletes?~~ **Ja, via `deleted_at` kolom**
- [x] ~~Media met attributie?~~ **Ja, via aparte `card_media` tabel**
- [x] ~~Species metadata?~~ **Ja, via `species_id` foreign key naar `species` tabel**

> **Note:** Een card kan linken naar een `species` voor rijke informatie (Species Book). Als `species_id` is ingevuld, wordt de species naam als antwoord gebruikt tenzij `back_text` is overschreven.

---

### 4. `card_media` - Media met Attributie

```sql
CREATE TABLE card_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gekoppeld aan card OF species (één van beide verplicht)
  card_id UUID REFERENCES cards ON DELETE CASCADE,
  species_id UUID REFERENCES species ON DELETE CASCADE,

  -- Media info
  type TEXT NOT NULL, -- 'image', 'audio'
  url TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'front', -- 'front', 'back'

  -- Attributie
  attribution_name TEXT,        -- "Jan de Fotograaf"
  attribution_url TEXT,         -- Link naar origineel of profiel
  attribution_source TEXT,      -- "waarneming.nl", "xeno-canto", "eigen foto"
  license TEXT,                 -- "CC BY-SA 4.0", "All rights reserved", etc.

  -- Ordering (voor meerdere media per positie)
  display_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_type CHECK (type IN ('image', 'audio')),
  CONSTRAINT valid_position CHECK (position IN ('front', 'back', 'both')),
  CONSTRAINT has_parent CHECK (card_id IS NOT NULL OR species_id IS NOT NULL)
);
```

**Gebruik:**
- **Card media**: Specifieke foto/audio voor één flashcard in een deck
- **Species media**: Gedeelde media voor een soort (gebruikt in Species Book, beschikbaar voor alle cards die naar deze species linken)

**Voorbeelden:**

```sql
-- Foto gekoppeld aan een specifieke card
INSERT INTO card_media (card_id, type, url, position, attribution_name, attribution_source, attribution_url, license)
VALUES (
  'card-uuid',
  'image',
  'https://storage.supabase.co/...',
  'front',
  'Piet Jansen',
  'waarneming.nl',
  'https://waarneming.nl/observation/12345',
  'CC BY-NC'
);

-- Geluid gekoppeld aan een species (voor Species Book)
INSERT INTO card_media (species_id, type, url, position, attribution_name, attribution_source, attribution_url, license)
VALUES (
  'species-uuid',
  'audio',
  'https://storage.supabase.co/...',
  'front',
  'Maria de Vogelaar',
  'xeno-canto',
  'https://xeno-canto.org/12345',
  'CC BY-NC-SA 4.0'
);
```

> **Note:** Media kan aan een `card` OF aan een `species` gekoppeld worden. Species media is beschikbaar voor alle cards die naar die species linken.

---

### 5. `user_progress` - Leervoortgang & Spaced Repetition

```sql
CREATE TABLE user_progress (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards ON DELETE CASCADE,

  -- FSRS Algorithm State
  stability REAL DEFAULT 0,        -- Hoe stabiel het geheugen is
  difficulty REAL DEFAULT 0,       -- Hoe moeilijk de kaart is (0-1)
  elapsed_days INTEGER DEFAULT 0,  -- Dagen sinds laatste review
  scheduled_days INTEGER DEFAULT 0, -- Dagen tot volgende review
  reps INTEGER DEFAULT 0,          -- Aantal herhalingen
  lapses INTEGER DEFAULT 0,        -- Aantal keer vergeten
  state INTEGER DEFAULT 0,         -- 0=New, 1=Learning, 2=Review, 3=Relearning

  -- Timestamps
  last_review TIMESTAMPTZ,
  next_review TIMESTAMPTZ,

  -- Simple stats
  times_seen INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, card_id)
);
```

**Notities:**
- FSRS algoritme is geïmplementeerd via `ts-fsrs` library
- `state` enum: 0=New → 1=Learning → 2=Review → 3=Relearning (bij fouten)
- Alle FSRS velden (stability, difficulty, elapsed_days, etc.) worden actief gebruikt

---

### 6. `deck_stars` - Ratings (Sprint 3)

```sql
CREATE TABLE deck_stars (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES decks ON DELETE CASCADE,

  rating INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, deck_id),
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);
```

---

### 7. `species` - Soorten Database (Species Book)

> Gedeelde database van soorten. Een "Boerenzwaluw" bestaat één keer en kan door meerdere decks/cards worden gebruikt.

```sql
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificatie
  scientific_name TEXT NOT NULL UNIQUE,  -- "Hirundo rustica" (canonical identifier)

  -- Namen (meertalig via JSON)
  common_names JSONB NOT NULL DEFAULT '{}',
  -- Voorbeeld: {"nl": "Boerenzwaluw", "en": "Barn Swallow", "de": "Rauchschwalbe"}

  -- Taxonomie
  taxonomy JSONB DEFAULT '{}',
  -- Voorbeeld: {"kingdom": "Animalia", "class": "Aves", "order": "Passeriformes", "family": "Hirundinidae"}

  -- Beschrijvingen (meertalig)
  descriptions JSONB DEFAULT '{}',
  -- Voorbeeld: {"nl": {"appearance": "...", "sound": "...", "behavior": "..."}, "en": {...}}

  -- Feiten
  facts JSONB DEFAULT '{}',
  -- Voorbeeld: {"wingspan_cm": [32, 35], "length_cm": [17, 19], "weight_g": [16, 25]}

  -- Externe links
  external_links JSONB DEFAULT '{}',
  -- Voorbeeld: {"waarneming_nl": "https://...", "xeno_canto": "https://...", "observation_org": "https://..."}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users ON DELETE SET NULL
);

-- Index voor zoeken op wetenschappelijke naam
CREATE INDEX idx_species_scientific_name ON species(scientific_name);

-- Index voor zoeken in common_names (GIN voor JSONB)
CREATE INDEX idx_species_common_names ON species USING GIN (common_names);
```

**Voorbeelden:**

```sql
-- Boerenzwaluw toevoegen
INSERT INTO species (scientific_name, common_names, taxonomy, descriptions, facts, external_links)
VALUES (
  'Hirundo rustica',
  '{"nl": "Boerenzwaluw", "en": "Barn Swallow", "de": "Rauchschwalbe", "fr": "Hirondelle rustique"}',
  '{"kingdom": "Animalia", "phylum": "Chordata", "class": "Aves", "order": "Passeriformes", "family": "Hirundinidae", "genus": "Hirundo"}',
  '{"nl": {"appearance": "Slanke zwaluw met diep gevorkte staart, donkerblauw bovendeel en roestbruine keel.", "sound": "Kwetterende zang, roep is een scherp \"wiet\"."}}',
  '{"wingspan_cm": [32, 35], "length_cm": [17, 19], "weight_g": [16, 25], "size_group": "sparrow-size"}',
  '{"waarneming_nl": "https://waarneming.nl/species/800/", "xeno_canto": "https://xeno-canto.org/species/Hirundo-rustica"}'
);

-- Gewone pad toevoegen (amfibie)
INSERT INTO species (scientific_name, common_names, taxonomy, facts)
VALUES (
  'Bufo bufo',
  '{"nl": "Gewone pad", "en": "Common Toad"}',
  '{"class": "Amphibia", "order": "Anura", "family": "Bufonidae"}',
  '{"length_cm": [8, 15], "habitat": ["forest", "garden", "wetland"]}'
);
```

**Design keuzes:**
- **JSONB voor meertaligheid**: Flexibel, geen aparte vertaaltabellen nodig
- **Wetenschappelijke naam als canonical ID**: Eenduidig, universeel
- **Beschrijvingen per taal**: Zoals BirdID (appearance, sound, behavior)
- **Facts als JSON**: Flexibel voor verschillende soortgroepen (vogels hebben wingspan, amfibieën niet)

---

### 8. `tags` - Labels/Tags Systeem

> Flexibele, meertalige tags voor deck categorisatie en vindbaarheid.

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Canonical slug (uniek, lowercase, geen spaties)
  slug TEXT NOT NULL UNIQUE,  -- "birds", "netherlands", "migratory-birds"

  -- Namen (meertalig)
  names JSONB NOT NULL DEFAULT '{}',
  -- Voorbeeld: {"nl": "Vogels", "en": "Birds", "de": "Vögel", "fr": "Oiseaux"}

  -- Tag type (voor filtering/groepering)
  type TEXT NOT NULL DEFAULT 'topic',
  -- Types: 'topic' (vogels, planten), 'region' (Nederland, Europa), 'language' (Nederlands), 'difficulty' (beginner), 'content-type' (geluiden, foto's)

  -- Metadata
  usage_count INTEGER DEFAULT 0,  -- Denormalized: aantal decks met deze tag
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT valid_type CHECK (type IN ('topic', 'region', 'language', 'difficulty', 'content-type', 'other'))
);

-- Index voor snel zoeken
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_tags_type ON tags(type);
CREATE INDEX idx_tags_names ON tags USING GIN (names);
```

**Voorbeelden:**

```sql
-- Topic tags
INSERT INTO tags (slug, names, type) VALUES
  ('birds', '{"nl": "Vogels", "en": "Birds", "de": "Vögel"}', 'topic'),
  ('amphibians', '{"nl": "Amfibieën", "en": "Amphibians"}', 'topic'),
  ('grasshoppers', '{"nl": "Sprinkhanen", "en": "Grasshoppers"}', 'topic'),
  ('migratory-birds', '{"nl": "Trekvogels", "en": "Migratory Birds"}', 'topic');

-- Region tags
INSERT INTO tags (slug, names, type) VALUES
  ('netherlands', '{"nl": "Nederland", "en": "Netherlands"}', 'region'),
  ('europe', '{"nl": "Europa", "en": "Europe"}', 'region'),
  ('western-palearctic', '{"nl": "West-Palearctisch", "en": "Western Palearctic"}', 'region');

-- Content-type tags
INSERT INTO tags (slug, names, type) VALUES
  ('sounds', '{"nl": "Geluiden", "en": "Sounds"}', 'content-type'),
  ('photos', '{"nl": "Foto''s", "en": "Photos"}', 'content-type');

-- Language tags
INSERT INTO tags (slug, names, type) VALUES
  ('dutch', '{"nl": "Nederlands", "en": "Dutch"}', 'language'),
  ('english', '{"nl": "Engels", "en": "English"}', 'language');

-- Difficulty tags
INSERT INTO tags (slug, names, type) VALUES
  ('beginner', '{"nl": "Beginner", "en": "Beginner"}', 'difficulty'),
  ('advanced', '{"nl": "Gevorderd", "en": "Advanced"}', 'difficulty');
```

---

### 9. `deck_tags` - Deck-Tag Koppeling

```sql
CREATE TABLE deck_tags (
  deck_id UUID NOT NULL REFERENCES decks ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags ON DELETE CASCADE,

  -- Wie heeft deze tag toegevoegd
  added_by UUID REFERENCES auth.users ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (deck_id, tag_id)
);

-- Index voor snel ophalen van tags per deck
CREATE INDEX idx_deck_tags_deck ON deck_tags(deck_id);
CREATE INDEX idx_deck_tags_tag ON deck_tags(tag_id);
```

**Voorbeeld: Trekvogels leerset taggen**

```sql
-- Deck: "Trekvogels van Nederland - Geluiden"
-- Tags: vogels, nederland, trekvogels, geluiden, nederlands

INSERT INTO deck_tags (deck_id, tag_id, added_by)
SELECT 'deck-uuid', id, 'user-uuid'
FROM tags
WHERE slug IN ('birds', 'netherlands', 'migratory-birds', 'sounds', 'dutch');
```

---

### 10. `tag_suggestions` - Tag Suggesties (Toekomst)

> Voor het helpen van gebruikers bij het taggen van hun decks.

```sql
CREATE TABLE tag_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Als een deck bepaalde kenmerken heeft...
  trigger_type TEXT NOT NULL,  -- 'species_taxonomy', 'deck_title', 'media_type'
  trigger_value TEXT NOT NULL, -- 'class:Aves', 'vogel', 'audio'

  -- ...suggereer deze tag
  suggested_tag_id UUID NOT NULL REFERENCES tags ON DELETE CASCADE,

  -- Prioriteit (hogere = eerder tonen)
  priority INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voorbeelden:
-- Als deck cards bevat met species van class "Aves" → suggereer "birds" tag
-- Als deck title "vogel" bevat → suggereer "birds" tag
-- Als deck audio media bevat → suggereer "sounds" tag
```

> **Note:** Deze tabel is voor toekomstige "smart tagging" functionaliteit. Het systeem kan automatisch tags suggereren op basis van de content van een deck.

---

## Row Level Security (RLS)

### Profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Iedereen kan profielen lezen (voor publieke sets)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Alleen eigen profiel bewerken
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profiel wordt aangemaakt via trigger
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Decks

```sql
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- Lezen: eigen decks + publieke decks (excl. soft deleted)
CREATE POLICY "Users can view own and public decks"
  ON decks FOR SELECT
  USING (
    deleted_at IS NULL
    AND (user_id = auth.uid() OR is_public = true)
  );

-- Aanmaken: alleen voor ingelogde users
CREATE POLICY "Users can create decks"
  ON decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Bewerken: alleen eigen decks (excl. soft deleted)
CREATE POLICY "Users can update own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Soft delete: alleen eigen decks
CREATE POLICY "Users can soft delete own decks"
  ON decks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

> **Note:** We gebruiken soft deletes, dus geen DELETE policy. Decks worden "verwijderd" door `deleted_at` te zetten.

### Cards

```sql
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Lezen: kaarten van toegankelijke decks (excl. soft deleted)
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

-- Insert: alleen in eigen decks
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

-- Update: alleen kaarten in eigen decks
CREATE POLICY "Users can update cards in own decks"
  ON cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = cards.deck_id
      AND decks.user_id = auth.uid()
    )
  );
```

> **Note:** Cards worden soft deleted via `deleted_at`. Cascade delete bij deck soft delete wordt afgehandeld via applicatie logica of trigger.

### Card Media

```sql
ALTER TABLE card_media ENABLE ROW LEVEL SECURITY;

-- Lezen: media van toegankelijke cards
CREATE POLICY "Users can view media of accessible cards"
  ON card_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND cards.deleted_at IS NULL
      AND decks.deleted_at IS NULL
      AND (decks.user_id = auth.uid() OR decks.is_public = true)
    )
  );

-- Insert: alleen in eigen cards
CREATE POLICY "Users can add media to own cards"
  ON card_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cards
      JOIN decks ON decks.id = cards.deck_id
      WHERE cards.id = card_id
      AND decks.user_id = auth.uid()
      AND decks.deleted_at IS NULL
    )
  );

-- Update/Delete: alleen eigen media
CREATE POLICY "Users can manage media of own cards"
  ON card_media FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND decks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete media of own cards"
  ON card_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cards
      JOIN decks ON decks.id = cards.deck_id
      WHERE cards.id = card_media.card_id
      AND decks.user_id = auth.uid()
    )
  );
```

### User Progress

```sql
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Alleen eigen voortgang
CREATE POLICY "Users can manage own progress"
  ON user_progress FOR ALL
  USING (auth.uid() = user_id);
```

### Species

```sql
ALTER TABLE species ENABLE ROW LEVEL SECURITY;

-- Lezen: iedereen kan species lezen (publieke kennis)
CREATE POLICY "Species are viewable by everyone"
  ON species FOR SELECT
  USING (true);

-- Aanmaken: alleen ingelogde gebruikers (later: alleen admins/curators)
CREATE POLICY "Authenticated users can create species"
  ON species FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Bewerken: alleen de creator of admins (voor nu: creator only)
CREATE POLICY "Creators can update species"
  ON species FOR UPDATE
  USING (auth.uid() = created_by);
```

> **Note:** Species is gedeelde kennis. Voor MVP kan iedereen species aanmaken. Later kunnen we curator/admin rollen toevoegen.

### Tags

```sql
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Lezen: iedereen kan tags lezen
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

-- Aanmaken: alleen ingelogde gebruikers
CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Bewerken: alleen de creator (voor nu)
CREATE POLICY "Creators can update tags"
  ON tags FOR UPDATE
  USING (auth.uid() = created_by);
```

### Deck Tags

```sql
ALTER TABLE deck_tags ENABLE ROW LEVEL SECURITY;

-- Lezen: tags van toegankelijke decks
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

-- Toevoegen: alleen aan eigen decks
CREATE POLICY "Users can add tags to own decks"
  ON deck_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_id
      AND decks.user_id = auth.uid()
    )
  );

-- Verwijderen: alleen van eigen decks
CREATE POLICY "Users can remove tags from own decks"
  ON deck_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM decks
      WHERE decks.id = deck_tags.deck_id
      AND decks.user_id = auth.uid()
    )
  );
```

---

## Indexen

```sql
-- Decks: snel zoeken op user en publieke sets
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_decks_public ON decks(is_public) WHERE is_public = true;

-- Cards: snel ophalen per deck, gesorteerd
CREATE INDEX idx_cards_deck_position ON cards(deck_id, position);
CREATE INDEX idx_cards_species ON cards(species_id) WHERE species_id IS NOT NULL;

-- User Progress: snel ophalen wat er geoefend moet worden
CREATE INDEX idx_progress_user_next_review ON user_progress(user_id, next_review);
CREATE INDEX idx_progress_user_card ON user_progress(user_id, card_id);

-- Card Media: snel ophalen per card en species
CREATE INDEX idx_card_media_card_id ON card_media(card_id) WHERE card_id IS NOT NULL;
CREATE INDEX idx_card_media_species_id ON card_media(species_id) WHERE species_id IS NOT NULL;

-- Species: zoeken (aanvullend op GIN indexes in table definition)
-- idx_species_scientific_name en idx_species_common_names zijn al gedefinieerd

-- Tags: zoeken (aanvullend op indexes in table definition)
-- idx_tags_slug, idx_tags_type, idx_tags_names zijn al gedefinieerd

-- Deck Tags: snel ophalen
-- idx_deck_tags_deck en idx_deck_tags_tag zijn al gedefinieerd
```

---

## Supabase Storage

### Bucket Structuur

```
storage/
├── avatars/                    # Profielfoto's (publiek)
│   └── {user_id}.jpg
│
└── media/                      # Card media (access via RLS)
    └── {user_id}/
        └── {deck_id}/
            └── {card_id}/
                ├── {media_id}.jpg
                └── {media_id}.mp3
```

### Bucket Configuratie

```sql
-- Avatars bucket: publiek leesbaar
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Media bucket: RLS controlled
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false);
```

### Storage RLS Policies

```sql
-- AVATARS: Publiek leesbaar, eigen avatar uploaden/bewerken

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

-- MEDIA: Toegang via deck visibility

-- Lezen: eigen media OF media van publieke decks
CREATE POLICY "Users can view media of accessible decks"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media'
    AND (
      -- Eigen media
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Media van publieke decks
      EXISTS (
        SELECT 1 FROM decks
        WHERE decks.id::text = (storage.foldername(name))[2]
        AND decks.is_public = true
        AND decks.deleted_at IS NULL
      )
    )
  );

-- Upload: alleen in eigen folders
CREATE POLICY "Users can upload media to own folders"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update/Delete: alleen eigen media
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
```

### Upload Flow (Applicatie)

```typescript
// Voorbeeld: Upload card media
async function uploadCardMedia(
  file: File,
  userId: string,
  deckId: string,
  cardId: string,
  mediaId: string
) {
  const path = `${userId}/${deckId}/${cardId}/${mediaId}.${getExtension(file)}`;

  const { data, error } = await supabase.storage
    .from('media')
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) throw error;

  // Get public URL (werkt alleen als bucket public is, anders signed URL)
  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(path);

  return publicUrl;
}
```

### Afbeelding Optimalisatie

Voor MVP: Client-side resize voor upload (max 1200px breed, ~80% quality JPEG).

Toekomst: Supabase Image Transformation of externe service (Cloudinary, imgix).

---

## SQL Migraties

### Sprint 1 - Basis Setup

```sql
-- Te kopiëren naar Supabase SQL Editor

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tables
-- [Kopieer table definitions hierboven]

-- 3. RLS Policies
-- [Kopieer RLS policies hierboven]

-- 4. Indexes
-- [Kopieer indexes hierboven]

-- 5. Triggers

-- Auto-update updated_at
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

CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
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

-- Update card_count on decks
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
```

---

## Open Vragen

- [x] ~~**Categories**: Enum of vrije tekst?~~ Vervangen door tags systeem
- [x] ~~**Usernames**: Verplicht of optioneel?~~ Verplicht
- [x] ~~**Card limit**: Hard limit?~~ Geen limiet
- [x] ~~**Share tokens**: Sprint 1 of later?~~ Sprint 3
- [x] ~~**Soft deletes**: Nodig?~~ Ja, voor decks en cards
- [x] ~~**Media attributie**: Hoe bijhouden?~~ Via `card_media` tabel met attribution velden
- [x] ~~**Storage buckets**: Hoe organiseren?~~ `avatars/` (publiek) + `media/{user}/{deck}/{card}/` (RLS)
- [x] ~~**Species metadata**?~~ Ja, via `species` tabel met JSONB voor meertaligheid
- [x] ~~**Tags/Labels systeem**?~~ Ja, via `tags` + `deck_tags` tabellen, meertalig
- [ ] **Species curator rollen**: Wie mag species aanmaken/bewerken? (Voor nu: iedereen)
- [ ] **Tag moderatie**: Hoe voorkomen we spam/duplicaat tags?
- [ ] **Species import**: Bulk import van bestaande soortenlijsten?

---

## Changelog

| Datum | Wijziging |
|-------|-----------|
| 2025-01-05 | Species tabel, tags systeem, BirdID-geïnspireerde uitbreidingen toegevoegd |
| 2025-01-05 | Card kan nu linken naar species, card_media kan naar species of card linken |
| 2025-01-04 | Initieel document aangemaakt |

