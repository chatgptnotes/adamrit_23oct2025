-- Fix "clinical_service_rate" error by removing all conflicting triggers and functions
-- This migration completely removes any code that might be referencing non-existent fields

-- Drop ALL triggers and functions that might be causing conflicts
DROP TRIGGER IF EXISTS trigger_visits_calculate_amounts ON public.visits;
DROP TRIGGER IF EXISTS trigger_visits_validate_rates ON public.visits;
DROP TRIGGER IF EXISTS trigger_visits_update_clinical_services ON public.visits;
DROP TRIGGER IF EXISTS trigger_visits_update_mandatory_services ON public.visits;

-- Drop any functions that might be referenced by triggers
DROP FUNCTION IF EXISTS calculate_visit_amounts();
DROP FUNCTION IF EXISTS validate_visit_rates();
DROP FUNCTION IF EXISTS update_visit_clinical_services();
DROP FUNCTION IF EXISTS update_visit_mandatory_services();

-- Drop ALL junction table related functions and triggers
DROP FUNCTION IF EXISTS add_clinical_service_to_visit(UUID, UUID, DECIMAL, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS add_mandatory_service_to_visit(UUID, UUID, DECIMAL, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS calculate_clinical_service_amount();
DROP FUNCTION IF EXISTS update_visit_clinical_services_updated_at();

-- Drop junction table and all related objects
DROP TRIGGER IF EXISTS trigger_calculate_clinical_service_amount ON public.visit_clinical_services;
DROP TRIGGER IF EXISTS trigger_visit_clinical_services_updated_at ON public.visit_clinical_services;
DROP TABLE IF EXISTS public.visit_clinical_services CASCADE;

-- Remove any columns that might have triggers attached
-- First drop constraints that might reference these columns
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS fk_visits_clinical_service_ids;
ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS fk_visits_mandatory_service_ids;

-- Remove UUID array columns and their details
ALTER TABLE public.visits DROP COLUMN IF EXISTS clinical_service_ids CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS mandatory_service_ids CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS clinical_services_details CASCADE;
ALTER TABLE public.visits DROP COLUMN IF EXISTS mandatory_services_details CASCADE;

-- Drop any indexes related to these columns
DROP INDEX IF EXISTS idx_visits_clinical_service_ids;
DROP INDEX IF EXISTS idx_visits_mandatory_service_ids;
DROP INDEX IF EXISTS idx_visits_clinical_services_details;
DROP INDEX IF EXISTS idx_visits_mandatory_services_details;

-- Ensure we have clean, simple UUID foreign key columns
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS clinical_service_id UUID REFERENCES public.clinical_services(id) ON DELETE SET NULL;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS mandatory_service_id UUID REFERENCES public.mandatory_services(id) ON DELETE SET NULL;

-- Create clean indexes for the foreign keys
CREATE INDEX IF NOT EXISTS idx_visits_clinical_service_id ON public.visits(clinical_service_id);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_service_id ON public.visits(mandatory_service_id);

-- Add documentation comments
COMMENT ON COLUMN public.visits.clinical_service_id IS 'Simple UUID foreign key to clinical_services table';
COMMENT ON COLUMN public.visits.mandatory_service_id IS 'Simple UUID foreign key to mandatory_services table';

-- Make sure we have the clinical_services and mandatory_services JSONB columns for backward compatibility
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS clinical_services JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS mandatory_services JSONB DEFAULT '[]'::jsonb;

-- Create indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_visits_clinical_services ON public.visits USING gin (clinical_services);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_services ON public.visits USING gin (mandatory_services);

-- Final note: This ensures a clean state with only:
-- 1. Simple UUID foreign keys (primary approach)
-- 2. JSONB columns (legacy compatibility)
-- 3. No conflicting triggers or functions