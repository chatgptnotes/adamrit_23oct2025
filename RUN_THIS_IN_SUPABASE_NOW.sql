-- =====================================================
-- URGENT: Run this in Supabase SQL Editor NOW!
-- Fix patient_id and visit_id column types
-- =====================================================

-- Step 1: Change patient_id from BIGINT to VARCHAR
ALTER TABLE public.pharmacy_sales
ALTER COLUMN patient_id TYPE VARCHAR(255) USING COALESCE(patient_id::VARCHAR, NULL);

-- Step 2: Change visit_id from BIGINT to VARCHAR
ALTER TABLE public.pharmacy_sales
ALTER COLUMN visit_id TYPE VARCHAR(255) USING COALESCE(visit_id::VARCHAR, NULL);

-- Step 3: Verify the changes
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pharmacy_sales'
AND column_name IN ('patient_id', 'visit_id');

-- Expected output:
-- patient_id | character varying | 255
-- visit_id   | character varying | 255

-- Step 4: Test with sample data (optional)
-- INSERT INTO public.pharmacy_sales (patient_id, visit_id, patient_name, total_amount, payment_method)
-- VALUES ('UHAY25F27002', 'IH25F27004', 'Test', 100.00, 'CASH');

-- Step 5: Verify insert worked
-- SELECT * FROM pharmacy_sales ORDER BY created_at DESC LIMIT 1;
