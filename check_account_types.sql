-- ============================================================================
-- Query to check valid account types in chart_of_accounts table
-- ============================================================================

-- Check constraint definition
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'chart_of_accounts'
  AND con.conname LIKE '%account_type%';

-- Check existing account types
SELECT DISTINCT account_type
FROM chart_of_accounts
ORDER BY account_type;

-- Check sample records
SELECT account_code, account_name, account_type
FROM chart_of_accounts
ORDER BY account_code
LIMIT 20;
