-- ============================================================================
-- FINAL QUERY: Add nested sub-tests support to lab_test_config table
-- ============================================================================
-- Copy-paste this entire query in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add new columns for hierarchy
ALTER TABLE public.lab_test_config
  ADD COLUMN IF NOT EXISTS parent_config_id uuid NULL,
  ADD COLUMN IF NOT EXISTS test_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Step 2: Add foreign key constraint
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

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_lab_test_config_parent_config_id ON public.lab_test_config USING btree (parent_config_id);
CREATE INDEX IF NOT EXISTS idx_lab_test_config_test_level ON public.lab_test_config USING btree (test_level);
CREATE INDEX IF NOT EXISTS idx_lab_test_config_display_order ON public.lab_test_config USING btree (display_order);
CREATE INDEX IF NOT EXISTS idx_lab_test_config_lab_id_test_name ON public.lab_test_config USING btree (lab_id, test_name);

-- Step 4: Update existing data
UPDATE public.lab_test_config
SET test_level = 1, display_order = 0
WHERE test_level IS NULL OR test_level = 0;

-- Done!
SELECT 'lab_test_config table updated successfully for nested sub-tests!' as status;

-- Verify columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
AND column_name IN ('parent_config_id', 'test_level', 'display_order', 'is_active');
