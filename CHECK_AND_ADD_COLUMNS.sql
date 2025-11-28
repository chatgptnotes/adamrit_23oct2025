-- ============================================================================
-- CHECK AND ADD MISSING COLUMNS (if needed)
-- ============================================================================

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
ORDER BY ordinal_position;

-- Step 2: If columns are missing, add them
-- Run this block if parent_config_id, test_level, display_order, is_active are missing

ALTER TABLE public.lab_test_config
  ADD COLUMN IF NOT EXISTS parent_config_id uuid NULL,
  ADD COLUMN IF NOT EXISTS test_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Step 3: Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'lab_test_config_parent_config_id_fkey'
        AND table_name = 'lab_test_config'
    ) THEN
        ALTER TABLE public.lab_test_config
        ADD CONSTRAINT lab_test_config_parent_config_id_fkey
        FOREIGN KEY (parent_config_id) REFERENCES public.lab_test_config(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Add indexes
CREATE INDEX IF NOT EXISTS idx_lab_test_config_parent_config_id
  ON public.lab_test_config USING btree (parent_config_id);

CREATE INDEX IF NOT EXISTS idx_lab_test_config_test_level
  ON public.lab_test_config USING btree (test_level);

CREATE INDEX IF NOT EXISTS idx_lab_test_config_display_order
  ON public.lab_test_config USING btree (display_order);

-- Step 5: Verify columns added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
  AND column_name IN ('parent_config_id', 'test_level', 'display_order', 'is_active');

-- Step 6: If columns exist, show success message
SELECT
    'Columns added successfully!' as status,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
  AND column_name IN ('parent_config_id', 'test_level', 'display_order', 'is_active');
