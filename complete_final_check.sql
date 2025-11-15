-- ============================================================================
-- COMPLETE FINAL CHECK: Why Canara Bank Ledger Still Empty
-- ============================================================================

-- Check 1: Final payments table data
SELECT '=== CHECK 1: Final Payments ===' as step;
SELECT
  id,
  visit_id,
  patient_id,
  patient_id IS NOT NULL as has_patient,
  amount,
  mode_of_payment,
  bank_account_id,
  bank_account_name,
  payment_date,
  created_at
FROM final_payments
WHERE payment_date >= '2025-11-08'
ORDER BY created_at DESC;

-- Check 2: Vouchers created (check if patient_id is populated NOW)
SELECT '' as separator;
SELECT '=== CHECK 2: Vouchers (After Trigger Enable) ===' as step;
SELECT
  id,
  voucher_number,
  voucher_date,
  patient_id,
  patient_id IS NOT NULL as has_patient,
  total_amount,
  narration,
  created_at,
  updated_at
FROM vouchers
WHERE voucher_date >= '2025-11-08'
ORDER BY updated_at DESC;

-- Check 3: Voucher entries for Canara Bank
SELECT '' as separator;
SELECT '=== CHECK 3: Voucher Entries for Canara Bank ===' as step;
SELECT
  ve.id,
  v.voucher_number,
  v.patient_id as voucher_patient_id,
  coa.account_code,
  coa.account_name,
  coa.account_name = 'Canara Bank [A/C120023677813)JARIPATHKA ]' as name_matches,
  ve.debit_amount,
  ve.credit_amount,
  v.created_at
FROM voucher_entries ve
JOIN vouchers v ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE v.voucher_date >= '2025-11-08'
  AND coa.account_name ILIKE '%canara%'
ORDER BY v.updated_at DESC;

-- Check 4: Call ledger function with exact account name
SELECT '' as separator;
SELECT '=== CHECK 4: Ledger Function Result ===' as step;
SELECT
  voucher_date,
  voucher_number,
  patient_name,
  patient_id,
  payment_mode,
  debit_amount,
  credit_amount,
  narration
FROM get_ledger_statement_with_patients(
  'Canara Bank [A/C120023677813)JARIPATHKA ]',
  '2025-11-08',
  '2025-11-08',
  NULL,  -- no MRN filter
  NULL,  -- no payment mode filter
  NULL   -- no hospital filter
);

-- Check 5: If above is empty, try with date range
SELECT '' as separator;
SELECT '=== CHECK 5: Ledger Function with Date Range ===' as step;
SELECT
  voucher_date,
  voucher_number,
  patient_name,
  patient_id,
  payment_mode,
  debit_amount,
  credit_amount
FROM get_ledger_statement_with_patients(
  'Canara Bank [A/C120023677813)JARIPATHKA ]',
  '2025-11-01',
  '2025-11-30',
  NULL,
  NULL,
  NULL
);

-- Check 6: Trigger status
SELECT '' as separator;
SELECT '=== CHECK 6: Current Trigger Status ===' as step;
SELECT
  tgname as trigger_name,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED ✓'
    WHEN 'D' THEN 'DISABLED ✗'
    ELSE tgenabled::text
  END as status
FROM pg_trigger
WHERE tgrelid = 'final_payments'::regclass
  AND tgname LIKE '%voucher%';

-- Check 7: If still no data, show what accounts DO have entries
SELECT '' as separator;
SELECT '=== CHECK 7: Which Accounts Have Entries Today ===' as step;
SELECT
  coa.account_name,
  COUNT(*) as entry_count,
  SUM(ve.debit_amount) as total_debit,
  SUM(ve.credit_amount) as total_credit
FROM voucher_entries ve
JOIN vouchers v ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE v.voucher_date >= '2025-11-08'
GROUP BY coa.account_name
ORDER BY COUNT(*) DESC;
