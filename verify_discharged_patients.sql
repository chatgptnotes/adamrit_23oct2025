-- Comprehensive verification queries for discharged patients functionality
-- Run these queries to verify discharged patients are showing correctly

-- 1. Check all fields for discharged patients
SELECT
    visit_id,
    patient_id,
    patient_type,
    status,
    admission_date,
    discharge_date,
    is_discharged,
    bill_paid,
    discharge_mode,
    billing_status
FROM visits
WHERE discharge_date IS NOT NULL
  AND patient_type IN ('IPD', 'Emergency')
ORDER BY discharge_date DESC
LIMIT 20;
-- Expected: All should have status = 'discharged'

-- 2. Find patients with discharge_date but wrong status (should be none after migration)
SELECT
    visit_id,
    patient_type,
    status as current_status,
    discharge_date,
    is_discharged,
    'ISSUE: Has discharge_date but status != discharged' as issue
FROM visits
WHERE discharge_date IS NOT NULL
  AND status != 'discharged'
  AND patient_type IN ('IPD', 'Emergency');
-- Expected: 0 rows (empty result)

-- 3. Check if patients meet BOTH filters used by DischargedPatients page
-- Filter 1: discharge_date IS NOT NULL (database filter)
-- Filter 2: status = 'discharged' (client-side filter)
SELECT
    visit_id,
    patient_type,
    discharge_date IS NOT NULL as has_discharge_date,
    status = 'discharged' as status_is_discharged,
    CASE
        WHEN discharge_date IS NOT NULL AND status = 'discharged' THEN 'WILL SHOW'
        WHEN discharge_date IS NOT NULL AND status != 'discharged' THEN 'WILL NOT SHOW - Wrong status'
        WHEN discharge_date IS NULL THEN 'WILL NOT SHOW - Not discharged'
    END as will_show_in_discharged_dashboard
FROM visits
WHERE patient_type IN ('IPD', 'Emergency')
ORDER BY discharge_date DESC NULLS LAST
LIMIT 30;
-- All discharged patients should show "WILL SHOW"

-- 4. Summary statistics
SELECT
    patient_type,
    COUNT(*) as total_patients,
    COUNT(discharge_date) as total_discharged,
    COUNT(*) FILTER (WHERE discharge_date IS NOT NULL AND status = 'discharged') as discharged_with_correct_status,
    COUNT(*) FILTER (WHERE discharge_date IS NOT NULL AND status != 'discharged') as discharged_with_wrong_status,
    COUNT(*) FILTER (WHERE discharge_date IS NULL) as currently_admitted
FROM visits
WHERE patient_type IN ('IPD', 'Emergency')
GROUP BY patient_type
ORDER BY patient_type;
-- "discharged_with_wrong_status" should be 0

-- 5. Check most recent discharges with full patient details
SELECT
    v.visit_id,
    p.name as patient_name,
    p.patients_id,
    v.patient_type,
    v.status,
    v.admission_date,
    v.discharge_date,
    v.discharge_mode,
    v.is_discharged,
    v.bill_paid
FROM visits v
JOIN patients p ON v.patient_id = p.id
WHERE v.discharge_date IS NOT NULL
  AND v.patient_type IN ('IPD', 'Emergency')
ORDER BY v.discharge_date DESC
LIMIT 10;
-- Verify these patients should appear in Discharged Patients dashboard

-- 6. Find patients that might be missing from dashboards
SELECT
    visit_id,
    patient_type,
    status,
    discharge_date,
    CASE
        WHEN discharge_date IS NULL AND status = 'discharged' THEN 'Inconsistent: status=discharged but no discharge_date'
        WHEN discharge_date IS NOT NULL AND status != 'discharged' THEN 'Inconsistent: has discharge_date but status not discharged'
        ELSE 'Consistent'
    END as data_consistency
FROM visits
WHERE patient_type IN ('IPD', 'Emergency')
  AND (
      (discharge_date IS NULL AND status = 'discharged') OR
      (discharge_date IS NOT NULL AND status != 'discharged')
  );
-- Expected: 0 rows (empty result) - all data should be consistent
