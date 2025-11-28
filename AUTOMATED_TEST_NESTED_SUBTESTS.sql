-- ============================================================================
-- AUTOMATED TEST: Complete Nested Sub-Tests Save & Retrieve
-- ============================================================================
-- Run this entire query in Supabase SQL Editor to test nested sub-tests
-- ============================================================================

-- Cleanup any previous test data
DELETE FROM public.lab_results WHERE patient_name = 'TEST_PATIENT_NESTED';

-- Create temporary variables using WITH clause
WITH
-- Insert Main Test (CBC)
main_test AS (
    INSERT INTO public.lab_results (
        main_test_name,
        test_name,
        test_category,
        result_value,
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
        'TEST_PATIENT_NESTED',
        35,
        'Male',
        NULL,
        0,
        0,
        '{}'::jsonb
    ) RETURNING id AS main_test_id
),

-- Insert Sub-Test 1: Hemoglobin
sub_test_hb AS (
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
    )
    SELECT
        'CBC',
        'Hemoglobin',
        'HEMATOLOGY',
        '{"value": "14.5", "timestamp": "' || NOW() || '"}'::text,
        'g/dL',
        '13-17 g/dL',
        'TEST_PATIENT_NESTED',
        35,
        'Male',
        main_test_id,
        1,
        0,
        '{"unit": "g/dL", "ageRanges": [{"id": "ar1", "minAge": "18", "maxAge": "65", "unit": "Years", "description": "Adult"}], "normalRanges": [{"id": "nr1", "ageRange": "18-65 Years", "gender": "Male", "minValue": "13", "maxValue": "17", "unit": "g/dL"}]}'::jsonb
    FROM main_test
    RETURNING id AS hb_test_id
),

-- Insert Nested Sub-Test: HbA1c under Hemoglobin
nested_hba1c AS (
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
    )
    SELECT
        'CBC',
        'HbA1c',
        'HEMATOLOGY',
        '{"value": "5.8", "timestamp": "' || NOW() || '"}'::text,
        '%',
        '4-5.6 %',
        'TEST_PATIENT_NESTED',
        35,
        'Male',
        hb_test_id,
        2,
        0,
        '{"unit": "%", "ageRanges": [], "normalRanges": [{"id": "nr2", "ageRange": "18-65 Years", "gender": "Both", "minValue": "4", "maxValue": "5.6", "unit": "%"}]}'::jsonb
    FROM sub_test_hb
    RETURNING id AS hba1c_test_id
),

-- Insert Sub-Test 2: WBC Count
sub_test_wbc AS (
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
    )
    SELECT
        'CBC',
        'WBC Count',
        'HEMATOLOGY',
        '{"value": "8000", "timestamp": "' || NOW() || '"}'::text,
        'cells/μL',
        '4000-11000 cells/μL',
        'TEST_PATIENT_NESTED',
        35,
        'Male',
        main_test_id,
        1,
        1,
        '{"unit": "cells/μL", "ageRanges": [], "normalRanges": [{"id": "nr3", "ageRange": "18-65 Years", "gender": "Both", "minValue": "4000", "maxValue": "11000", "unit": "cells/μL"}]}'::jsonb
    FROM main_test
    RETURNING id AS wbc_test_id
),

-- Insert Nested Sub-Test: Neutrophils under WBC
nested_neutrophils AS (
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
    )
    SELECT
        'CBC',
        'Neutrophils',
        'HEMATOLOGY',
        '{"value": "60", "timestamp": "' || NOW() || '"}'::text,
        '%',
        '40-70 %',
        'TEST_PATIENT_NESTED',
        35,
        'Male',
        wbc_test_id,
        2,
        0,
        '{"unit": "%", "ageRanges": [], "normalRanges": [{"id": "nr4", "ageRange": "18-65 Years", "gender": "Both", "minValue": "40", "maxValue": "70", "unit": "%"}]}'::jsonb
    FROM sub_test_wbc
    RETURNING id AS neutrophils_test_id
)

-- Display summary of inserted records
SELECT
    'Test data inserted successfully!' as status,
    (SELECT COUNT(*) FROM public.lab_results WHERE patient_name = 'TEST_PATIENT_NESTED') as total_records_inserted;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Simple hierarchical view
SELECT
    REPEAT('  ', test_level) || '└─ ' || test_name as test_hierarchy,
    test_level,
    result_value::jsonb->>'value' as observed_value,
    result_unit,
    reference_range,
    CASE
        WHEN parent_test_id IS NULL THEN 'MAIN TEST'
        ELSE 'ID: ' || parent_test_id::text
    END as parent_info
FROM public.lab_results
WHERE patient_name = 'TEST_PATIENT_NESTED'
ORDER BY
    COALESCE(parent_test_id::text, '00000000-0000-0000-0000-000000000000'),
    test_level,
    display_order;

-- Query 2: Recursive tree structure
WITH RECURSIVE test_tree AS (
    -- Root level
    SELECT
        id,
        parent_test_id,
        test_name,
        test_level,
        result_value::jsonb->>'value' as observed_value,
        result_unit,
        reference_range,
        test_name::text as full_path,
        ARRAY[test_name] as path_array,
        1 as depth
    FROM lab_results
    WHERE patient_name = 'TEST_PATIENT_NESTED'
      AND parent_test_id IS NULL

    UNION ALL

    -- Child levels
    SELECT
        lr.id,
        lr.parent_test_id,
        lr.test_name,
        lr.test_level,
        lr.result_value::jsonb->>'value',
        lr.result_unit,
        lr.reference_range,
        tt.full_path || ' → ' || lr.test_name,
        tt.path_array || lr.test_name,
        tt.depth + 1
    FROM lab_results lr
    INNER JOIN test_tree tt ON lr.parent_test_id = tt.id
    WHERE lr.patient_name = 'TEST_PATIENT_NESTED'
)
SELECT
    REPEAT('  ', depth - 1) || test_name as indented_test_name,
    test_level,
    observed_value,
    result_unit,
    reference_range,
    full_path
FROM test_tree
ORDER BY path_array;

-- Query 3: JSON structure with sub_test_config
SELECT
    test_name,
    test_level,
    sub_test_config->>'unit' as config_unit,
    jsonb_array_length(COALESCE(sub_test_config->'normalRanges', '[]'::jsonb)) as normal_ranges_count,
    jsonb_array_length(COALESCE(sub_test_config->'ageRanges', '[]'::jsonb)) as age_ranges_count
FROM public.lab_results
WHERE patient_name = 'TEST_PATIENT_NESTED'
ORDER BY test_level, display_order;

-- ============================================================================
-- Expected Output Structure:
-- ============================================================================
-- Complete Blood Count (Level 0)
--   └─ Hemoglobin (Level 1) → 14.5 g/dL
--       └─ HbA1c (Level 2) → 5.8 %
--   └─ WBC Count (Level 1) → 8000 cells/μL
--       └─ Neutrophils (Level 2) → 60 %
-- ============================================================================

-- Cleanup (uncomment to delete test data)
-- DELETE FROM public.lab_results WHERE patient_name = 'TEST_PATIENT_NESTED';
