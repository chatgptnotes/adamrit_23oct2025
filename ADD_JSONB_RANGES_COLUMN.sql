-- ============================================================================
-- Add JSONB column to store multiple age ranges and normal ranges
-- ============================================================================
-- This allows storing multiple ranges for each sub-test/nested sub-test
-- ============================================================================

-- Add JSONB column for age and normal ranges
ALTER TABLE public.lab_test_config
  ADD COLUMN IF NOT EXISTS age_ranges jsonb NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS normal_ranges jsonb NULL DEFAULT '[]'::jsonb;

-- Create GIN index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_lab_test_config_age_ranges
  ON public.lab_test_config USING gin (age_ranges);

CREATE INDEX IF NOT EXISTS idx_lab_test_config_normal_ranges
  ON public.lab_test_config USING gin (normal_ranges);

-- Add comments
COMMENT ON COLUMN public.lab_test_config.age_ranges IS 'Array of age ranges: [{"id":"ar1","minAge":1,"maxAge":5,"unit":"Years","description":"Child"}]';
COMMENT ON COLUMN public.lab_test_config.normal_ranges IS 'Array of normal ranges: [{"id":"nr1","ageRange":"1-5 Years","gender":"Both","minValue":"10","maxValue":"20","unit":"g/dL"}]';

-- Mark old columns as deprecated (optional)
COMMENT ON COLUMN public.lab_test_config.min_age IS 'DEPRECATED: Use age_ranges JSONB instead';
COMMENT ON COLUMN public.lab_test_config.max_age IS 'DEPRECATED: Use age_ranges JSONB instead';
COMMENT ON COLUMN public.lab_test_config.age_unit IS 'DEPRECATED: Use age_ranges JSONB instead';
COMMENT ON COLUMN public.lab_test_config.age_description IS 'DEPRECATED: Use age_ranges JSONB instead';
COMMENT ON COLUMN public.lab_test_config.min_value IS 'DEPRECATED: Use normal_ranges JSONB instead';
COMMENT ON COLUMN public.lab_test_config.max_value IS 'DEPRECATED: Use normal_ranges JSONB instead';
COMMENT ON COLUMN public.lab_test_config.gender IS 'DEPRECATED: Use normal_ranges JSONB instead';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
  AND column_name IN ('age_ranges', 'normal_ranges');

SELECT 'JSONB columns added successfully!' as status;
