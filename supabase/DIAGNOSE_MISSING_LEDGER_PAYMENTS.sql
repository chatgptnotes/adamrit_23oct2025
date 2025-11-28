-- ============================================================================
-- Diagnose Missing Ledger Payments for STATE BANK OF INDIA (DRM)
-- Purpose: Find why payments showing in Payment History don't appear in Ledger
-- Date: 2025-11-03
-- Patient: ABC (UHAY25J10001)
-- Missing Payments: 2 x ₹10 on 03/11/2025
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if payments exist in advance_payment table
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: Checking advance_payment table for ABC payments...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  id,
  patient_name,
  advance_amount,
  payment_date,
  payment_mode,
  bank_account_id,
  bank_account_name,
  created_at,
  'Found in advance_payment ✓' as status
FROM advance_payment
WHERE patient_name = 'ABC'
  AND DATE(payment_date) = '2025-11-03'
  AND advance_amount = 10
ORDER BY created_at;

-- ============================================================================
-- STEP 2: Check if vouchers were created for these payments
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2: Checking if vouchers were created...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  v.id as voucher_id,
  v.voucher_number,
  v.voucher_date,
  v.narration,
  vt.voucher_type_name,
  p.name as patient_name,
  'Voucher exists ✓' as status
FROM vouchers v
JOIN voucher_types vt ON v.voucher_type_id = vt.id
LEFT JOIN patients p ON v.patient_id = p.id
WHERE p.name = 'ABC'
  AND v.voucher_date = '2025-11-03'
ORDER BY v.created_at;

-- ============================================================================
-- STEP 3: Check voucher_entries - which accounts were debited/credited?
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: Checking voucher entries and account mapping...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  v.voucher_number,
  v.voucher_date,
  coa.account_code,
  coa.account_name,
  coa.account_group,
  ve.debit_amount,
  ve.credit_amount,
  CASE
    WHEN coa.account_name = 'STATE BANK OF INDIA (DRM)' THEN '✓ CORRECT BANK!'
    WHEN coa.account_name = 'SARASWAT BANK' THEN '⚠️ WRONG BANK'
    WHEN coa.account_name LIKE '%BANK%' THEN '⚠️ OTHER BANK'
    ELSE 'Other Account'
  END as account_status
FROM voucher_entries ve
JOIN chart_of_accounts coa ON ve.account_id = coa.id
JOIN vouchers v ON ve.voucher_id = v.id
LEFT JOIN patients p ON v.patient_id = p.id
WHERE p.name = 'ABC'
  AND v.voucher_date = '2025-11-03'
ORDER BY v.voucher_number, ve.debit_amount DESC;

-- ============================================================================
-- STEP 4: Test the ledger query directly
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 4: Testing ledger query for STATE BANK OF INDIA (DRM)...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT * FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-01',
  '2025-11-03',
  NULL,  -- mrn_filter
  NULL   -- payment_mode_filter
)
WHERE patient_name = 'ABC'
ORDER BY voucher_date;

-- ============================================================================
-- STEP 5: Check if JOIN condition is failing
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 5: Checking why JOIN might be failing...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- This replicates the JOIN logic from the ledger function
SELECT
  v.voucher_number,
  v.voucher_date,
  p.name as patient_name,
  ve.debit_amount,
  ve.credit_amount,
  ap.id as advance_payment_id,
  ap.advance_amount,
  ap.payment_mode,
  CASE
    WHEN ap.id IS NOT NULL THEN '✓ JOIN Successful'
    ELSE '✗ JOIN FAILED - Payment mode will be blank!'
  END as join_status,
  CASE
    WHEN ap.id IS NULL THEN 'Reason: Amount mismatch or duplicate visits'
    ELSE ''
  END as failure_reason
FROM voucher_entries ve
JOIN vouchers v ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
LEFT JOIN patients p ON v.patient_id = p.id
LEFT JOIN advance_payment ap ON (
    ap.patient_id = v.patient_id
    AND DATE(ap.payment_date) = v.voucher_date
    AND ap.advance_amount = GREATEST(ve.debit_amount, ve.credit_amount)
)
WHERE coa.account_name = 'STATE BANK OF INDIA (DRM)'
  AND v.voucher_date = '2025-11-03'
  AND p.name = 'ABC'
ORDER BY v.voucher_number;

