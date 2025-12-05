-- ============================================================================
-- CHECK PAYMENT MODE VALUES
-- Purpose: Find exact payment mode values to debug filter issue
-- ============================================================================

-- Check poonam's final_payments payment mode
SELECT
  'POONAM FINAL PAYMENTS MODE' as check_type,
  fp.id,
  fp.mode_of_payment,
  fp.mode_of_payment = 'ONLINE' as exact_match_online,
  fp.bank_account_name,
  fp.payment_date,
  p.name as patient_name
FROM final_payments fp
JOIN patients p ON fp.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
ORDER BY fp.created_at DESC;

-- Check vouchers for poonam and their payment modes
SELECT
  'VOUCHERS PAYMENT MODE' as check_type,
  v.voucher_number,
  v.voucher_date,
  ve.debit_amount,
  coa.account_name as bank_account,
  p.name as patient_name,
  fp.mode_of_payment as final_payment_mode
FROM vouchers v
JOIN voucher_entries ve ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
JOIN patients p ON v.patient_id = p.id
LEFT JOIN final_payments fp ON (
  fp.patient_id = v.patient_id
  AND fp.payment_date = v.voucher_date
)
WHERE p.name ILIKE '%poonam%'
  AND ve.debit_amount > 0
ORDER BY v.voucher_date DESC;

-- Test ledger function WITHOUT payment_mode filter
SELECT
  'TEST WITHOUT FILTER' as test_type,
  voucher_date,
  patient_name,
  payment_type,
  payment_mode,
  debit_amount,
  bank_account
FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-06',
  '2025-11-06',
  NULL,
  NULL  -- NO payment_mode filter
);

-- Test WITH 'ONLINE' filter (current frontend behavior)
SELECT
  'TEST WITH ONLINE FILTER' as test_type,
  voucher_date,
  patient_name,
  payment_type,
  payment_mode,
  debit_amount,
  bank_account
FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-06',
  '2025-11-06',
  NULL,
  'ONLINE'  -- WITH filter
);

-- Show ALL possible payment mode values in final_payments
SELECT
  mode_of_payment,
  COUNT(*) as count
FROM final_payments
GROUP BY mode_of_payment
ORDER BY count DESC;
