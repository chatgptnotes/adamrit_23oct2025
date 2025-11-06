-- ============================================================================
-- COMPARE: Working Payments vs Poonam's Not-Working Payments
-- Purpose: Find what's different about poonam's advance payments
-- ============================================================================

-- STEP 1: Show poonam's advance payments with ALL details
SELECT
  'POONAM ADVANCE PAYMENTS' as patient_type,
  ap.id,
  ap.patient_name,
  ap.advance_amount,
  ap.payment_date,
  ap.payment_mode,
  ap.bank_account_id,
  ap.bank_account_name,
  ap.created_at,
  p.patients_id as mrn
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
ORDER BY ap.payment_date DESC;

-- STEP 2: Show working advance payments (raj, ABC, aman)
SELECT
  'WORKING PAYMENTS (raj/ABC/aman)' as patient_type,
  ap.id,
  ap.patient_name,
  ap.advance_amount,
  ap.payment_date,
  ap.payment_mode,
  ap.bank_account_id,
  ap.bank_account_name,
  ap.created_at,
  p.patients_id as mrn
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
WHERE p.name ILIKE ANY(ARRAY['%raj%', '%ABC%', '%aman%'])
ORDER BY ap.payment_date DESC
LIMIT 5;

-- STEP 3: Compare bank accounts
SELECT
  'BANK ACCOUNT COMPARISON' as check_type,
  ap.patient_name,
  ap.bank_account_name,
  ap.bank_account_id,
  coa.account_name as actual_account_name,
  CASE
    WHEN coa.id IS NULL THEN 'ERROR: bank_account_id invalid'
    WHEN coa.account_name != ap.bank_account_name THEN 'MISMATCH'
    ELSE 'OK'
  END as status
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
LEFT JOIN chart_of_accounts coa ON ap.bank_account_id = coa.id
WHERE p.name ILIKE '%poonam%'
   OR p.name ILIKE ANY(ARRAY['%raj%', '%ABC%', '%aman%'])
ORDER BY p.name, ap.payment_date DESC;

-- STEP 4: Check vouchers for poonam's advance payments
SELECT
  'POONAM ADVANCE VOUCHERS' as check_type,
  ap.id as advance_payment_id,
  ap.payment_date,
  ap.advance_amount,
  ap.patient_name,
  v.id as voucher_id,
  v.voucher_number,
  v.voucher_date,
  CASE
    WHEN v.id IS NULL THEN 'NO VOUCHER - THIS IS THE PROBLEM!'
    ELSE 'Voucher exists'
  END as voucher_status
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
LEFT JOIN vouchers v ON (
  v.patient_id = ap.patient_id
  AND v.voucher_date = DATE(ap.payment_date)
)
WHERE p.name ILIKE '%poonam%'
ORDER BY ap.payment_date DESC;

-- STEP 5: Check vouchers for working payments
SELECT
  'WORKING PAYMENTS VOUCHERS' as check_type,
  ap.id as advance_payment_id,
  ap.payment_date,
  ap.advance_amount,
  ap.patient_name,
  v.id as voucher_id,
  v.voucher_number,
  v.voucher_date,
  CASE
    WHEN v.id IS NULL THEN 'NO VOUCHER'
    ELSE 'Voucher exists'
  END as voucher_status
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
LEFT JOIN vouchers v ON (
  v.patient_id = ap.patient_id
  AND v.voucher_date = DATE(ap.payment_date)
)
WHERE p.name ILIKE ANY(ARRAY['%raj%', '%ABC%', '%aman%'])
ORDER BY ap.payment_date DESC
LIMIT 5;

-- STEP 6: Test ledger function for poonam's dates
SELECT
  'LEDGER TEST - POONAM DATES' as test_type,
  voucher_date,
  patient_name,
  payment_type,
  payment_mode,
  debit_amount,
  bank_account
FROM get_ledger_statement_with_patients(
  'SARASWAT BANK',
  '2025-11-01',
  '2025-11-30',
  NULL,
  NULL
)
WHERE patient_name ILIKE '%poonam%';

-- STEP 7: Check payment dates for poonam
SELECT
  'POONAM PAYMENT DATES' as check_type,
  ap.payment_date,
  TO_CHAR(ap.payment_date, 'DD-MM-YYYY') as formatted_date,
  ap.advance_amount,
  ap.payment_mode,
  ap.bank_account_name
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
ORDER BY ap.payment_date;

-- STEP 8: Side-by-side comparison
SELECT
  'SIDE BY SIDE COMPARISON' as comparison_type,
  'poonam' as patient_group,
  COUNT(*) as total_payments,
  COUNT(DISTINCT ap.bank_account_name) as unique_banks,
  COUNT(DISTINCT ap.payment_mode) as unique_modes,
  MIN(ap.payment_date) as earliest_payment,
  MAX(ap.payment_date) as latest_payment,
  STRING_AGG(DISTINCT ap.bank_account_name, ', ') as banks_used
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
WHERE p.name ILIKE '%poonam%'

UNION ALL

SELECT
  'SIDE BY SIDE COMPARISON',
  'others (working)',
  COUNT(*),
  COUNT(DISTINCT ap.bank_account_name),
  COUNT(DISTINCT ap.payment_mode),
  MIN(ap.payment_date),
  MAX(ap.payment_date),
  STRING_AGG(DISTINCT ap.bank_account_name, ', ')
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
WHERE p.name ILIKE ANY(ARRAY['%raj%', '%ABC%', '%aman%']);

-- STEP 9: Check if poonam advance payments have voucher_entries
SELECT
  'VOUCHER ENTRIES CHECK' as check_type,
  ap.patient_name,
  ap.payment_date,
  ap.advance_amount,
  v.voucher_number,
  ve.id as voucher_entry_id,
  coa.account_name,
  ve.debit_amount,
  CASE
    WHEN ve.id IS NULL THEN 'NO ENTRIES - PROBLEM!'
    ELSE 'Entries exist'
  END as entry_status
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
LEFT JOIN vouchers v ON (v.patient_id = ap.patient_id AND v.voucher_date = DATE(ap.payment_date))
LEFT JOIN voucher_entries ve ON ve.voucher_id = v.id
LEFT JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE p.name ILIKE '%poonam%'
ORDER BY ap.payment_date DESC;
