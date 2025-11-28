-- Check Canara Bank account details

SELECT
  id,
  account_code,
  account_name,
  account_type,
  account_group,
  is_active
FROM chart_of_accounts
WHERE account_name = 'Canara Bank [A/C120023677813)JARIPATHKA ]';

-- Also check if BANK group exists
SELECT DISTINCT account_group
FROM chart_of_accounts
WHERE account_group ILIKE '%bank%';
