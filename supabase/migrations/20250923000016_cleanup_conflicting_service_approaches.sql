-- Cleanup migration to resolve conflicting clinical/mandatory service approaches
-- This migration removes all conflicting approaches and keeps only simple UUID foreign keys

-- Drop all functions from the junction table approach that might reference non-existent fields
DROP FUNCTION IF EXISTS add_clinical_service_to_visit_by_text_id(TEXT, UUID, DECIMAL, VARCHAR, INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS get_clinical_services_for_visit(TEXT);
DROP FUNCTION IF EXISTS remove_clinical_service_from_visit(TEXT, UUID);
DROP FUNCTION IF EXISTS update_clinical_service_in_visit(TEXT, UUID, DECIMAL, VARCHAR, INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS get_visit_clinical_services_total(TEXT);
DROP FUNCTION IF EXISTS get_visit_uuid_from_visit_id(TEXT);

-- Drop all functions from the UUID array approach
DROP FUNCTION IF EXISTS add_clinical_service_to_visit(UUID, UUID, DECIMAL, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS add_mandatory_service_to_visit(UUID, UUID, DECIMAL, VARCHAR, INTEGER);

-- Drop junction table and related triggers/functions if they exist
DROP TRIGGER IF EXISTS trigger_calculate_clinical_service_amount ON public.visit_clinical_services;
DROP FUNCTION IF EXISTS calculate_clinical_service_amount();
DROP TRIGGER IF EXISTS trigger_visit_clinical_services_updated_at ON public.visit_clinical_services;
DROP FUNCTION IF EXISTS update_visit_clinical_services_updated_at();
DROP TABLE IF EXISTS public.visit_clinical_services;

-- Remove UUID array columns from visits table (from migration 20250923000014)
ALTER TABLE public.visits DROP COLUMN IF EXISTS clinical_service_ids;
ALTER TABLE public.visits DROP COLUMN IF EXISTS mandatory_service_ids;
ALTER TABLE public.visits DROP COLUMN IF EXISTS clinical_services_details;
ALTER TABLE public.visits DROP COLUMN IF EXISTS mandatory_services_details;

-- Drop related indexes for UUID arrays
DROP INDEX IF EXISTS idx_visits_clinical_service_ids;
DROP INDEX IF EXISTS idx_visits_mandatory_service_ids;
DROP INDEX IF EXISTS idx_visits_clinical_services_details;
DROP INDEX IF EXISTS idx_visits_mandatory_services_details;

-- Keep the JSONB columns for backward compatibility but they won't be actively used
-- ALTER TABLE public.visits DROP COLUMN IF EXISTS clinical_services;
-- ALTER TABLE public.visits DROP COLUMN IF EXISTS mandatory_services;

-- Ensure the simple UUID foreign key columns exist (from migration 20250923000013)
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS clinical_service_id UUID REFERENCES public.clinical_services(id) ON DELETE SET NULL;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS mandatory_service_id UUID REFERENCES public.mandatory_services(id) ON DELETE SET NULL;

-- Ensure indexes exist for the UUID foreign keys
CREATE INDEX IF NOT EXISTS idx_visits_clinical_service_id ON public.visits(clinical_service_id);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_service_id ON public.visits(mandatory_service_id);

-- Add comments for documentation
COMMENT ON COLUMN public.visits.clinical_service_id IS 'Foreign key reference to clinical_services table. All rate details fetched from master table.';
COMMENT ON COLUMN public.visits.mandatory_service_id IS 'Foreign key reference to mandatory_services table. All rate details fetched from master table.';

-- Note: This cleanup ensures only the simple UUID foreign key approach is used
-- The visits table will have:
-- - clinical_service_id UUID (foreign key to clinical_services.id)
-- - mandatory_service_id UUID (foreign key to mandatory_services.id)
-- - clinical_services JSONB (legacy, for backward compatibility)
-- - mandatory_services JSONB (legacy, for backward compatibility)

-- All rate and service details are fetched from the master tables via joins
-- No local storage of rate data to maintain single source of truth