-- ========================================================
-- MIGRATION FIX: Add missing columns to lab_test_config
-- ========================================================
-- Run this SQL in your Supabase SQL Editor to fix the
-- "Could not find the 'formula' column" error
-- ========================================================

-- Add formula column to store calculation formulas for auto-calculation
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS formula TEXT NULL;

-- Add test_type column to distinguish between Numeric and Text type tests
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS test_type TEXT NULL DEFAULT 'Numeric';

-- Add constraint for test_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'lab_test_config_test_type_check'
    ) THEN
        ALTER TABLE public.lab_test_config
        ADD CONSTRAINT lab_test_config_test_type_check
        CHECK (test_type IN ('Numeric', 'Text'));
    END IF;
END $$;

-- Add text_value column to store default text values for Text type tests
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS text_value TEXT NULL;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.lab_test_config.formula IS
'Formula for auto-calculating test values. Can reference other sub-test names.
Example: "Hemoglobin * 3 + 1" would calculate based on Hemoglobin sub-test value.';

COMMENT ON COLUMN public.lab_test_config.test_type IS
'Type of test result: "Numeric" for numerical values or "Text" for text-based results.
Default is "Numeric".';

COMMENT ON COLUMN public.lab_test_config.text_value IS
'Default or expected text value for Text type tests.
Only applicable when test_type is "Text".';

-- Update existing rows to have default test_type if NULL
UPDATE public.lab_test_config
SET test_type = 'Numeric'
WHERE test_type IS NULL;

-- Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
AND column_name IN ('formula', 'test_type', 'text_value')
ORDER BY column_name;
