
-- First, let's check if there are any existing visits and handle them
-- We'll add the columns as nullable first, then update existing records

-- Add the new foreign key columns as nullable initially
ALTER TABLE public.visits 
  ADD COLUMN IF NOT EXISTS diagnosis_id uuid REFERENCES public.diagnoses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS surgery_id uuid REFERENCES public.cghs_surgery(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referring_doctor_id uuid REFERENCES public.referees(id) ON DELETE SET NULL;

-- For existing records that might have text values, we'll need to handle them
-- Since we're moving from text to foreign keys, let's create a default diagnosis if needed
DO $$
DECLARE
    default_diagnosis_id uuid;
BEGIN
    -- Check if we have a default diagnosis, if not create one
    SELECT id INTO default_diagnosis_id FROM public.diagnoses LIMIT 1;
    
    -- If no diagnoses exist, create a default one
    IF default_diagnosis_id IS NULL THEN
        INSERT INTO public.diagnoses (name, description) 
        VALUES ('General Consultation', 'Default diagnosis for existing visits')
        RETURNING id INTO default_diagnosis_id;
    END IF;
    
    -- Update any existing visits that don't have diagnosis_id set
    UPDATE public.visits 
    SET diagnosis_id = default_diagnosis_id 
    WHERE diagnosis_id IS NULL;
END $$;

-- Now we can safely make diagnosis_id NOT NULL
ALTER TABLE public.visits 
  ALTER COLUMN diagnosis_id SET NOT NULL;

-- Drop the old text columns if they still exist
ALTER TABLE public.visits 
  DROP COLUMN IF EXISTS diagnosis,
  DROP COLUMN IF EXISTS surgery, 
  DROP COLUMN IF EXISTS referring_doctor;

-- Create indexes for the new foreign key columns
CREATE INDEX IF NOT EXISTS idx_visits_diagnosis_id ON public.visits USING btree (diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_visits_surgery_id ON public.visits USING btree (surgery_id);
CREATE INDEX IF NOT EXISTS idx_visits_referring_doctor_id ON public.visits USING btree (referring_doctor_id);
