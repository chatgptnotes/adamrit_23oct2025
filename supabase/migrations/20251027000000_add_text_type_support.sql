-- Add support for Text type sub-tests in lab_test_config table
-- Date: 2025-10-27
-- Description: Adds columns to support both Numeric and Text type sub-tests

-- Step 1: Add test_type column (default to 'Numeric' for backward compatibility)
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS test_type TEXT NOT NULL DEFAULT 'Numeric';

-- Step 2: Add CHECK constraint for test_type
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

-- Step 3: Add text_value column for storing text-based test values
ALTER TABLE public.lab_test_config
ADD COLUMN IF NOT EXISTS text_value TEXT NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.lab_test_config.test_type IS
'Type of test value: Numeric (with ranges) or Text (free text)';

COMMENT ON COLUMN public.lab_test_config.text_value IS
'Text value for Text type sub-tests. Null for Numeric type sub-tests.';

-- Step 5: Create index for test_type for efficient filtering
CREATE INDEX IF NOT EXISTS idx_lab_test_config_test_type
ON public.lab_test_config USING btree (test_type)
TABLESPACE pg_default;

-- Step 6: Update existing records to have default type 'Numeric'
UPDATE public.lab_test_config
SET test_type = 'Numeric'
WHERE test_type IS NULL;

-- Step 7: Verify columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
AND column_name IN ('test_type', 'text_value')
ORDER BY ordinal_position;
