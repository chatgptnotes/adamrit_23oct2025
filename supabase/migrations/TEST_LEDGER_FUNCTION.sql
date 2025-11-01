-- ============================================================================
-- TEST: Ledger Statement Function
-- Run this to test if the function works correctly
-- ============================================================================

-- ============================================================================
-- Test 1: Call function with TEXT dates (how frontend calls it)
-- ============================================================================
SELECT * FROM get_ledger_statement_with_patients(
  'SARASWAT BANK',        -- p_account_name
  '2025-10-27',           -- p_from_date (TEXT, not DATE)
  '2025-11-01',           -- p_to_date (TEXT, not DATE)
  NULL                    -- p_mrn_filter
);

-- If this returns results, the function is working! ✅
-- If this gives an error, there's still a mismatch ❌

-- ============================================================================
-- Test 2: Check if any data exists for SARASWAT BANK
-- ============================================================================
SELECT COUNT(*) as total_vouchers
FROM vouchers v
INNER JOIN voucher_entries ve ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE coa.account_name = 'SARASWAT BANK'
  AND v.status = 'AUTHORISED';

-- If count > 0, there are vouchers for SARASWAT BANK
-- If count = 0, no vouchers exist yet (need to run backfill)

-- ============================================================================
-- Test 3: Check function signature
-- ============================================================================
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as parameters,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_ledger_statement_with_patients';

-- This shows the exact function signature in database
-- Parameters should show TEXT for dates, not DATE

-- ============================================================================
-- Expected Results
-- ============================================================================
/*
Test 1: Should return rows with voucher data OR empty table (if no vouchers)
        Should NOT give "structure does not match" error

Test 2: If 0 → Need to run backfill script
        If > 0 → Vouchers exist, check Test 1 results

Test 3: Parameters should show:
        p_account_name text,
        p_from_date text,    ← TEXT not DATE
        p_to_date text,      ← TEXT not DATE
        p_mrn_filter text DEFAULT NULL::text
*/
