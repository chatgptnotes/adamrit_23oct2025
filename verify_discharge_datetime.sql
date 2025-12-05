-- Verification queries for discharge date & time functionality
-- Run these queries to verify the discharge flow is working correctly

-- 1. Check the discharge_date column type
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'visits'
  AND column_name = 'discharge_date';
-- Expected: data_type should be 'timestamp with time zone'

-- 2. View recent discharges with full timestamp
SELECT
    visit_id,
    admission_date,
    discharge_date,
    EXTRACT(HOUR FROM discharge_date) as discharge_hour,
    EXTRACT(MINUTE FROM discharge_date) as discharge_minute,
    is_discharged,
    bill_paid,
    discharge_mode
FROM visits
WHERE discharge_date IS NOT NULL
ORDER BY discharge_date DESC
LIMIT 10;
-- Check if discharge_date includes time component (not just 00:00:00)

-- 3. Check currently admitted patients (should NOT include discharged patients)
SELECT
    visit_id,
    patient_id,
    patient_type,
    admission_date,
    discharge_date,
    is_discharged
FROM visits
WHERE patient_type IN ('IPD', 'Emergency')
  AND discharge_date IS NULL
ORDER BY admission_date DESC;
-- These patients should appear in Currently Admitted dashboard

-- 4. Check discharged patients (should include patients with discharge_date)
SELECT
    visit_id,
    patient_id,
    patient_type,
    admission_date,
    discharge_date,
    is_discharged,
    bill_paid
FROM visits
WHERE patient_type IN ('IPD', 'Emergency')
  AND discharge_date IS NOT NULL
ORDER BY discharge_date DESC
LIMIT 20;
-- These patients should appear in Discharged Patients dashboard

-- 5. Summary statistics
SELECT
    patient_type,
    COUNT(*) as total_visits,
    COUNT(discharge_date) as discharged_count,
    COUNT(*) FILTER (WHERE discharge_date IS NULL) as currently_admitted,
    COUNT(*) FILTER (WHERE is_discharged = true) as marked_discharged
FROM visits
WHERE patient_type IN ('IPD', 'Emergency')
GROUP BY patient_type;
