-- ============================================================================
-- DEBUG: Why Ledger Shows No Transactions
-- ============================================================================

-- ============================================================================
-- TEST 1: Call ledger function with NO filters (except account and date)
-- ============================================================================

SELECT '=== TEST 1: No payment mode filter ===' as test;

SELECT * FROM get_ledger_statement_with_patients(
  'Canara Bank [A/C120023677813)JARIPATHKA ]',
  '2025-11-08',
  '2025-11-08',
  NULL,  -- no MRN filter
  NULL,  -- ⭐ NO PAYMENT MODE FILTER
  NULL   -- no hospital filter
);

-- ============================================================================
-- TEST 2: Call with ONLINE filter
-- ============================================================================

SELECT '' as separator;
SELECT '=== TEST 2: With ONLINE payment mode filter ===' as test;

SELECT * FROM get_ledger_statement_with_patients(
  'Canara Bank [A/C120023677813)JARIPATHKA ]',
  '2025-11-08',
  '2025-11-08',
  NULL,  -- no MRN filter
  'ONLINE',  -- ⭐ WITH ONLINE FILTER
  NULL   -- no hospital filter
);

-- ============================================================================
-- TEST 3: Check what the actual payment mode value is in final_payments
-- ============================================================================

SELECT '' as separator;
SELECT '=== TEST 3: Actual payment mode in final_payments ===' as test;

SELECT
  mode_of_payment,
  UPPER(mode_of_payment) as upper_mode,
  UPPER(mode_of_payment) IN ('ONLINE', 'ONLINE TRANSFER', 'BANK TRANSFER', 'NET BANKING') as should_match
FROM final_payments
WHERE payment_date = '2025-11-08';

-- ============================================================================
-- TEST 4: Check if hospital filter is the issue
-- ============================================================================

SELECT '' as separator;
SELECT '=== TEST 4: Check patient hospital_name ===' as test;

SELECT
  p.id,
  p.name,
  p.hospital_name,
  v.voucher_number,
  v.voucher_date
FROM vouchers v
JOIN patients p ON v.patient_id = p.id
WHERE v.voucher_date = '2025-11-08';

-- ============================================================================
-- TEST 5: Manually check if the WHERE conditions match
-- ============================================================================

SELECT '' as separator;
SELECT '=== TEST 5: Manual check of all conditions ===' as test;

SELECT
  coa.account_name,
  coa.account_name = 'Canara Bank [A/C120023677813)JARIPATHKA ]' as account_matches,
  v.voucher_date,
  v.voucher_date >= '2025-11-08'::DATE as date_from_ok,
  v.voucher_date <= '2025-11-08'::DATE as date_to_ok,
  fp.mode_of_payment,
  UPPER(fp.mode_of_payment::TEXT) as upper_mode,
  UPPER(fp.mode_of_payment::TEXT) IN ('ONLINE', 'ONLINE TRANSFER', 'BANK TRANSFER', 'NET BANKING') as payment_mode_should_match,
  p.hospital_name,
  ve.debit_amount,
  ve.credit_amount
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
LEFT JOIN patients p ON v.patient_id = p.id
LEFT JOIN final_payments fp ON (
  fp.patient_id = v.patient_id
  AND fp.payment_date = v.voucher_date
)
WHERE v.voucher_date = '2025-11-08'
  AND coa.account_name ILIKE '%canara%';

-- ============================================================================
-- TEST 6: Simple query - just show ALL entries for Canara Bank on 2025-11-08
-- ============================================================================

SELECT '' as separator;
SELECT '=== TEST 6: All voucher entries for Canara Bank today ===' as test;

SELECT
  v.voucher_date,
  v.voucher_number,
  coa.account_name,
  ve.debit_amount,
  ve.credit_amount,
  v.narration,
  p.name as patient_name,
  fp.mode_of_payment
FROM voucher_entries ve
JOIN vouchers v ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
LEFT JOIN patients p ON v.patient_id = p.id
LEFT JOIN final_payments fp ON fp.patient_id = v.patient_id AND fp.payment_date = v.voucher_date
WHERE v.voucher_date = '2025-11-08'
  AND coa.account_name = 'Canara Bank [A/C120023677813)JARIPATHKA ]';
