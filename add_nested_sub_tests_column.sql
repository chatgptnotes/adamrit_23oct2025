-- Add nested_sub_tests JSONB column to lab_test_config table
-- This will store nested sub-tests within a single row instead of separate rows

ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS nested_sub_tests JSONB NULL DEFAULT '[]'::jsonb;

-- Create GIN index for efficient querying of nested_sub_tests
CREATE INDEX IF NOT EXISTS idx_lab_test_config_nested_sub_tests
ON public.lab_test_config USING gin (nested_sub_tests)
TABLESPACE pg_default;

-- Add comment to explain the column structure
COMMENT ON COLUMN public.lab_test_config.nested_sub_tests IS
'JSONB array containing nested sub-tests with their own age_ranges and normal_ranges.
Structure: [{"name": "...", "unit": "...", "age_ranges": [...], "normal_ranges": [...]}]';
