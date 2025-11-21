-- Fix existing visit_radiology records with missing or zero costs
-- This updates cost and unit_rate based on patient type and radiology rates

-- Update visit_radiology records with proper costs based on patient type
UPDATE public.visit_radiology
SET
  cost = CASE
    -- Private patients
    WHEN LOWER(TRIM(subquery.patient_type)) = 'private' OR LOWER(TRIM(subquery.corporate)) = 'private' THEN
      COALESCE(subquery.private_rate, 0) * COALESCE(subquery.quantity, 1)

    -- CGHS/ECHS/ESIC patients (Non-NABH)
    WHEN LOWER(TRIM(subquery.corporate)) IN ('cghs', 'echs', 'esic') THEN
      COALESCE(subquery.non_nabh_rate, subquery.nabh_rate, 0) * COALESCE(subquery.quantity, 1)

    -- MP Police/Ordnance Factory (Bhopal NABH)
    WHEN LOWER(TRIM(subquery.corporate)) IN ('mp police', 'ordnance factory', 'bhopal') THEN
      COALESCE(subquery.bhopal_nabh_rate, subquery.nabh_rate, 0) * COALESCE(subquery.quantity, 1)

    -- Other corporate patients (NABH)
    WHEN LOWER(TRIM(subquery.corporate)) != '' AND LOWER(TRIM(subquery.corporate)) != 'private' THEN
      COALESCE(subquery.nabh_rate, 0) * COALESCE(subquery.quantity, 1)

    -- Default to private rate
    ELSE
      COALESCE(subquery.private_rate, 0) * COALESCE(subquery.quantity, 1)
  END,

  unit_rate = CASE
    -- Private patients
    WHEN LOWER(TRIM(subquery.patient_type)) = 'private' OR LOWER(TRIM(subquery.corporate)) = 'private' THEN
      COALESCE(subquery.private_rate, 0)

    -- CGHS/ECHS/ESIC patients (Non-NABH)
    WHEN LOWER(TRIM(subquery.corporate)) IN ('cghs', 'echs', 'esic') THEN
      COALESCE(subquery.non_nabh_rate, subquery.nabh_rate, 0)

    -- MP Police/Ordnance Factory (Bhopal NABH)
    WHEN LOWER(TRIM(subquery.corporate)) IN ('mp police', 'ordnance factory', 'bhopal') THEN
      COALESCE(subquery.bhopal_nabh_rate, subquery.nabh_rate, 0)

    -- Other corporate patients (NABH)
    WHEN LOWER(TRIM(subquery.corporate)) != '' AND LOWER(TRIM(subquery.corporate)) != 'private' THEN
      COALESCE(subquery.nabh_rate, 0)

    -- Default to private rate
    ELSE
      COALESCE(subquery.private_rate, 0)
  END

FROM (
  SELECT
    vr.id as vr_id,
    v.patient_type,
    p.corporate,
    CAST(r.private AS numeric) as private_rate,
    CAST(r.NABH_NABL_Rate AS numeric) as nabh_rate,
    CAST(r.Non_NABH_NABL_Rate AS numeric) as non_nabh_rate,
    CAST(r.bhopal_nabh AS numeric) as bhopal_nabh_rate,
    CAST(vr.quantity AS integer) as quantity
  FROM public.visit_radiology vr
  JOIN public.visits v ON vr.visit_id = v.id
  JOIN public.patients p ON v.patient_id = p.id
  JOIN public.radiology r ON vr.radiology_id = r.id
  WHERE vr.cost IS NULL OR vr.cost = 0 OR vr.unit_rate IS NULL OR vr.unit_rate = 0
) subquery

WHERE public.visit_radiology.id = subquery.vr_id;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % visit_radiology records with proper costs', updated_count;
END $$;
