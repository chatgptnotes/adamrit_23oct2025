-- ============================================================================
-- Diagnostic: Why Visit ID is not showing in Ledger Statement
-- Date: 2025-11-03
-- ============================================================================

-- TEST 1: Check advance_payment table for visit_id
SELECT
  'TEST 1: advance_payment has visit_id?' as test_name,
  ap.id,
  ap.patient_id,
  ap.payment_date,
  ap.advance_amount,
  ap.payment_mode,
  ap.bank_account_id,
  ap.visit_id,  -- Check if this column exists and has data
  'Does visit_id column exist in advance_payment?' as question
FROM advance_payment ap
WHERE DATE(ap.payment_date) = '2025-11-03'
  AND ap.payment_mode = 'ONLINE'
ORDER BY ap.payment_date DESC
LIMIT 5;

-- TEST 2: Check if visits exist for these patients on these dates
SELECT
  'TEST 2: visits for these patients on 2025-11-03' as test_name,
  v.id as visit_id,
  v.patient_id,
  v.visit_date,
  v.visit_id as visit_number,
  v.visit_type,
  p.name as patient_name,
  p.patients_id as mrn
FROM visits v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE DATE(v.visit_date) = '2025-11-03'
ORDER BY v.visit_date DESC;

-- TEST 3: Check vouchers for STATE BANK on 2025-11-03
SELECT
  'TEST 3: vouchers on 2025-11-03' as test_name,
  v.id,
  v.voucher_number,
  v.voucher_date,
  v.patient_id,
  v.reference_number,  -- Sometimes visit_id is stored here
  p.name as patient_name
FROM vouchers v
LEFT JOIN patients p ON v.patient_id = p.id
WHERE v.voucher_date = '2025-11-03'
ORDER BY v.voucher_date DESC;

-- TEST 4: Try to JOIN all tables to see what's missing
SELECT
  'TEST 4: Full JOIN to see data' as test_name,
  v.voucher_number,
  v.voucher_date,
  p.name as patient_name,
  v.reference_number as voucher_ref_number,
  vis.visit_id as from_visits_table,
  ap.visit_id as from_advance_payment,
  'Which one has visit_id?' as question
FROM vouchers v
LEFT JOIN patients p ON v.patient_id = p.id
LEFT JOIN visits vis ON (vis.patient_id = v.patient_id AND DATE(vis.visit_date) = v.voucher_date)
LEFT JOIN advance_payment ap ON (
  ap.patient_id = v.patient_id
  AND DATE(ap.payment_date) = v.voucher_date
)
WHERE v.voucher_date = '2025-11-03'
ORDER BY v.voucher_date DESC;

-- TEST 5: Check schema of advance_payment table
SELECT
  'TEST 5: advance_payment table schema' as test_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'advance_payment'
  AND column_name ILIKE '%visit%'
ORDER BY ordinal_position;
