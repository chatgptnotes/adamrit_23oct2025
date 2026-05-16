-- Cache the AI drug-interaction advisory on the prescription so it is computed
-- once per medicine set instead of on every modal open.
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS drug_interaction_report     JSONB,
  ADD COLUMN IF NOT EXISTS drug_interaction_signature  TEXT,
  ADD COLUMN IF NOT EXISTS drug_interaction_checked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.prescriptions.drug_interaction_report IS
  'Cached AI drug-drug interaction advisory (JSON: interactions[], summary).';
COMMENT ON COLUMN public.prescriptions.drug_interaction_signature IS
  'Key of the medicine set the cached report was generated for; mismatch triggers a re-check.';
COMMENT ON COLUMN public.prescriptions.drug_interaction_checked_at IS
  'When the cached interaction report was generated.';
