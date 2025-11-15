-- ============================================================================
-- FIX: Add Missing Chart of Accounts Entries for Voucher Creation
-- Date: 2025-11-08
-- Purpose: Fix "Patient Services Revenue account (4001) not found" error
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current state and report
-- ============================================================================

DO $$
DECLARE
  v_has_cash_account BOOLEAN;
  v_has_revenue_account BOOLEAN;
  v_revenue_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHART OF ACCOUNTS VERIFICATION';
  RAISE NOTICE '========================================';

  -- Check for Cash in Hand account (1110)
  SELECT EXISTS (
    SELECT 1 FROM chart_of_accounts
    WHERE account_code = '1110' AND account_name = 'Cash in Hand'
  ) INTO v_has_cash_account;

  -- Check for Patient Services Revenue account (4001)
  SELECT EXISTS (
    SELECT 1 FROM chart_of_accounts
    WHERE account_code = '4001' AND account_name = 'Patient Services Revenue'
  ) INTO v_has_revenue_account;

  -- Count total revenue accounts
  SELECT COUNT(*) INTO v_revenue_count
  FROM chart_of_accounts
  WHERE account_code LIKE '4%';

  IF v_has_cash_account THEN
    RAISE NOTICE '✓ Cash in Hand account (1110) exists';
  ELSE
    RAISE WARNING '✗ Cash in Hand account (1110) MISSING - will add';
  END IF;

  IF v_has_revenue_account THEN
    RAISE NOTICE '✓ Patient Services Revenue account (4001) exists';
  ELSE
    RAISE WARNING '✗ Patient Services Revenue account (4001) MISSING - will add';
  END IF;

  RAISE NOTICE 'Total revenue accounts (4xxx): %', v_revenue_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: Add Cash in Hand account (1110) if missing
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chart_of_accounts
    WHERE account_code = '1110'
  ) THEN
    INSERT INTO chart_of_accounts (
      account_code,
      account_name,
      account_type,
      parent_account_id,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      '1110',
      'Cash in Hand',
      'ASSET',
      NULL,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE '✅ Added Cash in Hand account (1110)';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add Patient Services Revenue account (4001) if missing
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chart_of_accounts
    WHERE account_code = '4001'
  ) THEN
    INSERT INTO chart_of_accounts (
      account_code,
      account_name,
      account_type,
      parent_account_id,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      '4001',
      'Patient Services Revenue',
      'REVENUE',
      NULL,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE '✅ Added Patient Services Revenue account (4001)';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Verify the accounts are now present
-- ============================================================================

DO $$
DECLARE
  v_cash_id UUID;
  v_revenue_id UUID;
BEGIN
  SELECT id INTO v_cash_id
  FROM chart_of_accounts
  WHERE account_code = '1110' AND account_name = 'Cash in Hand';

  SELECT id INTO v_revenue_id
  FROM chart_of_accounts
  WHERE account_code = '4001' AND account_name = 'Patient Services Revenue';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '========================================';

  IF v_cash_id IS NOT NULL THEN
    RAISE NOTICE '✓ Cash in Hand (1110): ID = %', v_cash_id;
  ELSE
    RAISE EXCEPTION 'FAILED: Cash in Hand account still not found!';
  END IF;

  IF v_revenue_id IS NOT NULL THEN
    RAISE NOTICE '✓ Patient Services Revenue (4001): ID = %', v_revenue_id;
  ELSE
    RAISE EXCEPTION 'FAILED: Patient Services Revenue account still not found!';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅✅✅ CHART OF ACCOUNTS FIXED SUCCESSFULLY ✅✅✅';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Accounts added/verified:';
  RAISE NOTICE '  1. ✓ Cash in Hand (1110) - ASSET';
  RAISE NOTICE '  2. ✓ Patient Services Revenue (4001) - REVENUE';
  RAISE NOTICE '';
  RAISE NOTICE 'Result:';
  RAISE NOTICE '  → Voucher creation will now work!';
  RAISE NOTICE '  → Final payments can be saved successfully';
  RAISE NOTICE '  → Advance payments can be saved successfully';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
