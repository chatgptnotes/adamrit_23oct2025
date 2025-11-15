-- ============================================================================
-- FINAL DIAGNOSTIC: Why Canara Bank Still Shows No Entries
-- ============================================================================

-- Check 1: Does final_payments have patient_id?
SELECT '=== CHECK 1: Final Payments Data ===' as check;
SELECT
  id,
  visit_id,
  patient_id,
  amount,
  mode_of_payment,
  payment_date,
  created_at
FROM final_payments
WHERE payment_date >= '2025-11-08'
ORDER BY created_at DESC;

-- Check 2: Were new vouchers created after trigger?
SELECT '' as separator;
SELECT '=== CHECK 2: Vouchers Created After Trigger ===' as check;
SELECT
  id,
  voucher_number,
  voucher_date,
  patient_id,
  narration,
  total_amount,
  created_at
FROM vouchers
WHERE voucher_date >= '2025-11-08'
ORDER BY created_at DESC;

-- Check 3: Voucher entries for those vouchers
SELECT '' as separator;
SELECT '=== CHECK 3: Voucher Entries ===' as check;
SELECT
  ve.id,
  v.voucher_number,
  v.patient_id as voucher_patient_id,
  coa.account_name,
  ve.debit_amount,
  ve.credit_amount
FROM voucher_entries ve
JOIN vouchers v ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE v.voucher_date >= '2025-11-08'
ORDER BY v.voucher_number, ve.entry_order;

-- Check 4: Test ledger function directly
SELECT '' as separator;
SELECT '=== CHECK 4: Direct Ledger Function Call (No Filters) ===' as check;
SELECT * FROM get_ledger_statement_with_patients(
  'Canara Bank [A/C120023677813)JARIPATHKA ]',
  '2025-11-08',
  '2025-11-08',
  NULL,
  NULL,
  NULL
) LIMIT 5;

-- Check 5: Check if trigger exists
SELECT '' as separator;
SELECT '=== CHECK 5: Trigger Status ===' as check;
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as is_enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'final_payments'::regclass
  AND tgname LIKE '%voucher%';
