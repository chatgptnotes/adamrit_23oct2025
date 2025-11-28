-- ============================================================================
-- DIAGNOSTIC: Check Ledger Data for Canara Bank
-- Purpose: Find out why ledger statement shows "No transactions found"
-- ============================================================================

-- ============================================================================
-- STEP 1: Check what bank accounts exist in chart_of_accounts
-- ============================================================================

SELECT '=== BANK ACCOUNTS IN CHART_OF_ACCOUNTS ===' as section;

SELECT
  id,
  account_code,
  account_name,
  account_type,
  account_group
FROM chart_of_accounts
WHERE account_name ILIKE '%canara%'
   OR account_name ILIKE '%bank%'
ORDER BY account_name;

-- ============================================================================
-- STEP 2: Check if any vouchers were created today
-- ============================================================================

SELECT '' as separator;
SELECT '=== VOUCHERS CREATED TODAY ===' as section;

SELECT
  id,
  voucher_number,
  voucher_date,
  patient_id,
  narration,
  total_amount,
  created_at
FROM vouchers
WHERE voucher_date >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- STEP 3: Check voucher entries for today's vouchers
-- ============================================================================

SELECT '' as separator;
SELECT '=== VOUCHER ENTRIES FOR TODAY ===' as section;

SELECT
  ve.id,
  ve.voucher_id,
  v.voucher_number,
  coa.account_code,
  coa.account_name,
  ve.debit_amount,
  ve.credit_amount,
  ve.entry_order
FROM voucher_entries ve
JOIN vouchers v ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE v.voucher_date >= CURRENT_DATE
ORDER BY ve.voucher_id, ve.entry_order;

-- ============================================================================
-- STEP 4: Check final_payments table
-- ============================================================================

SELECT '' as separator;
SELECT '=== FINAL PAYMENTS CREATED TODAY ===' as section;

SELECT
  id,
  visit_id,
  amount,
  mode_of_payment,
  bank_account_id,
  bank_account_name,
  payment_date,
  created_at
FROM final_payments
WHERE payment_date >= CURRENT_DATE
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- STEP 5: Test the ledger function with Canara Bank
-- ============================================================================

SELECT '' as separator;
SELECT '=== TESTING LEDGER FUNCTION (Exact Match) ===' as section;

SELECT * FROM get_ledger_statement_with_patients(
  'Canara Bank [A/C120023677813)JARIPATHKA ]',  -- Exact name from UI
  CURRENT_DATE::TEXT,
  CURRENT_DATE::TEXT,
  NULL,  -- no MRN filter
  'ONLINE',  -- payment mode filter
  NULL  -- no hospital filter
);

-- ============================================================================
-- STEP 6: Test with partial match to find the right account name
-- ============================================================================

SELECT '' as separator;
SELECT '=== FINDING CANARA BANK ACCOUNT ===' as section;

-- This will help us see what the exact account name is
SELECT DISTINCT
  coa.account_name,
  COUNT(ve.id) as entry_count
FROM voucher_entries ve
JOIN chart_of_accounts coa ON ve.account_id = coa.id
JOIN vouchers v ON ve.voucher_id = v.id
WHERE coa.account_name ILIKE '%canara%'
  AND v.voucher_date >= CURRENT_DATE
GROUP BY coa.account_name;

-- ============================================================================
-- STEP 7: Show ALL entries from voucher_entries for debugging
-- ============================================================================

SELECT '' as separator;
SELECT '=== ALL VOUCHER ENTRIES (for debugging) ===' as section;

SELECT
  v.voucher_date,
  v.voucher_number,
  coa.account_name,
  ve.debit_amount,
  ve.credit_amount,
  v.narration
FROM voucher_entries ve
JOIN vouchers v ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE v.voucher_date >= CURRENT_DATE
ORDER BY v.created_at DESC, ve.entry_order;
