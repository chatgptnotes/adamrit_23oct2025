-- ============================================================================
-- DIAGNOSTIC QUERY: Check poonam's Final Payments
-- Purpose: Find why newly created final payments don't appear in ledger
-- ============================================================================

-- STEP 1: Check if final_payments records exist for poonam
SELECT
  'FINAL_PAYMENTS RECORDS' as check_type,
  fp.id,
  fp.visit_id,
  fp.amount,
  fp.mode_of_payment,
  fp.payment_date,
  fp.patient_id,
  fp.bank_account_id,
  fp.bank_account_name,
  fp.created_at,
  p.name as patient_name,
  p.patients_id as mrn
FROM final_payments fp
LEFT JOIN patients p ON fp.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
  OR fp.visit_id IN (SELECT visit_id FROM visits WHERE patient_id IN (
    SELECT id FROM patients WHERE name ILIKE '%poonam%'
  ))
ORDER BY fp.created_at DESC
LIMIT 10;

-- STEP 2: Check if vouchers exist for poonam's final payments
SELECT
  'VOUCHERS FOR POONAM' as check_type,
  v.id as voucher_id,
  v.voucher_number,
  v.voucher_date,
  v.narration,
  v.patient_id,
  p.name as patient_name,
  v.created_at
FROM vouchers v
INNER JOIN patients p ON v.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
  AND v.voucher_date >= '2025-11-06'
ORDER BY v.created_at DESC
LIMIT 10;

-- STEP 3: Find orphaned final payments (no vouchers) for poonam
SELECT
  'ORPHANED FINAL PAYMENTS' as check_type,
  fp.id as final_payment_id,
  fp.visit_id,
  fp.amount,
  fp.mode_of_payment,
  fp.payment_date,
  fp.bank_account_name,
  p.name as patient_name,
  fp.created_at as payment_created,
  v.id as voucher_id,
  v.voucher_number
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
LEFT JOIN vouchers v ON (
  v.patient_id = fp.patient_id
  AND v.voucher_date = fp.payment_date
  AND v.narration ILIKE '%final%'
)
WHERE p.name ILIKE '%poonam%'
  AND v.id IS NULL  -- No voucher found
ORDER BY fp.created_at DESC
LIMIT 10;

-- STEP 4: Check voucher_entries for any poonam-related vouchers
SELECT
  'VOUCHER ENTRIES' as check_type,
  ve.id as entry_id,
  v.voucher_number,
  v.voucher_date,
  coa.account_name,
  ve.debit_amount,
  ve.credit_amount,
  p.name as patient_name
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
INNER JOIN patients p ON v.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
  AND v.voucher_date >= '2025-11-06'
ORDER BY v.voucher_date DESC, ve.id
LIMIT 20;

-- STEP 5: Check if payment_date is properly set
SELECT
  'PAYMENT_DATE CHECK' as check_type,
  fp.id,
  fp.payment_date,
  DATE(fp.created_at) as created_date,
  CASE
    WHEN fp.payment_date IS NULL THEN 'ERROR: payment_date is NULL'
    WHEN fp.payment_date != DATE(fp.created_at) THEN 'WARNING: payment_date differs from created_at'
    ELSE 'OK'
  END as status,
  p.name as patient_name
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
ORDER BY fp.created_at DESC
LIMIT 5;

-- STEP 6: Check if bank_account_id is set
SELECT
  'BANK_ACCOUNT_ID CHECK' as check_type,
  fp.id,
  fp.bank_account_id,
  fp.bank_account_name,
  coa.account_name as actual_bank_name,
  CASE
    WHEN fp.bank_account_id IS NULL THEN 'ERROR: bank_account_id is NULL'
    WHEN coa.id IS NULL THEN 'ERROR: bank_account_id points to non-existent account'
    ELSE 'OK'
  END as status,
  p.name as patient_name
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
LEFT JOIN chart_of_accounts coa ON fp.bank_account_id = coa.id
WHERE p.name ILIKE '%poonam%'
ORDER BY fp.created_at DESC
LIMIT 5;
