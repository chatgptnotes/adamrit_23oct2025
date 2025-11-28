-- Add foreign key columns to visits table for clinical and mandatory services
-- This approach assumes one service per visit (1-to-1 or many-to-1 relationship)
-- Also adds backward compatibility with existing JSONB approach

-- Add clinical_service_id foreign key column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS clinical_service_id UUID REFERENCES public.clinical_services(id) ON DELETE SET NULL;

-- Add mandatory_service_id foreign key column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS mandatory_service_id UUID REFERENCES public.mandatory_services(id) ON DELETE SET NULL;

-- Optional: Add UUID arrays for multiple services per visit
-- Uncomment these lines if you need multiple services per visit
/*
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS clinical_service_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mandatory_service_ids UUID[] DEFAULT '{}';
*/

-- Note: Using single UUID foreign keys for one service per visit
-- This provides better performance and proper relational integrity

-- Note: Rate and amount details will be fetched from clinical_services and mandatory_services tables
-- This avoids data duplication and maintains single source of truth
-- Only storing the foreign key IDs in visits table

-- Note: Data validation constraints removed since we're only storing foreign key IDs
-- All rate and amount validations are handled in the master tables

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visits_clinical_service_id ON public.visits(clinical_service_id);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_service_id ON public.visits(mandatory_service_id);

-- Note: Removed JSONB GIN indexes since we're using UUID foreign keys
-- UUID foreign key indexes are automatically created

-- Add comments for documentation
COMMENT ON COLUMN public.visits.clinical_service_id IS 'Foreign key reference to clinical_services table. All rate details fetched from master table.';
COMMENT ON COLUMN public.visits.mandatory_service_id IS 'Foreign key reference to mandatory_services table. All rate details fetched from master table.';

-- Note: Trigger function removed since we're fetching all rate/amount details from master tables
-- No local calculations needed in visits table