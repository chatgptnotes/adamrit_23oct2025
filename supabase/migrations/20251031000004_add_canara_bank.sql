-- Add Canara Bank to Chart of Accounts
-- This bank account will be used for online payment routing

INSERT INTO chart_of_accounts (
  id,
  account_code,
  account_name,
  account_type,
  parent_account_id,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  '1123',
  'Canara Bank [A/C120023677813)JARIPATHKA ]',
  'BANK',
  (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1), -- Parent is Bank Accounts group
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (account_code) DO NOTHING;

-- Add comment
COMMENT ON TABLE chart_of_accounts IS 'Updated to include Canara Bank account for online payment routing';
