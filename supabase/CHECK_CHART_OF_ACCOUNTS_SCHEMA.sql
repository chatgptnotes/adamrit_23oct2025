-- Check what columns exist in chart_of_accounts table
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chart_of_accounts'
ORDER BY ordinal_position;
