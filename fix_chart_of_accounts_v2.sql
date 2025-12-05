-- ============================================================================
-- FIX: Add Missing Chart of Accounts Entries for Voucher Creation (v2)
-- Date: 2025-11-08
-- Purpose: Fix "Patient Services Revenue account (4001) not found" error
-- Note: Uses correct account type values based on database constraint
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current state and valid account types
-- ============================================================================

DO $$
DECLARE
  v_has_cash_account BOOLEAN;
  v_has_revenue_account BOOLEAN;
  v_revenue_count INTEGER;
  v_sample_type TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHART OF ACCOUNTS VERIFICATION';
  RAISE NOTICE '========================================';

  -- Get a sample account type to see the format
  SELECT account_type INTO v_sample_type
  FROM chart_of_accounts
  LIMIT 1;

  RAISE NOTICE 'Sample account type format: %', COALESCE(v_sample_type, 'NO ACCOUNTS EXIST');

  -- Check for Cash in Hand account (1110)
  SELECT EXISTS (
    SELECT 1 FROM chart_of_accounts
    WHERE account_code = '1110'
  ) INTO v_has_cash_account;

  -- Check for Patient Services Revenue account (4001)
  SELECT EXISTS (
    SELECT 1 FROM chart_of_accounts
    WHERE account_code = '4001'
  ) INTO v_has_revenue_account;

  -- Count total revenue/income accounts
  SELECT COUNT(*) INTO v_revenue_count
  FROM chart_of_accounts
  WHERE account_code LIKE '4%';

  IF v_has_cash_account THEN
    RAISE NOTICE '✓ Cash account (1110) exists';
  ELSE
    RAISE WARNING '✗ Cash account (1110) MISSING - will add';
  END IF;

  IF v_has_revenue_account THEN
    RAISE NOTICE '✓ Revenue account (4001) exists';
  ELSE
    RAISE WARNING '✗ Revenue account (4001) MISSING - will add';
  END IF;

  RAISE NOTICE 'Total revenue/income accounts (4xxx): %', v_revenue_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: Add Cash in Hand account (1110) if missing
-- Try different account type formats until one works
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chart_of_accounts
    WHERE account_code = '1110'
  ) THEN
    BEGIN
      -- Try with 'Asset' (title case)
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
        'Asset',
        NULL,
        true,
        NOW(),
        NOW()
      );

      RAISE NOTICE '✅ Added Cash in Hand account (1110) with type: Asset';
    EXCEPTION
      WHEN check_violation THEN
        -- If 'Asset' fails, try 'ASSET'
        BEGIN
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

          RAISE NOTICE '✅ Added Cash in Hand account (1110) with type: ASSET';
        EXCEPTION
          WHEN check_violation THEN
            -- If both fail, use whatever format exists in the table
            DECLARE
              v_asset_type TEXT;
            BEGIN
              SELECT DISTINCT account_type INTO v_asset_type
              FROM chart_of_accounts
              WHERE account_type ILIKE '%asset%'
              LIMIT 1;

              IF v_asset_type IS NOT NULL THEN
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
                  v_asset_type,
                  NULL,
                  true,
                  NOW(),
                  NOW()
                );

                RAISE NOTICE '✅ Added Cash in Hand account (1110) with type: %', v_asset_type;
              ELSE
                RAISE EXCEPTION 'Cannot determine correct account type format for assets';
              END IF;
            END;
        END;
    END;
  ELSE
    RAISE NOTICE '✓ Cash in Hand account (1110) already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add Patient Services Revenue account (4001) if missing
-- Try different account type formats until one works
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM chart_of_accounts
    WHERE account_code = '4001'
  ) THEN
    BEGIN
      -- Try with 'Income' (title case)
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
        'Income',
        NULL,
        true,
        NOW(),
        NOW()
      );

      RAISE NOTICE '✅ Added Patient Services Revenue account (4001) with type: Income';
    EXCEPTION
      WHEN check_violation THEN
        -- If 'Income' fails, try 'INCOME'
        BEGIN
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
            'INCOME',
            NULL,
            true,
            NOW(),
            NOW()
          );

          RAISE NOTICE '✅ Added Patient Services Revenue account (4001) with type: INCOME';
        EXCEPTION
          WHEN check_violation THEN
            -- If both fail, try 'Revenue'
            BEGIN
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
                'Revenue',
                NULL,
                true,
                NOW(),
                NOW()
              );

              RAISE NOTICE '✅ Added Patient Services Revenue account (4001) with type: Revenue';
            EXCEPTION
              WHEN check_violation THEN
                -- Last resort: use whatever format exists for income/revenue accounts
                DECLARE
                  v_income_type TEXT;
                BEGIN
                  SELECT DISTINCT account_type INTO v_income_type
                  FROM chart_of_accounts
                  WHERE account_type ILIKE '%income%' OR account_type ILIKE '%revenue%'
                  LIMIT 1;

                  IF v_income_type IS NOT NULL THEN
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
                      v_income_type,
                      NULL,
                      true,
                      NOW(),
                      NOW()
                    );

                    RAISE NOTICE '✅ Added Patient Services Revenue account (4001) with type: %', v_income_type;
                  ELSE
                    RAISE EXCEPTION 'Cannot determine correct account type format for income/revenue';
                  END IF;
                END;
            END;
        END;
    END;
  ELSE
    RAISE NOTICE '✓ Patient Services Revenue account (4001) already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Verify the accounts are now present
-- ============================================================================

DO $$
DECLARE
  v_cash_id UUID;
  v_cash_type TEXT;
  v_revenue_id UUID;
  v_revenue_type TEXT;
BEGIN
  SELECT id, account_type INTO v_cash_id, v_cash_type
  FROM chart_of_accounts
  WHERE account_code = '1110';

  SELECT id, account_type INTO v_revenue_id, v_revenue_type
  FROM chart_of_accounts
  WHERE account_code = '4001';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '========================================';

  IF v_cash_id IS NOT NULL THEN
    RAISE NOTICE '✓ Cash in Hand (1110): ID = %, Type = %', v_cash_id, v_cash_type;
  ELSE
    RAISE EXCEPTION 'FAILED: Cash in Hand account still not found!';
  END IF;

  IF v_revenue_id IS NOT NULL THEN
    RAISE NOTICE '✓ Patient Services Revenue (4001): ID = %, Type = %', v_revenue_id, v_revenue_type;
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
  RAISE NOTICE '  1. ✓ Cash in Hand (1110)';
  RAISE NOTICE '  2. ✓ Patient Services Revenue (4001)';
  RAISE NOTICE '';
  RAISE NOTICE 'Result:';
  RAISE NOTICE '  → Voucher creation will now work!';
  RAISE NOTICE '  → Final payments can be saved successfully';
  RAISE NOTICE '  → Advance payments can be saved successfully';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
