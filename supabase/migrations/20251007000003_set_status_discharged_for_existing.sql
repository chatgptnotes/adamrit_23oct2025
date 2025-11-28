-- Backfill status field for existing discharged patients
-- This updates visits that have been discharged but status was not set to 'discharged'

-- Update all IPD and Emergency visits that have discharge_date but status is not 'discharged'
UPDATE public.visits
SET status = 'discharged'
WHERE discharge_date IS NOT NULL
  AND (status IS NULL OR status != 'discharged')
  AND patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency');

-- Log the number of rows updated
DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'Updated status to "discharged" for % existing discharged patients', rows_updated;
END $$;

-- Verify the update
DO $$
DECLARE
  total_discharged INTEGER;
  with_correct_status INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_discharged
  FROM visits
  WHERE discharge_date IS NOT NULL
    AND patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency');

  SELECT COUNT(*) INTO with_correct_status
  FROM visits
  WHERE discharge_date IS NOT NULL
    AND status = 'discharged'
    AND patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency');

  RAISE NOTICE 'Total discharged patients: %, With correct status: %', total_discharged, with_correct_status;
END $$;
