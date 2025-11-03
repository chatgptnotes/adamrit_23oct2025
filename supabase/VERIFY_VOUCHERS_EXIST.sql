-- ============================================================================
-- VERIFY IF VOUCHERS WERE CREATED
-- Purpose: Direct check to see if vouchers exist for SARASWAT BANK payments
-- ============================================================================

-- ============================================================================
-- CHECK 1: Do ANY vouchers exist for ONLINE payments to SARASWAT BANK?
-- ============================================================================
SELECT '=== CHECK 1: Vouchers for SARASWAT BANK ===' as check_name;

SELECT
    v.voucher_number,
    v.voucher_date,
    v.narration,
    v.total_amount,
    v.status,
    p.name as patient_name,
    p.patients_id as mrn
FROM vouchers v
LEFT JOIN patients p ON p.id = v.patient_id
WHERE v.narration ILIKE '%SARASWAT%'
   OR v.narration ILIKE '%ONLINE%'
ORDER BY v.voucher_date DESC
LIMIT 20;

-- Expected: Should show vouchers if created
-- If 0 rows: Vouchers were NOT created

-- ============================================================================
-- CHECK 2: Voucher entries with SARASWAT BANK account
-- ============================================================================
SELECT '=== CHECK 2: Voucher Entries with SARASWAT BANK ===' as check_name;

SELECT
    v.voucher_number,
    v.voucher_date,
    ve.debit_amount,
    ve.credit_amount,
    coa.account_name,
    coa.account_code
FROM voucher_entries ve
JOIN vouchers v ON v.id = ve.voucher_id
JOIN chart_of_accounts coa ON coa.id = ve.account_id
WHERE coa.account_name = 'SARASWAT BANK'
ORDER BY v.voucher_date DESC
LIMIT 20;

-- Expected: Should show debit entries for SARASWAT BANK
-- If 0 rows: No voucher entries exist for SARASWAT BANK

-- ============================================================================
-- CHECK 3: What the ledger function returns (direct test)
-- ============================================================================
SELECT '=== CHECK 3: Ledger Function Test (WITHOUT filter) ===' as check_name;

SELECT
    voucher_date,
    voucher_number,
    patient_name,
    mrn_number,
    payment_mode,
    debit_amount,
    credit_amount,
    bank_account
FROM get_ledger_statement_with_patients(
    'SARASWAT BANK',
    '2025-10-01',
    '2025-11-30',
    NULL,
    NULL  -- No payment mode filter
)
ORDER BY voucher_date DESC;

-- Expected: Should return rows if vouchers exist
-- If 0 rows: Function not finding vouchers

-- ============================================================================
-- CHECK 4: Ledger function WITH ONLINE filter
-- ============================================================================
SELECT '=== CHECK 4: Ledger Function Test (WITH ONLINE filter) ===' as check_name;

SELECT
    voucher_date,
    voucher_number,
    patient_name,
    payment_mode,
    debit_amount,
    bank_account
FROM get_ledger_statement_with_patients(
    'SARASWAT BANK',
    '2025-10-01',
    '2025-11-30',
    NULL,
    'ONLINE'  -- With ONLINE filter
)
ORDER BY voucher_date DESC;

-- Expected: Should return ONLINE transactions only
-- If 0 rows: Filter is excluding everything

-- ============================================================================
-- CHECK 5: Advance payments vs Vouchers (matching check)
-- ============================================================================
SELECT '=== CHECK 5: Payment to Voucher Matching ===' as check_name;

SELECT
    ap.payment_date,
    ap.advance_amount,
    ap.payment_mode,
    ap.bank_account_name,
    v.voucher_number,
    v.voucher_date,
    v.total_amount,
    CASE
        WHEN v.id IS NULL THEN '❌ NO VOUCHER CREATED'
        WHEN v.total_amount != ap.advance_amount THEN '⚠️ AMOUNT MISMATCH'
        ELSE '✓ MATCHED'
    END as status
FROM advance_payment ap
LEFT JOIN vouchers v ON (
    v.patient_id = ap.patient_id
    AND v.voucher_date = ap.payment_date::DATE
    AND ABS(v.total_amount - ap.advance_amount) < 0.01
)
WHERE ap.payment_mode = 'ONLINE'
  AND ap.bank_account_name = 'SARASWAT BANK'
ORDER BY ap.payment_date DESC;

-- Expected: Should show ✓ MATCHED
-- If ❌ NO VOUCHER: Vouchers were not created
-- If ⚠️ AMOUNT MISMATCH: Vouchers exist but amounts don't match

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT '=== DIAGNOSTIC SUMMARY ===' as summary;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CHECK THE RESULTS ABOVE:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'CHECK 1: Shows if any vouchers exist for SARASWAT BANK';
    RAISE NOTICE 'CHECK 2: Shows voucher entries using SARASWAT BANK account';
    RAISE NOTICE 'CHECK 3: Tests ledger function WITHOUT filter';
    RAISE NOTICE 'CHECK 4: Tests ledger function WITH ONLINE filter';
    RAISE NOTICE 'CHECK 5: Shows which payments have vouchers';
    RAISE NOTICE '';
    RAISE NOTICE 'If all checks return 0 rows: Vouchers were NOT created';
    RAISE NOTICE 'If CHECK 1 & 2 have rows but CHECK 3 & 4 dont: Function issue';
    RAISE NOTICE 'If CHECK 3 has rows but CHECK 4 doesnt: Filter issue';
    RAISE NOTICE '';
END $$;
