-- Migration: Add Bhopal rate columns to lab table
-- Date: 2025-10-06
-- Description: Adds bhopal_nabh_rate and bhopal_non_nabh_rate columns to support Bhopal-specific pricing

-- Add new columns for Bhopal rates
ALTER TABLE public.lab
ADD COLUMN IF NOT EXISTS bhopal_nabh_rate NUMERIC(10, 2) NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS bhopal_non_nabh_rate NUMERIC(10, 2) NULL DEFAULT 0.00;

-- Add indexes for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_lab_bhopal_nabh_rate ON public.lab USING btree (bhopal_nabh_rate) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_lab_bhopal_non_nabh_rate ON public.lab USING btree (bhopal_non_nabh_rate) TABLESPACE pg_default;

-- Add comments for documentation
COMMENT ON COLUMN public.lab.bhopal_nabh_rate IS 'NABH rate specific to Bhopal location in rupees';
COMMENT ON COLUMN public.lab.bhopal_non_nabh_rate IS 'Non-NABH rate specific to Bhopal location in rupees';

SELECT 'Migration completed: Bhopal rate columns added to lab table' as status;
