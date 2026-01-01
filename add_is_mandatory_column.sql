-- Add is_mandatory column to lab_test_config table
-- When true (default), sub-test appears in entry mode and print
-- When false, sub-test is hidden from entry mode and print

ALTER TABLE lab_test_config
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN NOT NULL DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN public.lab_test_config.is_mandatory IS
'When true, sub-test appears in entry mode and print. When false, sub-test is hidden. Defaults to true for backward compatibility.';

-- Create index for filtering mandatory tests
CREATE INDEX IF NOT EXISTS idx_lab_test_config_is_mandatory
  ON public.lab_test_config USING btree (is_mandatory);
