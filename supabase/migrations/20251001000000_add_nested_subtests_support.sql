-- Migration: Add nested sub-tests support to existing lab_results table
-- Date: 2025-10-01
-- Description: Adds columns to support hierarchical nested sub-tests structure

-- Add new columns for nested sub-test support
ALTER TABLE public.lab_results
ADD COLUMN IF NOT EXISTS parent_test_id uuid NULL REFERENCES public.lab_results(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS test_level integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS sub_test_config jsonb NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS display_order integer NULL DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_results_parent_test_id ON public.lab_results USING btree (parent_test_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_lab_results_test_level ON public.lab_results USING btree (test_level) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_lab_results_display_order ON public.lab_results USING btree (display_order) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_lab_results_sub_test_config ON public.lab_results USING gin (sub_test_config) TABLESPACE pg_default;

-- Add comments for documentation
COMMENT ON COLUMN public.lab_results.parent_test_id IS 'References parent test ID for nested sub-tests. NULL for main tests and level-1 sub-tests.';
COMMENT ON COLUMN public.lab_results.test_level IS 'Hierarchy level: 0=Main test, 1=Sub-test, 2=Nested sub-test, 3=Further nested';
COMMENT ON COLUMN public.lab_results.sub_test_config IS 'JSON configuration containing age ranges, normal ranges, and unit info for the sub-test';
COMMENT ON COLUMN public.lab_results.display_order IS 'Order in which sub-tests should be displayed under parent';

-- Example of sub_test_config structure:
-- {
--   "unit": "g/dL",
--   "ageRanges": [
--     {"id": "ar1", "minAge": "0", "maxAge": "1", "unit": "Years", "description": "Infant"}
--   ],
--   "normalRanges": [
--     {"id": "nr1", "ageRange": "0-1 Years", "gender": "Both", "minValue": "10", "maxValue": "14", "unit": "g/dL"}
--   ]
-- }

-- Function to get all nested sub-tests recursively
CREATE OR REPLACE FUNCTION get_test_with_nested_subtests(p_test_id uuid)
RETURNS TABLE (
    id uuid,
    parent_test_id uuid,
    main_test_name varchar,
    test_name varchar,
    test_level integer,
    result_value text,
    result_unit varchar,
    reference_range varchar,
    sub_test_config jsonb,
    display_order integer,
    full_path text
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE nested_tests AS (
        -- Base case: main test
        SELECT
            lr.id,
            lr.parent_test_id,
            lr.main_test_name,
            lr.test_name,
            lr.test_level,
            lr.result_value,
            lr.result_unit,
            lr.reference_range,
            lr.sub_test_config,
            lr.display_order,
            lr.test_name::text as full_path
        FROM lab_results lr
        WHERE lr.id = p_test_id

        UNION ALL

        -- Recursive case: nested sub-tests
        SELECT
            lr.id,
            lr.parent_test_id,
            lr.main_test_name,
            lr.test_name,
            lr.test_level,
            lr.result_value,
            lr.result_unit,
            lr.reference_range,
            lr.sub_test_config,
            lr.display_order,
            (nt.full_path || ' > ' || lr.test_name)::text
        FROM lab_results lr
        INNER JOIN nested_tests nt ON lr.parent_test_id = nt.id
    )
    SELECT * FROM nested_tests
    ORDER BY test_level, display_order;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_test_with_nested_subtests(uuid) IS 'Recursively retrieves a test and all its nested sub-tests in hierarchical order';

-- Function to get all tests for a visit with nested structure
CREATE OR REPLACE FUNCTION get_visit_lab_results_hierarchical(p_visit_id uuid)
RETURNS TABLE (
    id uuid,
    parent_test_id uuid,
    main_test_name varchar,
    test_name varchar,
    test_level integer,
    result_value text,
    result_unit varchar,
    reference_range varchar,
    sub_test_config jsonb,
    display_order integer,
    indented_name text
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE test_hierarchy AS (
        -- Level 0: Main tests (no parent)
        SELECT
            lr.id,
            lr.parent_test_id,
            lr.main_test_name,
            lr.test_name,
            lr.test_level,
            lr.result_value,
            lr.result_unit,
            lr.reference_range,
            lr.sub_test_config,
            lr.display_order,
            lr.test_name::text as indented_name,
            ARRAY[lr.display_order] as sort_path
        FROM lab_results lr
        WHERE lr.visit_id = p_visit_id
        AND lr.parent_test_id IS NULL

        UNION ALL

        -- All nested levels
        SELECT
            lr.id,
            lr.parent_test_id,
            lr.main_test_name,
            lr.test_name,
            lr.test_level,
            lr.result_value,
            lr.result_unit,
            lr.reference_range,
            lr.sub_test_config,
            lr.display_order,
            (REPEAT('  ', lr.test_level) || lr.test_name)::text,
            th.sort_path || lr.display_order
        FROM lab_results lr
        INNER JOIN test_hierarchy th ON lr.parent_test_id = th.id
        WHERE lr.visit_id = p_visit_id
    )
    SELECT
        id,
        parent_test_id,
        main_test_name,
        test_name,
        test_level,
        result_value,
        result_unit,
        reference_range,
        sub_test_config,
        display_order,
        indented_name
    FROM test_hierarchy
    ORDER BY sort_path;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_visit_lab_results_hierarchical(uuid) IS 'Gets all lab results for a visit in hierarchical order with proper indentation';

-- View for easy hierarchical display
CREATE OR REPLACE VIEW lab_results_tree AS
WITH RECURSIVE test_tree AS (
    -- Root level tests
    SELECT
        id,
        parent_test_id,
        main_test_name,
        test_name,
        test_level,
        result_value,
        result_unit,
        reference_range,
        visit_id,
        test_name as display_name,
        ARRAY[display_order]::integer[] as path,
        1 as depth
    FROM lab_results
    WHERE parent_test_id IS NULL

    UNION ALL

    -- Child tests
    SELECT
        lr.id,
        lr.parent_test_id,
        lr.main_test_name,
        lr.test_name,
        lr.test_level,
        lr.result_value,
        lr.result_unit,
        lr.reference_range,
        lr.visit_id,
        REPEAT('  ', tt.depth) || '└─ ' || lr.test_name as display_name,
        tt.path || lr.display_order,
        tt.depth + 1
    FROM lab_results lr
    INNER JOIN test_tree tt ON lr.parent_test_id = tt.id
)
SELECT
    id,
    parent_test_id,
    main_test_name,
    test_name,
    display_name,
    test_level,
    result_value,
    result_unit,
    reference_range,
    visit_id,
    depth
FROM test_tree
ORDER BY path;

COMMENT ON VIEW lab_results_tree IS 'Tree view of lab results showing parent-child relationships with visual indentation';

SELECT 'Migration completed: Nested sub-tests support added to lab_results table' as status;
