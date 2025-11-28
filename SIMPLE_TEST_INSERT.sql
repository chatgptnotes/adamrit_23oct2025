-- ============================================================================
-- SIMPLE TEST INSERT - Minimal query to test if INSERT works
-- ============================================================================

-- Step 1: First check if lab table has data
SELECT id, name FROM lab LIMIT 1;

-- If no data, insert a test lab first:
-- INSERT INTO lab (name) VALUES ('Test Lab') RETURNING id;

-- ============================================================================
-- Step 2: Simple insert WITHOUT nested (just to test if basic insert works)
-- ============================================================================

-- Replace with actual lab_id from Step 1
INSERT INTO public.lab_test_config (
    lab_id,
    test_name,
    sub_test_name,
    unit,
    min_age,
    max_age,
    age_unit,
    gender,
    min_value,
    max_value
) VALUES (
    (SELECT id FROM lab LIMIT 1),  -- Auto-get first lab_id
    'SIMPLE_TEST',
    'Test Sub-Test',
    'unit',
    0,
    100,
    'Years',
    'Both',
    0,
    0
) RETURNING *;

-- ============================================================================
-- Step 3: Check if data was inserted
-- ============================================================================

SELECT * FROM public.lab_test_config
WHERE test_name = 'SIMPLE_TEST'
ORDER BY created_at DESC;

-- ============================================================================
-- If Step 2 works, then try with hierarchy columns
-- ============================================================================

INSERT INTO public.lab_test_config (
    lab_id,
    test_name,
    sub_test_name,
    unit,
    min_age,
    max_age,
    age_unit,
    gender,
    min_value,
    max_value,
    parent_config_id,
    test_level,
    display_order,
    is_active
) VALUES (
    (SELECT id FROM lab LIMIT 1),
    'HIERARCHY_TEST',
    'Sub-Test Level 1',
    'unit',
    0,
    100,
    'Years',
    'Both',
    0,
    0,
    NULL,
    1,
    0,
    true
) RETURNING *;

-- ============================================================================
-- Check again
-- ============================================================================

SELECT
    test_name,
    sub_test_name,
    test_level,
    parent_config_id,
    is_active
FROM public.lab_test_config
WHERE test_name IN ('SIMPLE_TEST', 'HIERARCHY_TEST')
ORDER BY created_at DESC;

-- ============================================================================
-- If any error occurs, show the error message
-- ============================================================================
