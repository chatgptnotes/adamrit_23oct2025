-- ============================================================================
-- DIAGNOSTIC SCRIPT - Check Database State
-- Run this to see what's in your database and what's missing
-- ============================================================================

-- ============================================================================
-- CHECK 1: Does get_ledger_statement_with_patients function exist?
-- ============================================================================
DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_ledger_statement_with_patients'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✓ SUCCESS: Function get_ledger_statement_with_patients EXISTS';
  ELSE
    RAISE WARNING '✗ MISSING: Function get_ledger_statement_with_patients NOT FOUND';
    RAISE NOTICE 'Action needed: Run the main migration file';
  END IF;
END $$;

-- ============================================================================
-- CHECK 2: Does generate_voucher_number function exist?
-- ============================================================================
DO $$
DECLARE
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'generate_voucher_number'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✓ SUCCESS: Function generate_voucher_number EXISTS';
  ELSE
    RAISE WARNING '✗ MISSING: Function generate_voucher_number NOT FOUND';
    RAISE NOTICE 'Action needed: Run the main migration file';
  END IF;
END $$;

-- ============================================================================
-- CHECK 3: Voucher Types
-- ============================================================================
DO $$
DECLARE
  v_rec_exists BOOLEAN;
  v_rv_exists BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checking Voucher Types...';
  RAISE NOTICE '========================================';

  SELECT EXISTS (
    SELECT 1 FROM voucher_types WHERE voucher_type_code = 'REC'
  ) INTO v_rec_exists;

  SELECT EXISTS (
    SELECT 1 FROM voucher_types WHERE voucher_type_code = 'RV'
  ) INTO v_rv_exists;

  IF v_rec_exists THEN
    RAISE NOTICE '✓ Voucher type REC exists';
  ELSE
    RAISE WARNING '✗ Voucher type REC missing';
  END IF;

  IF v_rv_exists THEN
    RAISE NOTICE '✓ Voucher type RV exists';
  ELSE
    RAISE NOTICE 'ℹ Voucher type RV not found (this is OK if REC exists)';
  END IF;

  IF NOT v_rec_exists AND NOT v_rv_exists THEN
    RAISE WARNING '✗ PROBLEM: No receipt voucher type found!';
    RAISE NOTICE 'Action needed: Run the main migration file';
  END IF;
END $$;

-- Display all voucher types
SELECT
  voucher_type_code,
  voucher_type_name,
  voucher_category,
  current_number,
  is_active
FROM voucher_types
WHERE voucher_category = 'RECEIPT'
ORDER BY voucher_type_code;

-- ============================================================================
-- CHECK 4: INCOME Account
-- ============================================================================
DO $$
DECLARE
  v_income_exists BOOLEAN;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checking INCOME Account...';
  RAISE NOTICE '========================================';

  SELECT EXISTS (
    SELECT 1
    FROM chart_of_accounts
    WHERE account_code = '4000' AND account_name = 'INCOME'
  ) INTO v_income_exists;

  IF v_income_exists THEN
    RAISE NOTICE '✓ INCOME account (code 4000) exists';
  ELSE
    RAISE WARNING '✗ INCOME account (code 4000) NOT FOUND';
    RAISE NOTICE 'Action needed: Check your chart of accounts setup';
  END IF;
END $$;

-- ============================================================================
-- CHECK 5: Bank Accounts
-- ============================================================================
RAISE NOTICE '========================================';
RAISE NOTICE 'Checking Bank Accounts...';
RAISE NOTICE '========================================';

SELECT
  account_code,
  account_name,
  account_type,
  is_active
FROM chart_of_accounts
WHERE account_name IN ('SARASWAT BANK', 'STATE BANK OF INDIA (DRM)', 'Cash in Hand')
ORDER BY account_name;

-- ============================================================================
-- CHECK 6: Recent Vouchers
-- ============================================================================
DO $$
DECLARE
  v_voucher_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checking Recent Vouchers...';
  RAISE NOTICE '========================================';

  SELECT COUNT(*) INTO v_voucher_count
  FROM vouchers
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

  RAISE NOTICE 'Total vouchers in last 7 days: %', v_voucher_count;

  IF v_voucher_count = 0 THEN
    RAISE WARNING '✗ No vouchers created in last 7 days';
    RAISE NOTICE 'This might be normal if no payments were made';
  ELSE
    RAISE NOTICE '✓ Found % vouchers in last 7 days', v_voucher_count;
  END IF;
END $$;

-- Display recent vouchers
SELECT
  v.voucher_number,
  vt.voucher_type_name,
  v.voucher_date,
  v.total_amount,
  v.status,
  v.created_at
FROM vouchers v
LEFT JOIN voucher_types vt ON v.voucher_type_id = vt.id
WHERE v.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY v.created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 7: Online Payments Without Vouchers
-- ============================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checking ONLINE Payments...';
  RAISE NOTICE '========================================';

  SELECT COUNT(*) INTO v_count
  FROM advance_payment ap
  WHERE ap.payment_mode = 'ONLINE'
    AND ap.is_refund = FALSE
    AND ap.advance_amount > 0
    AND NOT EXISTS (
      SELECT 1
      FROM vouchers v
      WHERE v.patient_id = ap.patient_id
        AND v.voucher_date = ap.payment_date::DATE
        AND v.total_amount = ap.advance_amount
    );

  IF v_count = 0 THEN
    RAISE NOTICE '✓ All ONLINE payments have vouchers';
  ELSE
    RAISE WARNING '✗ Found % ONLINE payments WITHOUT vouchers', v_count;
    RAISE NOTICE 'Action needed: Run the backfill script';
  END IF;
END $$;

-- Display online payments without vouchers
SELECT
  ap.id,
  ap.patient_id,
  ap.payment_date,
  ap.advance_amount,
  ap.payment_mode,
  ap.bank_account_name,
  ap.remarks
FROM advance_payment ap
WHERE ap.payment_mode = 'ONLINE'
  AND ap.is_refund = FALSE
  AND ap.advance_amount > 0
  AND NOT EXISTS (
    SELECT 1
    FROM vouchers v
    WHERE v.patient_id = ap.patient_id
      AND v.voucher_date = ap.payment_date::DATE
      AND v.total_amount = ap.advance_amount
  )
ORDER BY ap.payment_date DESC
LIMIT 5;

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the output above to see:';
  RAISE NOTICE '1. Which functions are missing';
  RAISE NOTICE '2. Which voucher types exist';
  RAISE NOTICE '3. Which accounts are configured';
  RAISE NOTICE '4. How many vouchers exist';
  RAISE NOTICE '5. How many ONLINE payments need vouchers';
  RAISE NOTICE '';
  RAISE NOTICE 'Based on the results:';
  RAISE NOTICE '- If functions missing → Re-run main migration';
  RAISE NOTICE '- If ONLINE payments without vouchers → Run backfill';
  RAISE NOTICE '- If accounts missing → Check chart of accounts setup';
  RAISE NOTICE '';
END $$;
