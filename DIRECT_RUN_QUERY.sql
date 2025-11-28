-- ============================================================================
-- DIRECT RUN QUERY - Supabase SQL Editor me seedha run karo
-- ============================================================================
-- Purpose: Add nested sub-tests support to existing lab_results table
-- Date: 2025-10-01
-- ============================================================================

-- Step 1: Add 4 new columns
ALTER TABLE public.lab_results
  ADD COLUMN IF NOT EXISTS parent_test_id uuid NULL,
  ADD COLUMN IF NOT EXISTS test_level integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sub_test_config jsonb NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS display_order integer NULL DEFAULT 0;

-- Step 2: Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'lab_results_parent_test_id_fkey'
        AND table_name = 'lab_results'
    ) THEN
        ALTER TABLE public.lab_results
        ADD CONSTRAINT lab_results_parent_test_id_fkey
        FOREIGN KEY (parent_test_id) REFERENCES public.lab_results(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_lab_results_parent_test_id ON public.lab_results USING btree (parent_test_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test_level ON public.lab_results USING btree (test_level);
CREATE INDEX IF NOT EXISTS idx_lab_results_display_order ON public.lab_results USING btree (display_order);
CREATE INDEX IF NOT EXISTS idx_lab_results_sub_test_config ON public.lab_results USING gin (sub_test_config);

-- Step 4: Drop trigger if exists (from your requirement)
DROP TRIGGER IF EXISTS auto_populate_discharge_summary ON ipd_discharge_summary;

-- Done!
SELECT 'Nested sub-tests columns added successfully!' as status;
