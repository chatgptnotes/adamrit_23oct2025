-- ============================================================================
-- DIAGNOSTIC SCRIPT: Missing ONLINE Transactions in SARASWAT BANK Ledger
-- Date: 2025-11-03
-- Purpose: Identify why ONLINE transactions are not showing in ledger statement
-- ============================================================================

-- ============================================================================
-- CHECK 1: Do bank columns exist in advance_payment table?
-- ============================================================================
SELECT
    '=== CHECK 1: Bank Columns in advance_payment table ===' as check_name;

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'advance_payment'
  AND column_name IN ('bank_account_id', 'bank_account_name')
ORDER BY column_name;

-- Expected: 2 rows (bank_account_id, bank_account_name)
-- If NO rows: Need to run 20251031120000_add_bank_columns_to_payments.sql

-- ============================================================================
-- CHECK 2: Show ONLINE payments for 31/10 and 01/11
-- ============================================================================
SELECT
    '=== CHECK 2: ONLINE Payments on 31/10 and 01/11 ===' as check_name;

SELECT
    id,
    patient_id,
    payment_date,
    advance_amount,
    payment_mode,
    bank_account_id,
    bank_account_name,
    remarks,
    created_at
FROM advance_payment
WHERE payment_date BETWEEN '2025-10-31' AND '2025-11-01'
  AND payment_mode = 'ONLINE'
ORDER BY payment_date, created_at;

-- Expected: At least 2 rows (Rs 50 on 31/10, Rs 10 on 01/11)
-- Check if bank_account_name = 'SARASWAT BANK'
-- If bank_account_name is NULL: Need to update these records

-- ============================================================================
-- CHECK 3: Do vouchers exist for these ONLINE payments?
-- ============================================================================
SELECT
    '=== CHECK 3: Vouchers for ONLINE Payments ===' as check_name;

SELECT
    v.id as voucher_id,
    v.voucher_number,
    v.voucher_date,
    v.narration,
    v.patient_id,
    v.status,
    ap.advance_amount,
    ap.payment_mode,
    ap.bank_account_name
FROM advance_payment ap
LEFT JOIN vouchers v ON (
    v.patient_id = ap.patient_id
    AND v.voucher_date = ap.payment_date::DATE
)
WHERE ap.payment_date BETWEEN '2025-10-31' AND '2025-11-01'
  AND ap.payment_mode = 'ONLINE'
ORDER BY ap.payment_date;

-- Expected: Vouchers should have IDs (not NULL)
-- If voucher_id is NULL: Vouchers were never created, need to run backfill

-- ============================================================================
-- CHECK 4: Show voucher entries with bank accounts
-- ============================================================================
SELECT
    '=== CHECK 4: Voucher Entries with Bank Accounts ===' as check_name;

SELECT
    v.voucher_number,
    v.voucher_date,
    v.narration,
    ve.debit_amount,
    ve.credit_amount,
    coa.account_name as bank_account,
    coa.account_code
FROM vouchers v
JOIN voucher_entries ve ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE v.voucher_date BETWEEN '2025-10-31' AND '2025-11-01'
  AND v.patient_id IN (
      SELECT patient_id
      FROM advance_payment
      WHERE payment_date BETWEEN '2025-10-31' AND '2025-11-01'
        AND payment_mode = 'ONLINE'
  )
ORDER BY v.voucher_date, v.voucher_number, ve.debit_amount DESC;

-- Expected: Should show entries with SARASWAT BANK debited
-- If shows "Cash in Hand": Bank routing is wrong
-- If NO rows: No vouchers created at all

-- ============================================================================
-- CHECK 5: What does ledger statement function return?
-- ============================================================================
SELECT
    '=== CHECK 5: Ledger Statement Function Result ===' as check_name;

SELECT
    voucher_date,
    voucher_number,
    patient_name,
    mrn_number,
    payment_type,
    payment_mode,
    debit_amount,
    credit_amount,
    bank_account
FROM get_ledger_statement_with_patients(
    'SARASWAT BANK',
    '2025-10-31',
    '2025-11-01',
    NULL,
    'ONLINE'
)
ORDER BY voucher_date;

-- Expected: Should return 2+ rows with ONLINE payments
-- If NO rows: Issue is in voucher creation or routing

-- ============================================================================
-- CHECK 6: Check trigger function version
-- ============================================================================
SELECT
    '=== CHECK 6: Trigger Function Status ===' as check_name;

SELECT
    CASE
        WHEN prosrc LIKE '%ONLINE%' AND prosrc LIKE '%Bank Transfer%'
        THEN '✓ FIXED - Trigger handles ONLINE payments'
        ELSE '✗ OLD VERSION - Trigger only handles CASH payments'
    END as trigger_status,
    CASE
        WHEN prosrc LIKE '%bank_account_id%'
        THEN '✓ Uses bank_account_id'
        ELSE '✗ Does not use bank_account_id'
    END as uses_bank_id,
    CASE
        WHEN prosrc LIKE '%bank_account_name%'
        THEN '✓ Uses bank_account_name'
        ELSE '✗ Does not use bank_account_name'
    END as uses_bank_name
FROM pg_proc
WHERE proname = 'create_receipt_voucher_for_payment';

-- Expected: All 3 checks should show ✓
-- If ✗: Need to run 20251101000000_fix_online_payment_voucher_routing.sql

-- ============================================================================
-- CHECK 7: Count ALL ONLINE payments vs Vouchers created
-- ============================================================================
SELECT
    '=== CHECK 7: ONLINE Payments vs Vouchers Summary ===' as check_name;

SELECT
    COUNT(DISTINCT ap.id) as total_online_payments,
    COUNT(DISTINCT v.id) as vouchers_created,
    COUNT(DISTINCT ap.id) - COUNT(DISTINCT v.id) as missing_vouchers,
    SUM(ap.advance_amount) as total_amount,
    STRING_AGG(DISTINCT ap.bank_account_name, ', ') as bank_accounts_used
FROM advance_payment ap
LEFT JOIN vouchers v ON (
    v.patient_id = ap.patient_id
    AND v.voucher_date = ap.payment_date::DATE
    AND v.narration LIKE '%ONLINE%'
)
WHERE ap.payment_date BETWEEN '2025-10-31' AND '2025-11-01'
  AND ap.payment_mode = 'ONLINE';

-- Expected: missing_vouchers should be 0
-- If missing_vouchers > 0: Need to run backfill script

-- ============================================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================================
SELECT
    '=== DIAGNOSTIC COMPLETE ===' as summary;

SELECT
    'Review the checks above to identify the issue:' as instructions,
    '1. If CHECK 1 shows no columns: Apply add_bank_columns migration' as step1,
    '2. If CHECK 2 shows NULL bank_account_name: Update payment records' as step2,
    '3. If CHECK 3 shows NULL voucher_id: Run backfill script' as step3,
    '4. If CHECK 6 shows OLD VERSION: Apply trigger fix migration' as step4,
    '5. If CHECK 7 shows missing_vouchers > 0: Run backfill script' as step5;
