-- ============================================================================
-- FIXED: Insert nested sub-tests to lab_test_config (Error Fixed)
-- ============================================================================
-- First get actual lab_id from your lab table:
-- SELECT id FROM lab LIMIT 1;
-- Then replace the UUID below with actual value
-- ============================================================================

-- Example with proper UUID casting
WITH
-- Step 1: Insert Hemoglobin (Level 1 sub-test)
hemoglobin AS (
    INSERT INTO public.lab_test_config (
        lab_id,
        test_name,
        sub_test_name,
        unit,
        min_age,
        max_age,
        age_unit,
        age_description,
        gender,
        min_value,
        max_value,
        normal_unit,
        parent_config_id,
        test_level,
        display_order,
        is_active
    ) VALUES (
        '00000000-0000-0000-0000-000000000001'::uuid,  -- Replace with actual lab_id
        'CBC',
        'Hemoglobin',
        'g/dL',
        18,
        65,
        'Years',
        'Adult Male',
        'Male',
        13.0,
        17.0,
        'g/dL',
        NULL,
        1,
        0,
        true
    ) RETURNING id
),

-- Step 2: Insert HbA1c (Level 2 - nested under Hemoglobin)
hba1c AS (
    INSERT INTO public.lab_test_config (
        lab_id,
        test_name,
        sub_test_name,
        unit,
        min_age,
        max_age,
        age_unit,
        age_description,
        gender,
        min_value,
        max_value,
        normal_unit,
        parent_config_id,
        test_level,
        display_order,
        is_active
    )
    SELECT
        '00000000-0000-0000-0000-000000000001'::uuid,
        'CBC',
        'HbA1c',
        '%',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        4.0,
        5.6,
        '%',
        id,
        2,
        0,
        true
    FROM hemoglobin
    RETURNING id
),

-- Step 3: Insert HbA2 (Level 2 - nested under Hemoglobin)
hba2 AS (
    INSERT INTO public.lab_test_config (
        lab_id,
        test_name,
        sub_test_name,
        unit,
        min_age,
        max_age,
        age_unit,
        age_description,
        gender,
        min_value,
        max_value,
        normal_unit,
        parent_config_id,
        test_level,
        display_order,
        is_active
    )
    SELECT
        '00000000-0000-0000-0000-000000000001'::uuid,
        'CBC',
        'HbA2',
        '%',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        2.0,
        3.5,
        '%',
        id,
        2,
        1,
        true
    FROM hemoglobin
    RETURNING id
),

-- Step 4: Insert WBC Count (Level 1 sub-test)
wbc AS (
    INSERT INTO public.lab_test_config (
        lab_id,
        test_name,
        sub_test_name,
        unit,
        min_age,
        max_age,
        age_unit,
        age_description,
        gender,
        min_value,
        max_value,
        normal_unit,
        parent_config_id,
        test_level,
        display_order,
        is_active
    ) VALUES (
        '00000000-0000-0000-0000-000000000001'::uuid,
        'CBC',
        'WBC Count',
        'cells/μL',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        4000,
        11000,
        'cells/μL',
        NULL,
        1,
        1,
        true
    ) RETURNING id
),

-- Step 5: Insert Neutrophils (Level 2 - nested under WBC)
neutrophils AS (
    INSERT INTO public.lab_test_config (
        lab_id,
        test_name,
        sub_test_name,
        unit,
        min_age,
        max_age,
        age_unit,
        age_description,
        gender,
        min_value,
        max_value,
        normal_unit,
        parent_config_id,
        test_level,
        display_order,
        is_active
    )
    SELECT
        '00000000-0000-0000-0000-000000000001'::uuid,
        'CBC',
        'Neutrophils',
        '%',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        40,
        70,
        '%',
        id,
        2,
        0,
        true
    FROM wbc
    RETURNING id
)

-- Summary
SELECT 'Nested test configurations inserted successfully!' as status;

-- ============================================================================
-- VERIFY: View the hierarchical structure
-- ============================================================================

SELECT
    REPEAT('  ', test_level - 1) || '└─ ' || sub_test_name as hierarchy,
    test_level,
    unit,
    min_value || '-' || max_value || ' ' || normal_unit as normal_range,
    gender,
    age_description
FROM public.lab_test_config
WHERE test_name = 'CBC'
  AND lab_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND is_active = true
ORDER BY display_order, test_level;
