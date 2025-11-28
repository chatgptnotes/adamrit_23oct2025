-- ============================================================================
-- TEST QUERY: Nested Sub-Tests Data Save Test
-- ============================================================================
-- Purpose: Test if nested sub-tests are saving correctly in lab_results table
-- ============================================================================

-- Step 1: Verify columns exist
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lab_results'
  AND column_name IN ('parent_test_id', 'test_level', 'sub_test_config', 'display_order')
ORDER BY ordinal_position;

-- Step 2: Insert test data - Main Test (CBC)
INSERT INTO public.lab_results (
    main_test_name,
    test_name,
    test_category,
    result_value,
    result_unit,
    reference_range,
    patient_name,
    patient_age,
    patient_gender,
    parent_test_id,
    test_level,
    display_order,
    sub_test_config
) VALUES (
    'CBC',
    'Complete Blood Count',
    'HEMATOLOGY',
    NULL,
    NULL,
    NULL,
    'Test Patient',
    35,
    'Male',
    NULL,  -- No parent (main test)
    0,     -- Level 0 (main test)
    0,
    '{}'::jsonb
) RETURNING id, test_name, test_level, parent_test_id;

-- Note: Copy the returned ID from above and use it as parent_test_id in next queries

-- Step 3: Insert Sub-Test (Hemoglobin) under CBC
-- Replace 'MAIN_TEST_ID_HERE' with actual ID from Step 2
INSERT INTO public.lab_results (
    main_test_name,
    test_name,
    test_category,
    result_value,
    result_unit,
    reference_range,
    patient_name,
    patient_age,
    patient_gender,
    parent_test_id,
    test_level,
    display_order,
    sub_test_config
) VALUES (
    'CBC',
    'Hemoglobin',
    'HEMATOLOGY',
    '{"value": "14.5", "timestamp": "2025-10-01T10:00:00Z"}',
    'g/dL',
    '13-17 g/dL',
    'Test Patient',
    35,
    'Male',
    'MAIN_TEST_ID_HERE'::uuid,  -- Replace with ID from Step 2
    1,  -- Level 1 (sub-test)
    0,
    '{"unit": "g/dL", "ageRanges": [{"id": "ar1", "minAge": "18", "maxAge": "65", "unit": "Years", "description": "Adult"}], "normalRanges": [{"id": "nr1", "ageRange": "18-65 Years", "gender": "Male", "minValue": "13", "maxValue": "17", "unit": "g/dL"}]}'::jsonb
) RETURNING id, test_name, test_level, parent_test_id;

-- Step 4: Insert Nested Sub-Test (HbA1c) under Hemoglobin
-- Replace 'SUB_TEST_ID_HERE' with actual ID from Step 3
INSERT INTO public.lab_results (
    main_test_name,
    test_name,
    test_category,
    result_value,
    result_unit,
    reference_range,
    patient_name,
    patient_age,
    patient_gender,
    parent_test_id,
    test_level,
    display_order,
    sub_test_config
) VALUES (
    'CBC',
    'HbA1c',
    'HEMATOLOGY',
    '{"value": "5.8", "timestamp": "2025-10-01T10:00:00Z"}',
    '%',
    '4-5.6 %',
    'Test Patient',
    35,
    'Male',
    'SUB_TEST_ID_HERE'::uuid,  -- Replace with ID from Step 3
    2,  -- Level 2 (nested sub-test)
    0,
    '{"unit": "%", "ageRanges": [], "normalRanges": [{"id": "nr2", "ageRange": "18-65 Years", "gender": "Both", "minValue": "4", "maxValue": "5.6", "unit": "%"}]}'::jsonb
) RETURNING id, test_name, test_level, parent_test_id;

-- Step 5: Verify hierarchical structure
SELECT
    id,
    test_name,
    test_level,
    parent_test_id,
    result_value,
    result_unit,
    REPEAT('  ', test_level) || test_name as indented_name,
    sub_test_config
FROM public.lab_results
WHERE main_test_name = 'CBC'
ORDER BY test_level, display_order;

-- Step 6: Test recursive query to get all nested tests
WITH RECURSIVE test_hierarchy AS (
    -- Main test
    SELECT
        id,
        parent_test_id,
        test_name,
        test_level,
        result_value,
        result_unit,
        ARRAY[display_order] as path,
        test_name::text as full_path
    FROM lab_results
    WHERE main_test_name = 'CBC' AND parent_test_id IS NULL

    UNION ALL

    -- Nested tests
    SELECT
        lr.id,
        lr.parent_test_id,
        lr.test_name,
        lr.test_level,
        lr.result_value,
        lr.result_unit,
        th.path || lr.display_order,
        (th.full_path || ' > ' || lr.test_name)::text
    FROM lab_results lr
    INNER JOIN test_hierarchy th ON lr.parent_test_id = th.id
)
SELECT
    test_name,
    test_level,
    result_value,
    result_unit,
    full_path
FROM test_hierarchy
ORDER BY path;

-- Step 7: Cleanup test data (optional - run only if you want to delete test data)
-- DELETE FROM public.lab_results WHERE main_test_name = 'CBC' AND patient_name = 'Test Patient';
