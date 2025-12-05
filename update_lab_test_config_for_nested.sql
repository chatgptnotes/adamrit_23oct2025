-- ============================================================================
-- Update lab_test_config table to support nested sub-tests
-- ============================================================================
-- Purpose: Add hierarchical structure to lab_test_config for nested sub-tests
-- Date: 2025-10-01
-- ============================================================================

-- Step 1: Add columns for nested sub-test hierarchy
ALTER TABLE public.lab_test_config
  ADD COLUMN IF NOT EXISTS parent_config_id uuid NULL,
  ADD COLUMN IF NOT EXISTS test_level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Step 2: Add foreign key constraint for parent_config_id (self-reference)
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

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_test_config_parent_config_id
  ON public.lab_test_config USING btree (parent_config_id);

CREATE INDEX IF NOT EXISTS idx_lab_test_config_test_level
  ON public.lab_test_config USING btree (test_level);

CREATE INDEX IF NOT EXISTS idx_lab_test_config_display_order
  ON public.lab_test_config USING btree (display_order);

CREATE INDEX IF NOT EXISTS idx_lab_test_config_lab_id_test_name
  ON public.lab_test_config USING btree (lab_id, test_name);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.lab_test_config.parent_config_id IS 'References parent config ID for nested sub-tests. NULL for direct sub-tests under main test.';
COMMENT ON COLUMN public.lab_test_config.test_level IS 'Hierarchy level: 1=Sub-test, 2=Nested sub-test, 3=Further nested';
COMMENT ON COLUMN public.lab_test_config.display_order IS 'Display order of sub-tests under parent';
COMMENT ON COLUMN public.lab_test_config.is_active IS 'Whether this configuration is active or archived';

-- Step 5: Update existing data (set test_level = 1 for all existing records)
UPDATE public.lab_test_config
SET test_level = 1, display_order = 0
WHERE test_level IS NULL OR test_level = 0;

-- Step 6: Create function to get all nested sub-test configs
CREATE OR REPLACE FUNCTION get_nested_test_configs(p_lab_id uuid, p_test_name text)
RETURNS TABLE (
    id uuid,
    parent_config_id uuid,
    test_name text,
    sub_test_name text,
    test_level integer,
    unit text,
    min_age integer,
    max_age integer,
    age_unit text,
    age_description text,
    gender text,
    min_value numeric,
    max_value numeric,
    normal_unit text,
    display_order integer,
    full_path text
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE config_hierarchy AS (
        -- Level 1: Direct sub-tests
        SELECT
            ltc.id,
            ltc.parent_config_id,
            ltc.test_name,
            ltc.sub_test_name,
            ltc.test_level,
            ltc.unit,
            ltc.min_age,
            ltc.max_age,
            ltc.age_unit,
            ltc.age_description,
            ltc.gender,
            ltc.min_value,
            ltc.max_value,
            ltc.normal_unit,
            ltc.display_order,
            ltc.sub_test_name::text as full_path
        FROM lab_test_config ltc
        WHERE ltc.lab_id = p_lab_id
          AND ltc.test_name = p_test_name
          AND ltc.parent_config_id IS NULL
          AND ltc.is_active = true

        UNION ALL

        -- Nested levels
        SELECT
            ltc.id,
            ltc.parent_config_id,
            ltc.test_name,
            ltc.sub_test_name,
            ltc.test_level,
            ltc.unit,
            ltc.min_age,
            ltc.max_age,
            ltc.age_unit,
            ltc.age_description,
            ltc.gender,
            ltc.min_value,
            ltc.max_value,
            ltc.normal_unit,
            ltc.display_order,
            (ch.full_path || ' > ' || ltc.sub_test_name)::text
        FROM lab_test_config ltc
        INNER JOIN config_hierarchy ch ON ltc.parent_config_id = ch.id
        WHERE ltc.is_active = true
    )
    SELECT * FROM config_hierarchy
    ORDER BY test_level, display_order;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_nested_test_configs(uuid, text) IS 'Get all sub-test configurations including nested ones for a given lab and test name';

-- Step 7: Create view for hierarchical display
CREATE OR REPLACE VIEW lab_test_config_tree AS
WITH RECURSIVE config_tree AS (
    -- Root level sub-tests
    SELECT
        id,
        lab_id,
        parent_config_id,
        test_name,
        sub_test_name,
        test_level,
        unit,
        min_age,
        max_age,
        age_unit,
        age_description,
        gender,
        min_value,
        max_value,
        normal_unit,
        display_order,
        sub_test_name as display_name,
        ARRAY[display_order]::integer[] as path,
        1 as depth
    FROM lab_test_config
    WHERE parent_config_id IS NULL
      AND is_active = true

    UNION ALL

    -- Child configs
    SELECT
        ltc.id,
        ltc.lab_id,
        ltc.parent_config_id,
        ltc.test_name,
        ltc.sub_test_name,
        ltc.test_level,
        ltc.unit,
        ltc.min_age,
        ltc.max_age,
        ltc.age_unit,
        ltc.age_description,
        ltc.gender,
        ltc.min_value,
        ltc.max_value,
        ltc.normal_unit,
        ltc.display_order,
        REPEAT('  ', ct.depth) || '└─ ' || ltc.sub_test_name,
        ct.path || ltc.display_order,
        ct.depth + 1
    FROM lab_test_config ltc
    INNER JOIN config_tree ct ON ltc.parent_config_id = ct.id
    WHERE ltc.is_active = true
)
SELECT
    id,
    lab_id,
    parent_config_id,
    test_name,
    sub_test_name,
    display_name,
    test_level,
    unit,
    min_age,
    max_age,
    age_unit,
    age_description,
    gender,
    min_value,
    max_value,
    normal_unit,
    display_order,
    depth
FROM config_tree
ORDER BY test_name, path;

COMMENT ON VIEW lab_test_config_tree IS 'Hierarchical tree view of lab test configurations showing nested sub-tests';

-- Step 8: Verification query
SELECT 'lab_test_config table updated successfully for nested sub-tests!' as status;

-- Verify new columns
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lab_test_config'
  AND column_name IN ('parent_config_id', 'test_level', 'display_order', 'is_active')
ORDER BY ordinal_position;
