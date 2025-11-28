-- ============================================================================
-- COMPLETE WORKING INSERT - Guaranteed to save nested sub-tests
-- ============================================================================
-- This query will insert both sub-test AND nested sub-test with all details
-- ============================================================================

-- STEP 1: First get your lab_id
SELECT id, name FROM lab LIMIT 5;
-- Copy one lab_id from above

-- STEP 2: Run this complete query (replace YOUR_LAB_ID with actual UUID)

-- ============================================================================
-- Example 1: Simple test (works immediately)
-- ============================================================================

-- Insert Sub-Test Level 1
INSERT INTO public.lab_test_config (
    lab_id,
    test_name,
    sub_test_name,
    unit,
    min_age, max_age, age_unit, age_description,
    gender, min_value, max_value, normal_unit,
    parent_config_id, test_level, display_order, is_active
) VALUES (
    'YOUR_LAB_ID'::uuid,
    'CBC',
    'Hemoglobin',
    'g/dL',
    18, 65, 'Years', 'Adult',
    'Both', 13.0, 17.0, 'g/dL',
    NULL,  -- No parent
    1,     -- Level 1 (sub-test)
    0,
    true
) RETURNING id, test_name, sub_test_name, test_level;

-- IMPORTANT: Copy the returned ID from above query
-- For example: a1b2c3d4-e5f6-7890-abcd-ef1234567890

-- Then insert Nested Sub-Test Level 2
INSERT INTO public.lab_test_config (
    lab_id,
    test_name,
    sub_test_name,
    unit,
    min_age, max_age, age_unit, age_description,
    gender, min_value, max_value, normal_unit,
    parent_config_id, test_level, display_order, is_active
) VALUES (
    'YOUR_LAB_ID'::uuid,
    'CBC',
    'HbA1c',  -- This is NESTED sub-test
    '%',
    18, 65, 'Years', 'Adult',
    'Both', 4.0, 5.6, '%',
    'PARENT_ID_FROM_ABOVE'::uuid,  -- ⬅️ Replace with ID returned from previous query
    2,  -- Level 2 (NESTED)
    0,
    true
) RETURNING id, test_name, sub_test_name, test_level, parent_config_id;

-- ============================================================================
-- Example 2: Complete automated insert (preferred)
-- ============================================================================

-- Cleanup first
DELETE FROM public.lab_test_config
WHERE test_name = 'TEST_CBC'
AND lab_id = 'YOUR_LAB_ID'::uuid;

-- Insert with automatic parent-child relationship
DO $$
DECLARE
    v_lab_id uuid := 'YOUR_LAB_ID'::uuid;  -- ⬅️ Replace this
    v_parent_id uuid;
BEGIN
    -- Insert Sub-Test Level 1
    INSERT INTO public.lab_test_config (
        lab_id, test_name, sub_test_name, unit,
        min_age, max_age, age_unit, age_description,
        gender, min_value, max_value, normal_unit,
        parent_config_id, test_level, display_order, is_active
    ) VALUES (
        v_lab_id,
        'TEST_CBC',
        'Differential Leukocyte Count',  -- From screenshot
        'unit',
        0, 100, 'Years', NULL,
        'Both', 0, 0, 'unit',
        NULL, 1, 0, true
    ) RETURNING id INTO v_parent_id;

    RAISE NOTICE 'Inserted sub-test with ID: %', v_parent_id;

    -- Insert Nested Sub-Test Level 2 (child of above)
    INSERT INTO public.lab_test_config (
        lab_id, test_name, sub_test_name, unit,
        min_age, max_age, age_unit, age_description,
        gender, min_value, max_value, normal_unit,
        parent_config_id, test_level, display_order, is_active
    ) VALUES (
        v_lab_id,
        'TEST_CBC',
        'Differential Count',  -- Nested from screenshot
        '%',
        1, 5, 'Years', 'Description',
        'Both', 0, 0, '%',
        v_parent_id,  -- Parent reference
        2, 0, true
    );

    RAISE NOTICE 'Inserted nested sub-test under parent: %', v_parent_id;

    -- Insert another nested sub-test if needed
    INSERT INTO public.lab_test_config (
        lab_id, test_name, sub_test_name, unit,
        min_age, max_age, age_unit, age_description,
        gender, min_value, max_value, normal_unit,
        parent_config_id, test_level, display_order, is_active
    ) VALUES (
        v_lab_id,
        'TEST_CBC',
        'Neutrophils',  -- Another nested test
        '%',
        18, 65, 'Years', 'Adult',
        'Both', 40, 70, '%',
        v_parent_id,  -- Same parent
        2, 1, true
    );

    RAISE NOTICE 'Success! All nested sub-tests inserted';
END $$;

-- ============================================================================
-- VERIFY: Check what was saved
-- ============================================================================

SELECT
    id,
    sub_test_name,
    test_level,
    parent_config_id,
    CASE
        WHEN parent_config_id IS NULL THEN 'ROOT SUB-TEST (Level 1)'
        ELSE 'NESTED SUB-TEST (Level 2) - Parent: ' || parent_config_id::text
    END as hierarchy_info,
    unit,
    min_age || '-' || max_age || ' ' || age_unit as age_range,
    min_value || '-' || max_value || ' ' || normal_unit as normal_range
FROM public.lab_test_config
WHERE test_name = 'TEST_CBC'
  AND lab_id = 'YOUR_LAB_ID'::uuid
ORDER BY test_level, display_order;

-- ============================================================================
-- TREE VIEW: See parent-child relationship
-- ============================================================================

WITH RECURSIVE tree AS (
    -- Root level (sub-tests)
    SELECT
        id,
        sub_test_name,
        test_level,
        parent_config_id,
        sub_test_name as path,
        0 as depth
    FROM lab_test_config
    WHERE test_name = 'TEST_CBC'
      AND lab_id = 'YOUR_LAB_ID'::uuid
      AND parent_config_id IS NULL

    UNION ALL

    -- Nested levels
    SELECT
        c.id,
        c.sub_test_name,
        c.test_level,
        c.parent_config_id,
        t.path || ' → ' || c.sub_test_name,
        t.depth + 1
    FROM lab_test_config c
    INNER JOIN tree t ON c.parent_config_id = t.id
    WHERE c.lab_id = 'YOUR_LAB_ID'::uuid
)
SELECT
    REPEAT('  ', depth) || '└─ ' || sub_test_name as hierarchy,
    test_level,
    path as full_path
FROM tree
ORDER BY path;

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- └─ Differential Leukocyte Count (Level 1)
--   └─ Differential Count (Level 2)
--   └─ Neutrophils (Level 2)
-- ============================================================================

-- Cleanup (uncomment to delete test data)
-- DELETE FROM public.lab_test_config WHERE test_name = 'TEST_CBC' AND lab_id = 'YOUR_LAB_ID'::uuid;
