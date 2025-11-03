-- ============================================================================
-- Remove Duplicate SARASWAT BANK Entry
-- Purpose: Fix duplicate bank entries appearing in dropdown
-- Date: 2025-11-03
-- ============================================================================

-- ============================================================================
-- STEP 1: Check current SARASWAT BANK entries
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 1: Checking SARASWAT BANK entries...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  id,
  account_code,
  account_name,
  account_group,
  is_active,
  CASE
    WHEN is_active THEN '✓ ACTIVE'
    ELSE '✗ INACTIVE'
  END as status,
  created_at
FROM chart_of_accounts
WHERE account_name = 'SARASWAT BANK'
ORDER BY account_code;

-- ============================================================================
-- STEP 2: Deactivate the duplicate entry (account_code 1125)
-- ============================================================================
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 2: Deactivating duplicate SARASWAT BANK (code 1125)...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

  -- Check if duplicate exists
  SELECT COUNT(*) INTO duplicate_count
  FROM chart_of_accounts
  WHERE account_code = '1125' AND account_name = 'SARASWAT BANK';

  IF duplicate_count > 0 THEN
    RAISE NOTICE '⚠️  Found duplicate entry with account_code 1125 - deactivating...';

    -- Deactivate the duplicate
    UPDATE chart_of_accounts
    SET
      is_active = false,
      updated_at = NOW()
    WHERE account_code = '1125' AND account_name = 'SARASWAT BANK';

    RAISE NOTICE '✅ Duplicate entry deactivated successfully!';
  ELSE
    RAISE NOTICE 'ℹ️  No duplicate found with account_code 1125';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Ensure the correct entry (account_code 1122) is active
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 3: Ensuring correct SARASWAT BANK (code 1122) is active...';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

UPDATE chart_of_accounts
SET
  is_active = true,
  account_group = 'BANK',
  updated_at = NOW()
WHERE account_code = '1122' AND account_name = 'SARASWAT BANK';

-- ============================================================================
-- STEP 4: Verify the fix - Show updated SARASWAT BANK entries
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 4: Verification - SARASWAT BANK entries after fix:';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  id,
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
WHERE account_name = 'SARASWAT BANK'
ORDER BY account_code;

-- ============================================================================
-- STEP 5: Show all active bank accounts for payment dropdown
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'STEP 5: All active bank accounts (what dropdown will show):';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  account_code,
  account_name,
  account_group,
  is_active,
  '✓ Will appear in dropdown' as dropdown_status
FROM chart_of_accounts
WHERE account_name IN ('SARASWAT BANK', 'STATE BANK OF INDIA (DRM)', 'Canara Bank [A/C120023677813)JARIPATHKA]')
  AND is_active = true
ORDER BY account_name;

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
DECLARE
  active_saraswat_count INTEGER;
  total_active_banks INTEGER;
BEGIN
  -- Count active SARASWAT BANK entries
  SELECT COUNT(*) INTO active_saraswat_count
  FROM chart_of_accounts
  WHERE account_name = 'SARASWAT BANK' AND is_active = true;

  -- Count total active banks for dropdown
  SELECT COUNT(*) INTO total_active_banks
  FROM chart_of_accounts
  WHERE account_name IN ('SARASWAT BANK', 'STATE BANK OF INDIA (DRM)', 'Canara Bank [A/C120023677813)JARIPATHKA]')
    AND is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

  IF active_saraswat_count = 1 THEN
    RAISE NOTICE '✅ SUCCESS! Duplicate removed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Bank accounts status:';
    RAISE NOTICE '  - SARASWAT BANK: % active entry (CORRECT!)', active_saraswat_count;
    RAISE NOTICE '  - Total active banks: %', total_active_banks;
    RAISE NOTICE '';
    RAISE NOTICE 'Expected dropdown will show:';
    RAISE NOTICE '  1. SARASWAT BANK';
    RAISE NOTICE '  2. STATE BANK OF INDIA (DRM)';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Found % active SARASWAT BANK entries', active_saraswat_count;
    RAISE NOTICE 'Expected 1, got %', active_saraswat_count;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Refresh your browser (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Open Advance Payment modal';
  RAISE NOTICE '  3. Select "Online Transfer" payment mode';
  RAISE NOTICE '  4. SARASWAT BANK should appear only ONCE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
