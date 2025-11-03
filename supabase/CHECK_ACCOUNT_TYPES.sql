-- Check what account_type values are used in existing records
SELECT DISTINCT
    account_type,
    COUNT(*) as count
FROM chart_of_accounts
GROUP BY account_type
ORDER BY count DESC;

-- Check the constraint definition
SELECT
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'chart_of_accounts'
  AND con.conname LIKE '%account_type%';
