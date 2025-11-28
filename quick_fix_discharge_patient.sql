-- QUICK FIX: Manually discharge a patient for testing
-- Replace 'IH25I22001' with actual visit_id you want to discharge

-- Step 1: Find a patient to discharge (currently admitted IPD patient)
SELECT
    visit_id,
    patient_id,
    patient_type,
    status,
    admission_date,
    discharge_date
FROM visits
WHERE patient_type IN ('IPD', 'Emergency', 'IPD (Inpatient)')
  AND discharge_date IS NULL
ORDER BY admission_date DESC
LIMIT 10;

-- Step 2: Manually discharge a patient (REPLACE visit_id)
-- Uncomment and run this after replacing the visit_id
/*
UPDATE visits
SET
    discharge_date = NOW(),
    discharge_mode = 'recovery',
    bill_paid = true,
    is_discharged = true,
    status = 'discharged'
WHERE visit_id = 'REPLACE_WITH_ACTUAL_VISIT_ID' -- Example: 'IH25I22001'
  AND discharge_date IS NULL;
*/

-- Step 3: Verify the discharge
-- Uncomment and run this after step 2
/*
SELECT
    visit_id,
    patient_type,
    status,
    admission_date,
    discharge_date,
    discharge_mode,
    is_discharged,
    bill_paid
FROM visits
WHERE visit_id = 'REPLACE_WITH_ACTUAL_VISIT_ID'; -- Example: 'IH25I22001'
*/

-- Step 4: Check if patient now appears in discharged list
SELECT
    v.visit_id,
    v.patient_type,
    v.status,
    v.discharge_date,
    p.name as patient_name,
    p.hospital_name
FROM visits v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE v.discharge_date IS NOT NULL
  AND v.patient_type IN ('IPD', 'Emergency', 'IPD (Inpatient)')
  AND v.status = 'discharged'
ORDER BY v.discharge_date DESC;
