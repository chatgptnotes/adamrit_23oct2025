-- Check the actual data type of created_by column in final_payments table
SELECT
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'final_payments'
  AND column_name = 'created_by';

-- If it's UUID, we need to change it back to TEXT
-- Uncomment below to fix:

-- ALTER TABLE public.final_payments
-- ALTER COLUMN created_by TYPE text
-- USING created_by::text;
