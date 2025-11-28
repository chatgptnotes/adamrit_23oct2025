-- Add discharge tracking columns to visits table
-- This tracks when a patient has completed final payment and been discharged

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS is_discharged BOOLEAN DEFAULT FALSE;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS discharge_date TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries filtering by discharge status
CREATE INDEX IF NOT EXISTS idx_visits_is_discharged
ON public.visits(is_discharged)
WHERE is_discharged = TRUE;

-- Add comments
COMMENT ON COLUMN public.visits.is_discharged IS 'Whether patient has completed final payment and been discharged';
COMMENT ON COLUMN public.visits.discharge_date IS 'Timestamp when patient was discharged (final payment completed)';
