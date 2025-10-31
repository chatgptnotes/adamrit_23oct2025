-- ============================================================================
-- Add Specific Bank Accounts to Chart of Accounts
-- Purpose: Add bank accounts for routing patient payments based on remarks
-- ============================================================================

-- ============================================================================
-- STEP 1: Add STATE BANK OF INDIA (DRM) account
-- ============================================================================
INSERT INTO chart_of_accounts (
  account_code,
  account_name,
  account_type,
  account_group,
  opening_balance,
  opening_balance_type,
  is_active,
  parent_account_id
) VALUES (
  '1121',
  'STATE BANK OF INDIA (DRM)',
  'CURRENT_ASSETS',
  'BANK',
  0.00,
  'DR',
  true,
  (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1)
)
ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  account_type = EXCLUDED.account_type,
  account_group = EXCLUDED.account_group,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- STEP 2: Add SARASWAT BANK account
-- ============================================================================
INSERT INTO chart_of_accounts (
  account_code,
  account_name,
  account_type,
  account_group,
  opening_balance,
  opening_balance_type,
  is_active,
  parent_account_id
) VALUES (
  '1122',
  'SARASWAT BANK',
  'CURRENT_ASSETS',
  'BANK',
  0.00,
  'DR',
  true,
  (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1)
)
ON CONFLICT (account_code) DO UPDATE SET
  account_name = EXCLUDED.account_name,
  account_type = EXCLUDED.account_type,
  account_group = EXCLUDED.account_group,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- STEP 3: Add comments
-- ============================================================================
COMMENT ON TABLE chart_of_accounts IS 'Chart of accounts with bank accounts for payment routing based on remarks field';

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Bank accounts added successfully!';
  RAISE NOTICE '  - STATE BANK OF INDIA (DRM) - Account Code: 1121';
  RAISE NOTICE '  - SARASWAT BANK - Account Code: 1122';
  RAISE NOTICE '  ';
  RAISE NOTICE 'Payment routing will now work based on remarks field:';
  RAISE NOTICE '  - Remarks containing "sbi" or "drm" → STATE BANK OF INDIA (DRM)';
  RAISE NOTICE '  - Remarks containing "saraswat" → SARASWAT BANK';
  RAISE NOTICE '  - Other remarks → Cash in Hand (default)';
END $$;
