-- ============================================================================
-- INSERT TEST: Save nested sub-tests to lab_test_config
-- ============================================================================
-- Replace 'YOUR_LAB_ID' with actual lab ID from lab table
-- ============================================================================

-- First, get a lab_id (or create one for testing)
-- SELECT id FROM lab LIMIT 1;

-- Example: Insert CBC test with nested sub-tests
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
        'YOUR_LAB_ID'::uuid,  -- Replace with actual lab_id
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
        NULL,  -- No parent (direct sub-test)
        1,     -- Level 1
        0,     -- First sub-test
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
        'YOUR_LAB_ID'::uuid,
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
        id,    -- Parent is Hemoglobin
        2,     -- Level 2 (nested)
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
        'YOUR_LAB_ID'::uuid,
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
        id,    -- Parent is Hemoglobin
        2,     -- Level 2 (nested)
        1,     -- Second nested item
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
        'YOUR_LAB_ID'::uuid,
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
        NULL,  -- No parent (direct sub-test)
        1,     -- Level 1
        1,     -- Second sub-test
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
        'YOUR_LAB_ID'::uuid,
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
        id,    -- Parent is WBC Count
        2,     -- Level 2 (nested)
        0,
        true
    FROM wbc
    RETURNING id
)

-- Summary
SELECT
    'Nested test configurations inserted successfully!' as status,
    (SELECT COUNT(*) FROM lab_test_config WHERE test_name = 'CBC' AND lab_id = 'YOUR_LAB_ID'::uuid) as total_configs;

-- ============================================================================
-- VERIFY: View the hierarchical structure
-- ============================================================================

SELECT
    REPEAT('  ', test_level - 1) || '└─ ' || sub_test_name as hierarchy,
    test_level,
    unit,
    min_value || '-' || max_value || ' ' || normal_unit as normal_range,
    gender,
    age_description,
    CASE
        WHEN parent_config_id IS NULL THEN 'ROOT SUB-TEST'
        ELSE 'NESTED UNDER: ' || parent_config_id::text
    END as parent_info
FROM public.lab_test_config
WHERE test_name = 'CBC'
  AND lab_id = 'YOUR_LAB_ID'::uuid
  AND is_active = true
ORDER BY display_order, test_level;

-- ============================================================================
-- RECURSIVE QUERY: Show full hierarchy with paths
-- ============================================================================

WITH RECURSIVE config_tree AS (
    -- Root level
    SELECT
        id,
        parent_config_id,
        sub_test_name,
        test_level,
        unit,
        min_value,
        max_value,
        normal_unit,
        sub_test_name::text as full_path,
        ARRAY[display_order] as path
    FROM lab_test_config
    WHERE test_name = 'CBC'
      AND lab_id = 'YOUR_LAB_ID'::uuid
      AND parent_config_id IS NULL
      AND is_active = true

    UNION ALL

    -- Child levels
    SELECT
        ltc.id,
        ltc.parent_config_id,
        ltc.sub_test_name,
        ltc.test_level,
        ltc.unit,
        ltc.min_value,
        ltc.max_value,
        ltc.normal_unit,
        ct.full_path || ' → ' || ltc.sub_test_name,
        ct.path || ltc.display_order
    FROM lab_test_config ltc
    INNER JOIN config_tree ct ON ltc.parent_config_id = ct.id
    WHERE ltc.is_active = true
)
SELECT
    sub_test_name,
    test_level,
    min_value || '-' || max_value || ' ' || normal_unit as range,
    full_path
FROM config_tree
ORDER BY path;

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- Hemoglobin (Level 1) → 13-17 g/dL
--   └─ HbA1c (Level 2) → 4-5.6 %
--   └─ HbA2 (Level 2) → 2-3.5 %
-- WBC Count (Level 1) → 4000-11000 cells/μL
--   └─ Neutrophils (Level 2) → 40-70 %
-- ============================================================================

-- Cleanup (uncomment to delete)
-- DELETE FROM public.lab_test_config WHERE test_name = 'CBC' AND lab_id = 'YOUR_LAB_ID'::uuid;