-- ============================================================================
-- STEP 6: Show all accounts with activity on 03/11/2025 for ABC
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 6: All accounts touched by ABC payments on 03/11/2025...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT DISTINCT
  coa.account_code,
  coa.account_name,
  coa.account_group,
  COUNT(ve.id) as entry_count,
  SUM(ve.debit_amount) as total_debit,
  SUM(ve.credit_amount) as total_credit
FROM voucher_entries ve
JOIN chart_of_accounts coa ON ve.account_id = coa.id
JOIN vouchers v ON ve.voucher_id = v.id
LEFT JOIN patients p ON v.patient_id = p.id
WHERE p.name = 'ABC'
  AND v.voucher_date = '2025-11-03'
GROUP BY coa.account_code, coa.account_name, coa.account_group
ORDER BY coa.account_group, coa.account_name;

-- ============================================================================
-- Summary and Diagnosis
-- ============================================================================
DO $$
DECLARE
  payment_count INTEGER;
  voucher_count INTEGER;
  sbi_entry_count INTEGER;
  join_success_count INTEGER;
BEGIN
  -- Count payments
  SELECT COUNT(*) INTO payment_count
  FROM advance_payment
  WHERE patient_name = 'ABC'
    AND DATE(payment_date) = '2025-11-03'
    AND advance_amount = 10;

  -- Count vouchers
  SELECT COUNT(*) INTO voucher_count
  FROM vouchers v
  LEFT JOIN patients p ON v.patient_id = p.id
  WHERE p.name = 'ABC'
    AND v.voucher_date = '2025-11-03';

  -- Count SBI entries
  SELECT COUNT(*) INTO sbi_entry_count
  FROM voucher_entries ve
  JOIN chart_of_accounts coa ON ve.account_id = coa.id
  JOIN vouchers v ON ve.voucher_id = v.id
  LEFT JOIN patients p ON v.patient_id = p.id
  WHERE coa.account_name = 'STATE BANK OF INDIA (DRM)'
    AND v.voucher_date = '2025-11-03'
    AND p.name = 'ABC';

  -- Count successful JOINs
  SELECT COUNT(*) INTO join_success_count
  FROM voucher_entries ve
  JOIN vouchers v ON ve.voucher_id = v.id
  JOIN chart_of_accounts coa ON ve.account_id = coa.id
  LEFT JOIN patients p ON v.patient_id = p.id
  LEFT JOIN advance_payment ap ON (
      ap.patient_id = v.patient_id
      AND DATE(ap.payment_date) = v.voucher_date
      AND ap.advance_amount = GREATEST(ve.debit_amount, ve.credit_amount)
  )
  WHERE coa.account_name = 'STATE BANK OF INDIA (DRM)'
    AND v.voucher_date = '2025-11-03'
    AND p.name = 'ABC'
    AND ap.id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSTIC SUMMARY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Payments in advance_payment table: %', payment_count;
  RAISE NOTICE 'Vouchers created: %', voucher_count;
  RAISE NOTICE 'Entries in STATE BANK OF INDIA (DRM): %', sbi_entry_count;
  RAISE NOTICE 'Successful JOINs to advance_payment: %', join_success_count;
  RAISE NOTICE '';

  IF payment_count = 0 THEN
    RAISE NOTICE '❌ ISSUE: No payments found in advance_payment table!';
  ELSIF voucher_count = 0 THEN
    RAISE NOTICE '❌ ISSUE: Payments exist but no vouchers created!';
    RAISE NOTICE '   → Check if trigger is working';
  ELSIF sbi_entry_count = 0 THEN
    RAISE NOTICE '❌ ISSUE: Vouchers exist but not posted to STATE BANK!';
    RAISE NOTICE '   → Check account routing logic in trigger';
  ELSIF join_success_count = 0 THEN
    RAISE NOTICE '⚠️  ISSUE: Vouchers in STATE BANK but JOIN failing!';
    RAISE NOTICE '   → Ledger query cannot link vouchers to payments';
    RAISE NOTICE '   → This is why payment_mode shows blank in ledger';
    RAISE NOTICE '   → FIX NEEDED: Update ledger function JOIN condition';
  ELSE
    RAISE NOTICE '✅ Everything looks correct!';
    RAISE NOTICE '   → Check ledger query filters or frontend display';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
