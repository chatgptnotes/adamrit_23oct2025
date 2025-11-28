-- ============================================================================
-- INSERT: Following exact screenshot flow
-- ============================================================================
-- Sub-Test: "Differential Leukocyte Count"
--   └─ Nested Sub-Test: "Differential Count" (with Age & Normal Ranges)
-- ============================================================================

-- Step 1: Get your lab_id first
-- SELECT id FROM lab LIMIT 1;
-- Replace 'YOUR_LAB_ID_HERE' below with actual UUID

WITH
-- Insert Level 1: Sub-Test (Differential Leukocyte Count)
sub_test_dlc AS (
    INSERT INTO public.lab_test_config (
        lab_id,
        test_name,
        sub_test_name,
        unit,
        -- Old columns (keep for backward compatibility, set defaults)
        min_age,
        max_age,
        age_unit,
        age_description,
        gender,
        min_value,
        max_value,
        normal_unit,
        -- New hierarchy columns
        parent_config_id,
        test_level,
        display_order,
        is_active,
        -- New JSONB columns for multiple ranges
        age_ranges,
        normal_ranges
    ) VALUES (
        'YOUR_LAB_ID_HERE'::uuid,  -- Replace with actual lab_id
        'CBC',  -- Main test name
        'Differential Leukocyte Count',  -- Sub-test name from screenshot
        'unit',  -- Unit from screenshot
        -- Defaults for old columns
        0, 100, 'Years', NULL, 'Both', 0, 0, 'unit',
        -- Hierarchy
        NULL,  -- No parent (this is direct sub-test under main test)
        1,     -- Level 1 (sub-test)
        0,     -- First item
        true,
        -- Multiple age ranges (empty for parent, nested will have data)
        '[]'::jsonb,
        -- Multiple normal ranges
        '[
            {
                "id": "nr1",
                "ageRange": "- Years",
                "gender": "Both",
                "minValue": "0",
                "maxValue": "0",
                "unit": "unit"
            }
        ]'::jsonb
    ) RETURNING id
),

-- Insert Level 2: Nested Sub-Test (Differential Count)
nested_differential_count AS (
    INSERT INTO public.lab_test_config (
        lab_id,
        test_name,
        sub_test_name,
        unit,
        -- Old columns (defaults)
        min_age,
        max_age,
        age_unit,
        age_description,
        gender,
        min_value,
        max_value,
        normal_unit,
        -- Hierarchy columns
        parent_config_id,
        test_level,
        display_order,
        is_active,
        -- JSONB columns with actual data from screenshot
        age_ranges,
        normal_ranges
    )
    SELECT
        'YOUR_LAB_ID_HERE'::uuid,
        'CBC',
        'Differential Count',  -- Nested sub-test name from screenshot
        '%',  -- Unit from screenshot (e.g. %)
        -- Defaults
        1, 5, 'Years', 'Description', 'Both', 0, 0, '%',
        -- Hierarchy
        id,    -- Parent is "Differential Leukocyte Count"
        2,     -- Level 2 (nested sub-test)
        0,     -- First nested item
        true,
        -- Age ranges from screenshot
        '[
            {
                "id": "ar1",
                "minAge": "1",
                "maxAge": "5",
                "unit": "Years",
                "description": "Description"
            }
        ]'::jsonb,
        -- Normal ranges from screenshot
        '[
            {
                "id": "nr1",
                "ageRange": "- Years- Years",
                "gender": "Both",
                "minValue": "",
                "maxValue": "",
                "unit": "Unit"
            }
        ]'::jsonb
    FROM sub_test_dlc
    RETURNING id
)

SELECT 'Data inserted following screenshot flow!' as status;

-- ============================================================================
-- VERIFY: View hierarchical structure
-- ============================================================================

SELECT
    REPEAT('  ', test_level - 1) || '└─ ' || sub_test_name as hierarchy,
    test_level,
    unit,
    CASE
        WHEN parent_config_id IS NULL THEN 'ROOT SUB-TEST'
        ELSE 'NESTED UNDER PARENT'
    END as type,
    jsonb_array_length(age_ranges) as age_ranges_count,
    jsonb_array_length(normal_ranges) as normal_ranges_count,
    age_ranges,
    normal_ranges
FROM public.lab_test_config
WHERE test_name = 'CBC'
  AND sub_test_name IN ('Differential Leukocyte Count', 'Differential Count')
  AND lab_id = 'YOUR_LAB_ID_HERE'::uuid
ORDER BY test_level, display_order;

-- ============================================================================
-- DETAILED VIEW: Show all ranges
-- ============================================================================

SELECT
    sub_test_name,
    test_level,
    'Age Range ' || (row_number() OVER (PARTITION BY id ORDER BY age_range_data->>'minAge')) as range_label,
    age_range_data->>'minAge' as min_age,
    age_range_data->>'maxAge' as max_age,
    age_range_data->>'unit' as age_unit,
    age_range_data->>'description' as age_description
FROM public.lab_test_config,
     jsonb_array_elements(age_ranges) as age_range_data
WHERE test_name = 'CBC'
  AND lab_id = 'YOUR_LAB_ID_HERE'::uuid
  AND jsonb_array_length(age_ranges) > 0
ORDER BY test_level, sub_test_name;

-- Normal ranges view
SELECT
    sub_test_name,
    test_level,
    'Normal Range ' || (row_number() OVER (PARTITION BY id ORDER BY normal_range_data->>'minValue')) as range_label,
    normal_range_data->>'ageRange' as age_range,
    normal_range_data->>'gender' as gender,
    normal_range_data->>'minValue' as min_value,
    normal_range_data->>'maxValue' as max_value,
    normal_range_data->>'unit' as unit
FROM public.lab_test_config,
     jsonb_array_elements(normal_ranges) as normal_range_data
WHERE test_name = 'CBC'
  AND lab_id = 'YOUR_LAB_ID_HERE'::uuid
  AND jsonb_array_length(normal_ranges) > 0
ORDER BY test_level, sub_test_name;

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- Differential Leukocyte Count (Level 1 - Sub-Test)
--   └─ Differential Count (Level 2 - Nested Sub-Test)
--      - Age Range: 1-5 Years (Description)
--      - Normal Range: - Years- Years, Both, Min: , Max: , Unit
-- ============================================================================

-- Cleanup (uncomment to delete)
-- DELETE FROM public.lab_test_config
-- WHERE test_name = 'CBC'
--   AND sub_test_name IN ('Differential Leukocyte Count', 'Differential Count')
--   AND lab_id = 'YOUR_LAB_ID_HERE'::uuid;
