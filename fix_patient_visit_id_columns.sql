-- =====================================================
-- FIX: Change patient_id and visit_id to VARCHAR
-- Reason: Form sends string IDs like "UHAY25F27002", not integers
-- =====================================================

-- Change patient_id from BIGINT to VARCHAR
ALTER TABLE public.pharmacy_sales
ALTER COLUMN patient_id TYPE VARCHAR(255) USING patient_id::VARCHAR;

-- Change visit_id from BIGINT to VARCHAR
ALTER TABLE public.pharmacy_sales
ALTER COLUMN visit_id TYPE VARCHAR(255) USING visit_id::VARCHAR;

-- Verify changes
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'pharmacy_sales'
AND column_name IN ('patient_id', 'visit_id');

-- Test update
COMMENT ON COLUMN public.pharmacy_sales.patient_id IS 'Patient ID - accepts both numeric and alphanumeric IDs';
COMMENT ON COLUMN public.pharmacy_sales.visit_id IS 'Visit ID - accepts both numeric and alphanumeric IDs';

-- Update indexes (they will still work with VARCHAR)
-- No need to recreate indexes as they work with VARCHAR too
