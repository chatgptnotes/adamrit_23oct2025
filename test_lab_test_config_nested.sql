-- ============================================================================
-- TEST: Insert nested sub-tests into lab_test_config table
-- ============================================================================
-- Structure:
--   CBC (Main Test)
--     ├─ Hemoglobin (Sub-test, Level 1)
--     │   ├─ HbA1c (Nested, Level 2)
--     │   └─ HbA2 (Nested, Level 2)
--     └─ WBC Count (Sub-test, Level 1)
--         ├─ Neutrophils (Nested, Level 2)
--         └─ Lymphocytes (Nested, Level 2)
-- ============================================================================

-- First, you need a lab_id. Get it from lab table or use a test UUID
-- For testing, we'll use a placeholder. Replace with actual lab_id

-- Cleanup previous test data
DELETE FROM public.lab_test_config
WHERE test_name = 'CBC_TEST' AND sub_test_name LIKE '%_TEST%';

-- Insert test configurations with nested structure
WITH
-- Sub-test 1: Hemoglobin (Level 1)
hemoglobin_config AS (
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
        'CBC_TEST',
        'Hemoglobin_TEST',
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
        0,     -- First item
        true
    ) RETURNING id as hb_id
),

-- Nested sub-test 1.1: HbA1c under Hemoglobin (Level 2)
hba1c_config AS (
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
        'CBC_TEST',
        'HbA1c_TEST',
        '%',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        4.0,
        5.6,
        '%',
        hb_id,  -- Parent is Hemoglobin
        2,      -- Level 2
        0,
        true
    FROM hemoglobin_config
    RETURNING id as hba1c_id
),

-- Nested sub-test 1.2: HbA2 under Hemoglobin (Level 2)
hba2_config AS (
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
        'CBC_TEST',
        'HbA2_TEST',
        '%',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        2.0,
        3.5,
        '%',
        hb_id,  -- Parent is Hemoglobin
        2,      -- Level 2
        1,      -- Second item
        true
    FROM hemoglobin_config
    RETURNING id as hba2_id
),

-- Sub-test 2: WBC Count (Level 1)
wbc_config AS (
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
        'CBC_TEST',
        'WBC_Count_TEST',
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
        1,     -- Second item
        true
    ) RETURNING id as wbc_id
),

-- Nested sub-test 2.1: Neutrophils under WBC (Level 2)
neutrophils_config AS (
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
        'CBC_TEST',
        'Neutrophils_TEST',
        '%',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        40,
        70,
        '%',
        wbc_id,  -- Parent is WBC Count
        2,       -- Level 2
        0,
        true
    FROM wbc_config
    RETURNING id as neutrophils_id
),

-- Nested sub-test 2.2: Lymphocytes under WBC (Level 2)
lymphocytes_config AS (
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
        'CBC_TEST',
        'Lymphocytes_TEST',
        '%',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        20,
        40,
        '%',
        wbc_id,  -- Parent is WBC Count
        2,       -- Level 2
        1,       -- Second item
        true
    FROM wbc_config
    RETURNING id as lymphocytes_id
)

SELECT 'Test configurations inserted successfully!' as status;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query 1: View hierarchical structure
SELECT
    REPEAT('  ', test_level - 1) || '└─ ' || sub_test_name as hierarchy,
    test_level,
    unit,
    min_value || '-' || max_value || ' ' || normal_unit as normal_range,
    age_description,
    CASE
        WHEN parent_config_id IS NULL THEN 'ROOT SUB-TEST'
        ELSE 'NESTED'
    END as type
FROM public.lab_test_config
WHERE test_name = 'CBC_TEST'
  AND is_active = true
ORDER BY display_order, test_level;

-- Query 2: Recursive tree view
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
    WHERE test_name = 'CBC_TEST'
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

-- Query 3: Count by level
SELECT
    test_level,
    COUNT(*) as config_count,
    string_agg(sub_test_name, ', ') as test_names
FROM public.lab_test_config
WHERE test_name = 'CBC_TEST'
  AND is_active = true
GROUP BY test_level
ORDER BY test_level;

-- ============================================================================
-- Expected Output:
-- ============================================================================
-- Hemoglobin_TEST (Level 1)
--   └─ HbA1c_TEST (Level 2)
--   └─ HbA2_TEST (Level 2)
-- WBC_Count_TEST (Level 1)
--   └─ Neutrophils_TEST (Level 2)
--   └─ Lymphocytes_TEST (Level 2)
-- ============================================================================

-- Cleanup (uncomment to delete test data)
-- DELETE FROM public.lab_test_config WHERE test_name = 'CBC_TEST';
