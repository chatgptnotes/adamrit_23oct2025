-- Migration: Add Bhopal rate columns to cghs_surgery table
-- Date: 2025-10-06
-- Description: Adds bhopal_nabh_rate and bhopal_non_nabh_rate columns to support Bhopal-specific pricing

-- Add new columns for Bhopal rates
ALTER TABLE public.cghs_surgery
ADD COLUMN IF NOT EXISTS bhopal_nabh_rate TEXT NULL,
ADD COLUMN IF NOT EXISTS bhopal_non_nabh_rate TEXT NULL;

-- Add indexes for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_cghs_surgery_bhopal_nabh_rate ON public.cghs_surgery (bhopal_nabh_rate) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cghs_surgery_bhopal_non_nabh_rate ON public.cghs_surgery (bhopal_non_nabh_rate) TABLESPACE pg_default;

-- Add comments for documentation
COMMENT ON COLUMN public.cghs_surgery.bhopal_nabh_rate IS 'NABH rate specific to Bhopal location';
COMMENT ON COLUMN public.cghs_surgery.bhopal_non_nabh_rate IS 'Non-NABH rate specific to Bhopal location';

SELECT 'Migration completed: Bhopal rate columns added to cghs_surgery table' as status;
