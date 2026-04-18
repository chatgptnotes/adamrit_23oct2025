-- Fix visit_surgeries table to support Maharashtra Yojana procedures
-- Problem 1: surgery_id FK references cghs_surgery(id) only — Yojana IDs come from yojana_mh_procedures
-- Problem 2: rate and rate_type columns are referenced in code but never created
-- Problem 3: sanction_status CHECK constraint is too restrictive

-- Step 1: Add rate and rate_type columns (they are inserted by saveSurgeriesToVisit but never existed)
ALTER TABLE public.visit_surgeries
  ADD COLUMN IF NOT EXISTS rate NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rate_type TEXT DEFAULT 'private';

-- Step 2: Add yojana_procedure_id to store the yojana_mh_procedures FK without breaking the cghs_surgery FK
ALTER TABLE public.visit_surgeries
  ADD COLUMN IF NOT EXISTS yojana_procedure_id UUID REFERENCES yojana_mh_procedures(id) ON DELETE SET NULL;

-- Step 3: Make surgery_id nullable so Yojana rows don't need a cghs_surgery reference
-- First drop the NOT NULL constraint (the FK itself stays, it just won't fire when the column is NULL)
ALTER TABLE public.visit_surgeries
  ALTER COLUMN surgery_id DROP NOT NULL;

-- Step 4: Drop the overly-strict unique constraint (visit_id, surgery_id) because
-- for Yojana rows surgery_id will be NULL, and NULL != NULL in SQL uniqueness checks,
-- meaning multiple Yojana surgeries for the same visit would all pass the unique check.
-- Replace it with a partial unique index per source type.
DROP INDEX IF EXISTS idx_visit_surgeries_unique;

-- Unique constraint for CGHS surgeries (surgery_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_visit_surgeries_cghs_unique
  ON public.visit_surgeries (visit_id, surgery_id)
  WHERE surgery_id IS NOT NULL;

-- Unique constraint for Yojana surgeries (yojana_procedure_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_visit_surgeries_yojana_unique
  ON public.visit_surgeries (visit_id, yojana_procedure_id)
  WHERE yojana_procedure_id IS NOT NULL;

-- Step 5: Relax sanction_status CHECK constraint if it exists (the 20250614 migration added one)
-- Use a safe approach: drop named constraint if it exists, add no constraint (text column is flexible)
DO $$
BEGIN
  -- Drop CHECK constraint on sanction_status if present (name varies by migration)
  ALTER TABLE public.visit_surgeries DROP CONSTRAINT IF EXISTS visit_surgeries_sanction_status_check;
EXCEPTION
  WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  -- Drop CHECK constraint on status if present (20250614 migration added one)
  ALTER TABLE public.visit_surgeries DROP CONSTRAINT IF EXISTS visit_surgeries_status_check;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Comments for documentation
COMMENT ON COLUMN public.visit_surgeries.rate IS 'Procedure rate at time of selection (CGHS/Yojana/Private)';
COMMENT ON COLUMN public.visit_surgeries.rate_type IS 'Rate source: private, nabh_nabl, non_nabh_nabl, bhopal_nabh, yojana_mh_tier3, etc.';
COMMENT ON COLUMN public.visit_surgeries.yojana_procedure_id IS 'FK to yojana_mh_procedures for Maharashtra Yojana patients (mutually exclusive with surgery_id being set)';
COMMENT ON COLUMN public.visit_surgeries.surgery_id IS 'FK to cghs_surgery for non-Yojana patients; NULL for Yojana patients';
