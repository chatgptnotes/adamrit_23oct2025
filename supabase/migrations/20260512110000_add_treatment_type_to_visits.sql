-- Add treatment_type column to visits table (Conservative vs Surgical).
-- Required via UI; nullable in DB to keep existing rows valid.
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS treatment_type TEXT;

-- Constrain allowed values
ALTER TABLE public.visits
  DROP CONSTRAINT IF EXISTS visits_treatment_type_check;

ALTER TABLE public.visits
  ADD CONSTRAINT visits_treatment_type_check
  CHECK (treatment_type IN ('Conservative', 'Surgical') OR treatment_type IS NULL);

COMMENT ON COLUMN public.visits.treatment_type IS
  'Planned treatment approach at admission: Conservative or Surgical. Required via UI.';

CREATE INDEX IF NOT EXISTS idx_visits_treatment_type
  ON public.visits (treatment_type);
