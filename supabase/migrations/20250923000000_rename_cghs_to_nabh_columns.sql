-- Rename CGHS columns to NABH in mandatory_services table
-- This migration renames cghs_rate to nabh_rate and non_cghs_rate to non_nabh_rate

-- Rename the columns
ALTER TABLE public.mandatory_services
RENAME COLUMN cghs_rate TO nabh_rate;

ALTER TABLE public.mandatory_services
RENAME COLUMN non_cghs_rate TO non_nabh_rate;

-- Update the column comments
COMMENT ON COLUMN public.mandatory_services.nabh_rate IS 'Rate for NABH (National Accreditation Board for Hospitals) payments';
COMMENT ON COLUMN public.mandatory_services.non_nabh_rate IS 'Rate for non-NABH payments';