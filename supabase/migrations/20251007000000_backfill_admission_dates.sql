-- Backfill missing admission_date for existing IPD and Emergency patients
-- For IPD/Emergency patients, the admission_date should be the same as visit_date
-- This updates historical records that were created before the admission_date logic was implemented

UPDATE public.visits
SET admission_date = visit_date
WHERE patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')
  AND admission_date IS NULL
  AND visit_date IS NOT NULL;

-- Log the number of rows updated
DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'Backfilled admission_date for % IPD/Emergency patients', rows_updated;
END $$;
