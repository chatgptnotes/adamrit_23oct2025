-- ============================================================================
-- DIAGNOSTIC QUERY: poonam's Missing Ledger Entries
-- Date: 2025-11-06
-- Purpose: Identify which advance payments are missing bank_account_id
-- ============================================================================

-- Query 1: Check all poonam's advance payments on 06/11/2025
-- Expected: 5 rows (2 with bank_account_id, 3 with NULL)
SELECT
  ap.id,
  ap.payment_date,
  ap.advance_amount,
  ap.payment_mode,
  ap.bank_account_id,
  ap.bank_account_name,
  ap.remarks,
  ap.created_at,
  CASE
    WHEN ap.bank_account_id IS NULL THEN '❌ NULL - No voucher created'
    ELSE '✅ Has bank_account_id - Voucher should exist'
  END as voucher_status,
  -- Check if voucher exists
  (SELECT COUNT(*)
   FROM vouchers v
   WHERE v.patient_id = ap.patient_id
   AND v.voucher_date = ap.payment_date::DATE
   AND v.total_amount = ap.advance_amount
  ) as voucher_count
FROM advance_payment ap
INNER JOIN patients p ON ap.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
  AND ap.payment_date::DATE = '2025-11-06'
  AND ap.status = 'ACTIVE'
ORDER BY ap.created_at;

-- ============================================================================

-- Query 2: Check vouchers that WERE created for poonam
-- Expected: 2 rows (matching the 2 entries in ledger statement)
SELECT
  v.voucher_date,
  v.voucher_number,
  v.total_amount,
  v.narration,
  vt.voucher_type_name,
  ve.debit_amount,
  ve.credit_amount,
  coa.account_name as bank_account,
  coa.account_code
FROM vouchers v
INNER JOIN voucher_types vt ON v.voucher_type_id = vt.id
INNER JOIN voucher_entries ve ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
INNER JOIN patients p ON v.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
  AND v.voucher_date = '2025-11-06'
  AND coa.account_group = 'BANK'
ORDER BY v.created_at;

-- ============================================================================

-- Query 3: Get bank account IDs for reference
-- Shows the UUIDs needed to fix the missing bank_account_id values
SELECT
  id as bank_account_uuid,
  account_code,
  account_name,
  account_group
FROM chart_of_accounts
WHERE account_name IN ('SARASWAT BANK', 'STATE BANK OF INDIA (DRM)', 'Cash in Hand')
  OR account_code IN ('1121', '1122', '1110')
ORDER BY account_code;

-- ============================================================================

-- EXPECTED RESULTS:
-- Query 1: Should show 5 payments
--   - 2 payments with bank_account_id (voucher_count = 1)
--   - 3 payments with NULL bank_account_id (voucher_count = 0)
--
-- Query 2: Should show 2 vouchers
--   - These correspond to the 2 entries visible in SARASWAT BANK ledger
--
-- Query 3: Will provide the UUID values needed for the fix migration
-- ============================================================================
