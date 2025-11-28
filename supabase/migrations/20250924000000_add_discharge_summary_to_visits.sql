-- Add discharge_summary column to visits table
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS discharge_summary TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.visits.discharge_summary IS 'Discharge summary details for the patient visit';