-- Verify admission_date and discharge_date for currently admitted patients
-- Run this query to check if the backfill migration worked correctly

SELECT
    visit_id,
    patient_id,
    patient_type,
    visit_date,
    admission_date,
    discharge_date,
    CASE
        WHEN admission_date IS NOT NULL THEN
            CURRENT_DATE - admission_date
        ELSE NULL
    END AS days_admitted,
    CASE
        WHEN admission_date IS NULL AND patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency') THEN 'MISSING'
        ELSE 'OK'
    END AS status
FROM public.visits
WHERE patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')
    AND discharge_date IS NULL  -- Currently admitted (not discharged)
ORDER BY admission_date DESC NULLS LAST;

-- Summary statistics
SELECT
    patient_type,
    COUNT(*) AS total_patients,
    COUNT(admission_date) AS with_admission_date,
    COUNT(*) - COUNT(admission_date) AS missing_admission_date,
    COUNT(discharge_date) AS with_discharge_date
FROM public.visits
WHERE patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')
    AND discharge_date IS NULL
GROUP BY patient_type;
