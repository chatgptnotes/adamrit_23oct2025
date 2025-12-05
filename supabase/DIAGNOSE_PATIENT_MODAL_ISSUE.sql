-- ============================================================================
-- Diagnostic Query: Patient Details Modal Issue
-- Date: 2025-11-03
-- Purpose: Investigate why patient "ABC" shows "Patient UID: Not assigned"
-- ============================================================================

-- STEP 1: Find the patient "ABC" record
SELECT
  'PATIENT RECORD' as check_type,
  id as patient_uuid,
  name,
  patients_id as custom_mrn_id,
  CASE
    WHEN patients_id IS NULL THEN '❌ NULL - THIS IS THE PROBLEM!'
    ELSE '✓ Has MRN'
  END as mrn_status,
  created_at
FROM patients
WHERE name = 'ABC' OR patients_id = 'UHA25118001'
ORDER BY created_at DESC;

-- STEP 2: Check ledger entries for this patient
SELECT
  'LEDGER ENTRIES' as check_type,
  v.patient_id as patient_uuid_in_voucher,
  p.name,
  p.patients_id as mrn_from_patients_table,
  v.voucher_number,
  v.voucher_date,
  CASE
    WHEN v.patient_id IS NULL THEN '❌ Patient ID is NULL in voucher'
    WHEN p.id IS NULL THEN '❌ Patient not found (orphaned voucher)'
    ELSE '✓ Valid patient link'
  END as status
FROM vouchers v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE p.name = 'ABC' OR p.patients_id = 'UHA25118001' OR v.patient_id IN (
  SELECT id FROM patients WHERE name = 'ABC' OR patients_id = 'UHA25118001'
)
ORDER BY v.voucher_date DESC
LIMIT 5;

-- STEP 3: Check if patient has diagnoses
SELECT
  'DIAGNOSES COUNT' as check_type,
  COUNT(*) as total_count,
  p.name,
  p.patients_id
FROM diagnoses d
RIGHT JOIN patients p ON d.patient_id = p.id
WHERE p.name = 'ABC' OR p.patients_id = 'UHA25118001'
GROUP BY p.id, p.name, p.patients_id;

-- STEP 4: Check if patient has surgeries
SELECT
  'SURGERIES COUNT' as check_type,
  COUNT(*) as total_count,
  p.name,
  p.patients_id
FROM surgeries s
RIGHT JOIN patients p ON s.patient_id = p.id
WHERE p.name = 'ABC' OR p.patients_id = 'UHA25118001'
GROUP BY p.id, p.name, p.patients_id;

-- STEP 5: Check visits for this patient
SELECT
  'VISITS' as check_type,
  v.visit_id,
  v.visit_type,
  v.patient_type,
  v.created_at,
  p.name,
  p.patients_id as mrn
FROM visits v
INNER JOIN patients p ON v.patient_id = p.id
WHERE p.name = 'ABC' OR p.patients_id = 'UHA25118001'
ORDER BY v.created_at DESC
LIMIT 5;

-- STEP 6: Check advance_payment records
SELECT
  'ADVANCE PAYMENTS' as check_type,
  ap.id,
  ap.advance_amount,
  ap.payment_mode,
  ap.bank_account_name,
  ap.payment_date,
  p.name,
  p.patients_id as mrn
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
WHERE p.name = 'ABC' OR p.patients_id = 'UHA25118001'
ORDER BY ap.payment_date DESC
LIMIT 5;

-- STEP 7: Summary
SELECT
  '========== SUMMARY ==========' as info,
  '' as details
UNION ALL
SELECT
  'Total Patients named ABC:' as info,
  COUNT(*)::TEXT as details
FROM patients
WHERE name = 'ABC'
UNION ALL
SELECT
  'Patients with MRN UHA25118001:' as info,
  COUNT(*)::TEXT as details
FROM patients
WHERE patients_id = 'UHA25118001'
UNION ALL
SELECT
  'Patients with NULL patients_id:' as info,
  COUNT(*)::TEXT as details
FROM patients
WHERE name = 'ABC' AND patients_id IS NULL;
