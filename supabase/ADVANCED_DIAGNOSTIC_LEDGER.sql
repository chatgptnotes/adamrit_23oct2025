-- ============================================================================
-- ADVANCED DIAGNOSTIC: Deep Investigation for Missing Ledger Transactions
-- Date: 2025-11-03
-- Purpose: Find exact reason why transactions exist but don't show in ledger
-- ============================================================================

-- ============================================================================
-- TEST 1: Check exact voucher_entries and which bank account was used
-- ============================================================================
SELECT '=== TEST 1: Voucher Entries with Bank Accounts ===' as test_name;

SELECT
    v.voucher_date,
    v.voucher_number,
    v.narration,
    v.patient_id,
    ve.debit_amount,
    ve.credit_amount,
    coa.account_name as bank_account_used,
    coa.account_code,
    coa.is_active
FROM vouchers v
JOIN voucher_entries ve ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE v.voucher_date BETWEEN '2025-10-30' AND '2025-11-03'
  AND v.narration ILIKE '%online%'
ORDER BY v.voucher_date, ve.debit_amount DESC;

-- LOOK FOR: Is bank_account_used = 'SARASWAT BANK' or something else?
-- If it's 'Cash in Hand' -> Vouchers routed to wrong account

-- ============================================================================
-- TEST 2: Check payment_mode values (case sensitivity)
-- ============================================================================
SELECT '=== TEST 2: Payment Mode Values (Exact Case) ===' as test_name;

SELECT
    payment_mode,
    UPPER(payment_mode) as payment_mode_upper,
    COUNT(*) as count,
    MIN(payment_date) as earliest_date,
    MAX(payment_date) as latest_date
FROM advance_payment
WHERE payment_date BETWEEN '2025-10-30' AND '2025-11-03'
GROUP BY payment_mode
ORDER BY payment_mode;

-- LOOK FOR: Is it 'ONLINE' or 'Online' or 'online'?
-- Case sensitivity might be causing filter to fail

-- ============================================================================
-- TEST 3: Show EXACT payment records with ALL details
-- ============================================================================
SELECT '=== TEST 3: Exact Payment Records ===' as test_name;

SELECT
    ap.id as payment_id,
    ap.payment_date,
    ap.advance_amount,
    ap.payment_mode,
    ap.bank_account_id,
    ap.bank_account_name,
    ap.patient_id,
    p.name as patient_name,
    p.patients_id as mrn
FROM advance_payment ap
JOIN patients p ON p.id = ap.patient_id
WHERE ap.payment_date BETWEEN '2025-10-30' AND '2025-11-03'
  AND ap.payment_mode ILIKE '%online%'
ORDER BY ap.payment_date;

-- LOOK FOR: Exact dates, amounts, bank_account_name

-- ============================================================================
-- TEST 4: Match payments with vouchers (JOIN test)
-- ============================================================================
SELECT '=== TEST 4: Payment to Voucher Matching ===' as test_name;

SELECT
    ap.payment_date,
    ap.advance_amount,
    ap.payment_mode,
    ap.bank_account_name as payment_bank,
    v.voucher_date,
    v.voucher_number,
    v.total_amount as voucher_amount,
    ve.debit_amount,
    coa.account_name as voucher_bank,
    CASE
        WHEN v.id IS NULL THEN '❌ NO VOUCHER'
        WHEN coa.account_name != ap.bank_account_name THEN '⚠️ BANK MISMATCH'
        ELSE '✓ MATCHED'
    END as status
FROM advance_payment ap
LEFT JOIN vouchers v ON (
    v.patient_id = ap.patient_id
    AND v.voucher_date = ap.payment_date::DATE
)
LEFT JOIN voucher_entries ve ON (
    ve.voucher_id = v.id
    AND ve.debit_amount > 0
)
LEFT JOIN chart_of_accounts coa ON coa.id = ve.account_id
WHERE ap.payment_date BETWEEN '2025-10-30' AND '2025-11-03'
  AND ap.payment_mode ILIKE '%online%'
ORDER BY ap.payment_date;

-- LOOK FOR: Status column - shows exact problem

-- ============================================================================
-- TEST 5: Test ledger function WITHOUT payment_mode filter
-- ============================================================================
SELECT '=== TEST 5: Ledger WITHOUT Payment Mode Filter ===' as test_name;

SELECT
    voucher_date,
    voucher_number,
    patient_name,
    mrn_number,
    payment_mode,
    debit_amount,
    bank_account
FROM get_ledger_statement_with_patients(
    'SARASWAT BANK',
    '2025-10-30',
    '2025-11-03',
    NULL,
    NULL  -- No payment mode filter
)
ORDER BY voucher_date;

-- LOOK FOR: Do transactions appear without filter?
-- If YES -> Problem is with payment_mode filter logic

-- ============================================================================
-- TEST 6: Test with different payment_mode case variations
-- ============================================================================
SELECT '=== TEST 6A: Ledger with ONLINE (uppercase) ===' as test_name;

SELECT
    voucher_date,
    payment_mode,
    debit_amount,
    bank_account
FROM get_ledger_statement_with_patients(
    'SARASWAT BANK',
    '2025-10-30',
    '2025-11-03',
    NULL,
    'ONLINE'
)
ORDER BY voucher_date;

