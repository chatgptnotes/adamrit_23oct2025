-- Add JSONB columns to existing lab_test_config table
-- Run this migration to add support for:
-- 1. Multiple age ranges per sub-test
-- 2. Multiple normal ranges per sub-test
-- 3. Nested sub-tests with their own ranges

-- Add age_ranges JSONB column
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS age_ranges JSONB NULL DEFAULT '[]'::jsonb;

-- Add normal_ranges JSONB column
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS normal_ranges JSONB NULL DEFAULT '[]'::jsonb;

-- Add nested_sub_tests JSONB column
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS nested_sub_tests JSONB NULL DEFAULT '[]'::jsonb;

-- Create GIN indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_lab_test_config_age_ranges
ON public.lab_test_config USING gin (age_ranges)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lab_test_config_normal_ranges
ON public.lab_test_config USING gin (normal_ranges)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lab_test_config_nested_sub_tests
ON public.lab_test_config USING gin (nested_sub_tests)
TABLESPACE pg_default;

-- Add comments
COMMENT ON COLUMN public.lab_test_config.age_ranges IS
'JSONB array of age ranges: [{"min_age": 0, "max_age": 5, "unit": "Years", "description": "Infant", "gender": "Both"}]';

COMMENT ON COLUMN public.lab_test_config.normal_ranges IS
'JSONB array of normal ranges: [{"age_range": "0-5 Years", "gender": "Male", "min_value": 12.0, "max_value": 16.0, "unit": "g/dL"}]';

COMMENT ON COLUMN public.lab_test_config.nested_sub_tests IS
'JSONB array of nested sub-tests with their own ranges: [{"name": "Eosinophils", "unit": "%", "age_ranges": [...], "normal_ranges": [...]}]';

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
AND column_name IN ('age_ranges', 'normal_ranges', 'nested_sub_tests');
