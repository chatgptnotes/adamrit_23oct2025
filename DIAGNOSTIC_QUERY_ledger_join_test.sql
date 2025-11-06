-- ============================================================================
-- DIAGNOSTIC QUERY: Test Ledger JOIN Conditions for Poonam
-- Purpose: Find exactly why ledger function excludes poonam's payments
-- ============================================================================

-- STEP 1: Simulate exact ledger query for poonam
SELECT
  'LEDGER QUERY SIMULATION' as test_type,
  v.voucher_date,
  v.voucher_number,
  v.narration,
  p.name as patient_name,
  p.patients_id as mrn,
  coa.account_name as bank_account,
  ve.debit_amount,
  ve.credit_amount,
  fp.id as final_payment_id,
  fp.payment_date as fp_payment_date,
  fp.patient_id as fp_patient_id,
  CASE
    WHEN fp.id IS NOT NULL THEN 'JOIN SUCCESS'
    ELSE 'JOIN FAILED'
  END as join_status
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
INNER JOIN patients p ON v.patient_id = p.id
LEFT JOIN final_payments fp ON (
  fp.patient_id = v.patient_id
  AND fp.payment_date = v.voucher_date
)
WHERE
  p.name ILIKE '%poonam%'
  AND v.voucher_date >= '2025-11-06'
ORDER BY v.voucher_date DESC;

-- STEP 2: Check voucher_date vs payment_date mismatch
SELECT
  'DATE MISMATCH CHECK' as test_type,
  fp.id as final_payment_id,
  fp.payment_date as final_payment_date,
  v.voucher_date as voucher_date,
  fp.payment_date = v.voucher_date as dates_match,
  CASE
    WHEN fp.payment_date IS NULL THEN 'ERROR: payment_date is NULL'
    WHEN v.voucher_date IS NULL THEN 'ERROR: voucher_date is NULL'
    WHEN fp.payment_date != v.voucher_date THEN 'MISMATCH: Dates do not match'
    ELSE 'OK'
  END as status,
  p.name as patient_name
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
LEFT JOIN vouchers v ON v.patient_id = fp.patient_id
WHERE p.name ILIKE '%poonam%'
  AND fp.created_at >= '2025-11-06'
ORDER BY fp.created_at DESC;

-- STEP 3: Check if voucher_entries use correct bank account
SELECT
  'BANK ACCOUNT IN VOUCHER_ENTRIES' as test_type,
  v.voucher_number,
  v.voucher_date,
  coa.account_name,
  coa.account_group,
  ve.debit_amount,
  ve.credit_amount,
  fp.bank_account_name as expected_bank,
  CASE
    WHEN coa.account_name = fp.bank_account_name THEN 'MATCH'
    WHEN coa.account_name ILIKE '%' || fp.bank_account_name || '%' THEN 'PARTIAL MATCH'
    ELSE 'MISMATCH'
  END as bank_match_status,
  p.name as patient_name
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
INNER JOIN patients p ON v.patient_id = p.id
LEFT JOIN final_payments fp ON (
  fp.patient_id = v.patient_id
  AND fp.payment_date = v.voucher_date
)
WHERE p.name ILIKE '%poonam%'
  AND v.voucher_date >= '2025-11-06'
ORDER BY v.voucher_date DESC;

-- STEP 4: Test with actual ledger function call (SARASWAT BANK)
SELECT * FROM get_ledger_statement_with_patients(
  'SARASWAT BANK',
  '2025-11-06',
  '2025-11-06',
  NULL,
  NULL
);

-- STEP 5: Test with actual ledger function call (STATE BANK OF INDIA)
SELECT * FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-06',
  '2025-11-06',
  NULL,
  NULL
);

-- STEP 6: Check account name exact match
SELECT
  'ACCOUNT NAME CHECK' as test_type,
  DISTINCT coa.account_name,
  ve.debit_amount,
  p.name as patient_name,
  v.voucher_date
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
INNER JOIN patients p ON v.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
  AND v.voucher_date >= '2025-11-06'
  AND ve.debit_amount > 0
ORDER BY coa.account_name;

-- STEP 7: Show ALL vouchers with patient info (regardless of ledger filters)
SELECT
  'ALL POONAM VOUCHERS' as test_type,
  v.id as voucher_id,
  v.voucher_number,
  v.voucher_date,
  v.narration,
  p.name as patient_name,
  p.patients_id as mrn,
  ve.account_id,
  coa.account_name,
  ve.debit_amount,
  ve.credit_amount,
  v.created_at
FROM vouchers v
INNER JOIN patients p ON v.patient_id = p.id
LEFT JOIN voucher_entries ve ON ve.voucher_id = v.id
LEFT JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE p.name ILIKE '%poonam%'
  AND v.voucher_date >= '2025-11-06'
ORDER BY v.voucher_date DESC, ve.id;
