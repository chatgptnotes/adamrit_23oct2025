-- Add missing clinical_services and mandatory_services columns to visits table
-- This is required for backward compatibility with existing code

-- Add clinical_services JSONB column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS clinical_services JSONB DEFAULT '[]'::jsonb;

-- Add mandatory_services JSONB column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS mandatory_services JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_visits_clinical_services ON public.visits USING gin (clinical_services);
CREATE INDEX IF NOT EXISTS idx_visits_mandatory_services ON public.visits USING gin (mandatory_services);

-- Add comments for documentation
COMMENT ON COLUMN public.visits.clinical_services IS 'JSONB array storing clinical services data for this visit (legacy format)';
COMMENT ON COLUMN public.visits.mandatory_services IS 'JSONB array storing mandatory services data for this visit (legacy format)';