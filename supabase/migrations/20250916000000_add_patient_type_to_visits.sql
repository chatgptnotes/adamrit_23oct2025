-- Add patient_type column to visits table
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS patient_type TEXT;

-- Add check constraint for patient_type values
ALTER TABLE public.visits
DROP CONSTRAINT IF EXISTS visits_patient_type_check;

ALTER TABLE public.visits
ADD CONSTRAINT visits_patient_type_check
CHECK (patient_type IN ('OPD', 'IPD', 'Emergency') OR patient_type IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN public.visits.patient_type IS 'Type of patient visit: OPD (Outpatient), IPD (Inpatient), or Emergency';

-- Set default value for existing records (optional - you can remove this if not needed)
UPDATE public.visits
SET patient_type = 'OPD'
WHERE patient_type IS NULL;