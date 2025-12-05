-- Migration: Add formula, test_type, and text_value columns to lab_test_config table
-- Date: 2025-11-03
-- Description: Adds support for formula-based calculations, test types (Numeric/Text), and text values

-- Add formula column to store calculation formulas for auto-calculation
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS formula TEXT NULL;

-- Add test_type column to distinguish between Numeric and Text type tests
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS test_type TEXT NULL DEFAULT 'Numeric' CHECK (test_type IN ('Numeric', 'Text'));

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
