INSERT INTO chart_of_accounts (
  account_code, account_name, account_type, account_group,
  opening_balance, opening_balance_type, is_active, parent_account_id
) VALUES (
  '1124',
  'Canara Bank HOPE PHARMACY [A/C120028497823] JARIPATKA',
  'CURRENT_ASSETS',
  'BANK',
  0.00, 'DR', true,
  (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1)
) ON CONFLICT (account_code) DO NOTHING;
