-- Migration: Add annotation support to card_media table
-- Date: 2025-01-09
-- Description: Adds columns for storing photo annotations (Fabric.js JSON + pre-rendered PNG)

-- Add new columns for annotations
ALTER TABLE card_media
ADD COLUMN IF NOT EXISTS annotated_url TEXT,
ADD COLUMN IF NOT EXISTS annotations JSONB;

-- Add comment explaining the columns
COMMENT ON COLUMN card_media.annotated_url IS 'URL to pre-rendered PNG with annotations baked in (for fast display)';
COMMENT ON COLUMN card_media.annotations IS 'Fabric.js JSON data for editing annotations (hybrid approach)';

-- Index for quickly finding media with annotations
CREATE INDEX IF NOT EXISTS idx_card_media_has_annotations
ON card_media ((annotations IS NOT NULL))
WHERE annotations IS NOT NULL;

-- Verify the migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_media' AND column_name = 'annotated_url'
  ) THEN
    RAISE NOTICE 'Migration successful: annotated_url column exists';
  ELSE
    RAISE EXCEPTION 'Migration failed: annotated_url column not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_media' AND column_name = 'annotations'
  ) THEN
    RAISE NOTICE 'Migration successful: annotations column exists';
  ELSE
    RAISE EXCEPTION 'Migration failed: annotations column not found';
  END IF;
END $$;
