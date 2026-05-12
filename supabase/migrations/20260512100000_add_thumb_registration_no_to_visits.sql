-- Add Thumb Registration No. to visits (required at app layer, nullable in DB
-- to keep existing rows valid)
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS thumb_registration_no TEXT;

COMMENT ON COLUMN public.visits.thumb_registration_no IS
  'Thumb registration number captured at visit registration; required via UI.';

CREATE INDEX IF NOT EXISTS idx_visits_thumb_registration_no
  ON public.visits (thumb_registration_no);
