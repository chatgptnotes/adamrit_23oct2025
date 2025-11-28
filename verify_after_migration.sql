-- Verification query after running migration
-- This will show if patients are now properly set up to appear in Discharged Patients dashboard

-- 1. Count discharged patients
SELECT
    'Total discharged patients' as metric,
    COUNT(*) as count
FROM visits
WHERE discharge_date IS NOT NULL
  AND patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')
UNION ALL
SELECT
    'With correct status (discharged)' as metric,
    COUNT(*) as count
FROM visits
WHERE discharge_date IS NOT NULL
  AND status = 'discharged'
  AND patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency');

-- 2. Show discharged patients with all details
SELECT
    v.visit_id,
    p.name as patient_name,
    p.patients_id,
    p.hospital_name,
    v.patient_type,
    v.status,
    v.admission_date,
    v.discharge_date,
    v.is_discharged,
    v.bill_paid,
    v.discharge_mode
FROM visits v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE v.discharge_date IS NOT NULL
  AND v.patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')
ORDER BY v.discharge_date DESC;

-- 3. Check if they meet ALL requirements for Discharged Patients page
SELECT
    v.visit_id,
    'Database Filter: discharge_date NOT NULL' as filter1,
    (v.discharge_date IS NOT NULL) as passes_filter1,
    'Database Filter: patient_type IPD/Emergency' as filter2,
    (v.patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')) as passes_filter2,
    'Client Filter: status = discharged' as filter3,
    (LOWER(v.status) = 'discharged') as passes_filter3,
    CASE
        WHEN v.discharge_date IS NOT NULL
         AND v.patient_type IN ('IPD', 'IPD (Inpatient)', 'Emergency')
         AND LOWER(v.status) = 'discharged'
        THEN '✅ SHOULD SHOW IN DASHBOARD'
        ELSE '❌ WILL NOT SHOW'
    END as final_result,
    p.hospital_name
FROM visits v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE v.discharge_date IS NOT NULL
ORDER BY v.discharge_date DESC
LIMIT 10;
