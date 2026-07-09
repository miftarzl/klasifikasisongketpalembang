-- Migration: Add dataset metadata columns to the datasets table
-- Run this in Supabase SQL editor or psql.

ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS origin text,
  ADD COLUMN IF NOT EXISTS usage text,
  ADD COLUMN IF NOT EXISTS history text,
  ADD COLUMN IF NOT EXISTS philosophy text,
  ADD COLUMN IF NOT EXISTS characteristic text,
  ADD COLUMN IF NOT EXISTS gallery_description text;

-- Optional: ensure timestamp columns exist if missing.
ALTER TABLE datasets
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
