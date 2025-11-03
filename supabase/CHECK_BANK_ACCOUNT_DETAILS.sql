-- ============================================================================
-- Check Exact Details of STATE BANK OF INDIA (DRM) Account
-- To understand why WHERE clause is failing
-- ============================================================================

-- Check the account details
SELECT
  id,
  account_code,
  account_name,
  account_type,
  account_group,
  parent_account_id,
  is_active,
  '👆 These are the EXACT values we need to check in WHERE clause' as note
FROM chart_of_accounts
WHERE account_name = 'STATE BANK OF INDIA (DRM)';

-- Check if any voucher entries exist for this account on 03-11-2025
SELECT
  COUNT(*) as entry_count,
  'Number of voucher entries on 2025-11-03' as description
FROM voucher_entries ve
JOIN chart_of_accounts coa ON ve.account_id = coa.id
JOIN vouchers v ON ve.voucher_id = v.id
WHERE coa.account_name = 'STATE BANK OF INDIA (DRM)'
  AND v.voucher_date = '2025-11-03';

-- Show actual account_group values for bank accounts
SELECT DISTINCT
  account_group,
  COUNT(*) as account_count,
  STRING_AGG(account_name, ', ') as accounts
FROM chart_of_accounts
WHERE account_name ILIKE '%bank%'
  OR account_code IN ('1121', '1122', '1125')
GROUP BY account_group;