SELECT '=== TEST 6B: Ledger with Online (titlecase) ===' as test_name;

SELECT
    voucher_date,
    payment_mode,
    debit_amount,
    bank_account
FROM get_ledger_statement_with_patients(
    'SARASWAT BANK',
    '2025-10-30',
    '2025-11-03',
    NULL,
    'Online'
)
ORDER BY voucher_date;

SELECT '=== TEST 6C: Ledger with online (lowercase) ===' as test_name;

SELECT
    voucher_date,
    payment_mode,
    debit_amount,
    bank_account
FROM get_ledger_statement_with_patients(
    'SARASWAT BANK',
    '2025-10-30',
    '2025-11-03',
    NULL,
    'online'
)
ORDER BY voucher_date;

-- LOOK FOR: Which case returns results?

-- ============================================================================
-- TEST 7: Check what ledger function is actually querying
-- ============================================================================
SELECT '=== TEST 7: Raw Ledger Query Simulation ===' as test_name;

SELECT
    v.voucher_date,
    v.voucher_number::TEXT,
    vt.voucher_type_name::TEXT as voucher_type,
    COALESCE(p.name::TEXT, 'Unknown') as patient_name,
    COALESCE(p.patients_id::TEXT, '') as mrn_number,
    ve.debit_amount,
    ve.credit_amount,
    COALESCE(ap.payment_mode::TEXT, fp.mode_of_payment::TEXT, '') as payment_mode,
    COALESCE(ap.bank_account_name::TEXT, '') as payment_bank_name,
    coa.account_name::TEXT as voucher_bank_account,
    -- Test the filter condition
    CASE
        WHEN UPPER(COALESCE(ap.payment_mode, fp.mode_of_payment)) = UPPER('ONLINE')
        THEN '✓ MATCHES FILTER'
        ELSE '❌ DOES NOT MATCH: ' || COALESCE(ap.payment_mode, fp.mode_of_payment, 'NULL')
    END as filter_match
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
LEFT JOIN voucher_types vt ON v.voucher_type_id = vt.id
LEFT JOIN patients p ON v.patient_id = p.id
LEFT JOIN visits vis ON vis.patient_id = v.patient_id
LEFT JOIN advance_payment ap ON (
    ap.patient_id = v.patient_id
    AND DATE(ap.payment_date) = v.voucher_date
    AND ap.advance_amount = GREATEST(ve.debit_amount, ve.credit_amount)
)
LEFT JOIN final_payments fp ON (
    fp.visit_id = vis.visit_id
    AND DATE(fp.created_at) = v.voucher_date
    AND fp.amount = GREATEST(ve.debit_amount, ve.credit_amount)
)
WHERE coa.account_name = 'SARASWAT BANK'
  AND v.voucher_date BETWEEN '2025-10-30'::DATE AND '2025-11-03'::DATE
  AND v.status = 'AUTHORISED'
ORDER BY v.voucher_date DESC;

-- LOOK FOR: filter_match column - shows if JOIN is working

-- ============================================================================
-- TEST 8: Check for amount mismatch in JOIN
-- ============================================================================
SELECT '=== TEST 8: Amount Matching Issue ===' as test_name;

SELECT
    ap.payment_date,
    ap.advance_amount as payment_amount,
    v.voucher_date,
    v.total_amount as voucher_total,
    ve.debit_amount as voucher_debit,
    ve.credit_amount as voucher_credit,
    ap.advance_amount = v.total_amount as amounts_match,
    ap.advance_amount = ve.debit_amount as debit_matches,
    GREATEST(ve.debit_amount, ve.credit_amount) as greatest_amount,
    ap.advance_amount = GREATEST(ve.debit_amount, ve.credit_amount) as greatest_matches
FROM advance_payment ap
JOIN vouchers v ON v.patient_id = ap.patient_id
    AND v.voucher_date = ap.payment_date::DATE
JOIN voucher_entries ve ON ve.voucher_id = v.id
WHERE ap.payment_date BETWEEN '2025-10-30' AND '2025-11-03'
  AND ap.payment_mode ILIKE '%online%'
ORDER BY ap.payment_date;

-- LOOK FOR: Which amount comparison is FALSE?

-- ============================================================================
-- DIAGNOSTIC SUMMARY AND RECOMMENDATIONS
-- ============================================================================
SELECT '=== DIAGNOSTIC COMPLETE ===' as summary;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'REVIEW RESULTS ABOVE:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST 1: Check which bank account vouchers used';
    RAISE NOTICE '  - If NOT SARASWAT BANK -> Vouchers routed wrong';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST 2: Check payment_mode case';
    RAISE NOTICE '  - Note exact case (ONLINE vs Online vs online)';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST 4: Check matching status';
    RAISE NOTICE '  - Shows if payment linked to voucher';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST 5: Ledger without filter';
    RAISE NOTICE '  - If works -> Problem is filter logic';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST 6: Case variations';
    RAISE NOTICE '  - Shows which case works';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST 7: Filter match column';
    RAISE NOTICE '  - Shows if JOIN and filter working';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST 8: Amount matching';
    RAISE NOTICE '  - Shows if JOIN condition failing on amount';
    RAISE NOTICE '';
END $$;
