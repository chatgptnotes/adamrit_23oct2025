-- ============================================================================
-- Verify and Fix Bank Accounts in Chart of Accounts
-- Purpose: Check if banks exist and add/update them if needed
-- Date: 2025-11-03
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current bank accounts
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: Checking existing bank accounts...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  account_code,
  account_name,
  account_group,
  is_active,
  CASE
    WHEN is_active THEN '✓ ACTIVE'
    ELSE '✗ INACTIVE'
  END as status
FROM chart_of_accounts
WHERE account_name IN ('SARASWAT BANK', 'STATE BANK OF INDIA (DRM)', 'Canara Bank [A/C120023677813)JARIPATHKA]')
ORDER BY account_name;

-- ============================================================================
-- STEP 2: Insert/Update STATE BANK OF INDIA (DRM)
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2: Ensuring STATE BANK OF INDIA (DRM) exists...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

INSERT INTO chart_of_accounts (
  account_code,
  account_name,
  account_type,
  account_group,
  opening_balance,
  opening_balance_type,
  is_active,
  parent_account_id,
  created_at,
  updated_at
) VALUES (
  '1121',
  'STATE BANK OF INDIA (DRM)',
  'CURRENT_ASSETS',
  'BANK',
  0.00,
  'DR',
  true,
  (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1),
  NOW(),
  NOW()
)
ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  account_type = EXCLUDED.account_type,
  account_group = EXCLUDED.account_group,
  is_active = true,  -- Force active
  updated_at = NOW();

-- ============================================================================
-- STEP 3: Insert/Update SARASWAT BANK
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: Ensuring SARASWAT BANK exists...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

INSERT INTO chart_of_accounts (
  account_code,
  account_name,
  account_type,
  account_group,
  opening_balance,
  opening_balance_type,
  is_active,
  parent_account_id,
  created_at,
  updated_at
) VALUES (
  '1122',
  'SARASWAT BANK',
  'CURRENT_ASSETS',
  'BANK',
  0.00,
  'DR',
  true,
  (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1),
  NOW(),
  NOW()
)
ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  account_type = EXCLUDED.account_type,
  account_group = EXCLUDED.account_group,
  is_active = true,  -- Force active
  updated_at = NOW();

-- ============================================================================
-- STEP 4: Verify the fix - Show updated bank accounts
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 4: Verification - Updated bank accounts:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  account_code,
  account_name,
  account_group,
  is_active,
  CASE
    WHEN is_active THEN '✓ ACTIVE'
    ELSE '✗ INACTIVE'
  END as status,
  updated_at
FROM chart_of_accounts
WHERE account_name IN ('SARASWAT BANK', 'STATE BANK OF INDIA (DRM)', 'Canara Bank [A/C120023677813)JARIPATHKA]')
ORDER BY account_name;

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
DECLARE
  bank_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bank_count
  FROM chart_of_accounts
  WHERE account_name IN ('SARASWAT BANK', 'STATE BANK OF INDIA (DRM)')
    AND is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  IF bank_count >= 2 THEN
    RAISE NOTICE '✅ SUCCESS! Both bank accounts are now active:';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Expected 2 active banks, found %', bank_count;
  END IF;
  RAISE NOTICE '  - STATE BANK OF INDIA (DRM) (Account Code: 1121)';
  RAISE NOTICE '  - SARASWAT BANK (Account Code: 1122)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Refresh the application in your browser';
  RAISE NOTICE '  2. Open the Advance Payment modal';
  RAISE NOTICE '  3. Select "Online Transfer" as payment mode';
  RAISE NOTICE '  4. Both banks should now appear in the dropdown';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
