-- Migration: Add GBIF integration fields to species table
-- Date: 2026-01-12
-- Purpose: Enable GBIF (Global Biodiversity Information Facility) integration for species data
--
-- This migration adds columns to support:
-- 1. GBIF key linking (gbif_key)
-- 2. Canonical name without author (canonical_name)
-- 3. Source tracking (source: 'gbif' or 'manual')
-- 4. Raw GBIF data storage for future use (gbif_data)
--
-- Existing data remains intact. All new columns are nullable or have defaults.

-- Add new columns to species table
ALTER TABLE species
  ADD COLUMN IF NOT EXISTS gbif_key INTEGER UNIQUE,
  ADD COLUMN IF NOT EXISTS canonical_name TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS gbif_data JSONB;

-- Add constraint to validate source values
ALTER TABLE species
  ADD CONSTRAINT species_source_check
  CHECK (source IS NULL OR source IN ('gbif', 'manual'));

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_species_gbif_key
  ON species(gbif_key)
  WHERE gbif_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_species_canonical_name
  ON species(canonical_name)
  WHERE canonical_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_species_source
  ON species(source);

-- Create GIN index on common_names for efficient JSONB text search
-- This enables fast searches like: common_names->>'nl' ILIKE '%merel%'
CREATE INDEX IF NOT EXISTS idx_species_common_names_gin
  ON species
  USING GIN (common_names jsonb_path_ops);

-- Add comment to explain the new columns
COMMENT ON COLUMN species.gbif_key IS 'GBIF usageKey - unique identifier in Global Biodiversity Information Facility';
COMMENT ON COLUMN species.canonical_name IS 'Scientific name without author citation (e.g., "Turdus merula" instead of "Turdus merula Linnaeus, 1758")';
COMMENT ON COLUMN species.source IS 'Data source: "gbif" for GBIF-sourced entries, "manual" for user-added entries';
COMMENT ON COLUMN species.gbif_data IS 'Raw GBIF API response data for future reference and data enrichment';

-- Mark existing species as 'manual' since they were created before GBIF integration
-- (Only if source is NULL, which would be the case for pre-existing rows)
UPDATE species
SET source = 'manual'
WHERE source IS NULL;
