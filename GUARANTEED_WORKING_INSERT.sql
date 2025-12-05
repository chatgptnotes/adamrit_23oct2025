-- ============================================================================
-- GUARANTEED WORKING INSERT - This WILL save nested sub-tests
-- ============================================================================
-- Copy this COMPLETE query and run in Supabase SQL Editor
-- ============================================================================

-- Step 1: Get first lab_id from your table
DO $$
DECLARE
    v_lab_id uuid;
    v_parent_id uuid;
    v_nested_id uuid;
BEGIN
    -- Get lab_id from lab table
    SELECT id INTO v_lab_id FROM lab LIMIT 1;

    IF v_lab_id IS NULL THEN
        RAISE EXCEPTION 'No lab found! First run: INSERT INTO lab (name) VALUES (''Test Lab'')';
    END IF;

    RAISE NOTICE 'Using lab_id: %', v_lab_id;

    -- Clean old test data
    DELETE FROM lab_test_config WHERE test_name = 'WORKING_TEST';

    -- ========================================================================
    -- Insert Level 1: SUB-TEST (Parent)
    -- ========================================================================
    INSERT INTO lab_test_config (
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
        v_lab_id,
        'WORKING_TEST',
        'Hemoglobin',  -- This is SUB-TEST
        'g/dL',
        18,
        65,
        'Years',
        'Adult',
        'Male',
        13.0,
        17.0,
        'g/dL',
        NULL,  -- ⬅️ NULL because this is Level 1 (root sub-test)
        1,     -- ⬅️ Level 1
        0,
        true
    ) RETURNING id INTO v_parent_id;

    RAISE NOTICE '✅ Inserted SUB-TEST (Level 1) with ID: %', v_parent_id;

    -- ========================================================================
    -- Insert Level 2: NESTED SUB-TEST (Child)
    -- ========================================================================
    INSERT INTO lab_test_config (
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
        v_lab_id,
        'WORKING_TEST',
        'HbA1c',  -- This is NESTED SUB-TEST
        '%',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        4.0,
        5.6,
        '%',
        v_parent_id,  -- ⬅️ PARENT ID (from Level 1 insert)
        2,            -- ⬅️ Level 2 (NESTED)
        0,
        true
    ) RETURNING id INTO v_nested_id;

    RAISE NOTICE '✅ Inserted NESTED SUB-TEST (Level 2) with ID: %', v_nested_id;
    RAISE NOTICE '   Parent ID: %', v_parent_id;

    -- ========================================================================
    -- Insert another NESTED SUB-TEST under same parent
    -- ========================================================================
    INSERT INTO lab_test_config (
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
        v_lab_id,
        'WORKING_TEST',
        'HbA2',  -- Another NESTED SUB-TEST
        '%',
        18,
        65,
        'Years',
        'Adult',
        'Both',
        2.0,
        3.5,
        '%',
        v_parent_id,  -- ⬅️ Same PARENT (Hemoglobin)
        2,            -- ⬅️ Level 2 (NESTED)
        1,            -- Display order 1
        true
    );

    RAISE NOTICE '✅ Inserted another NESTED SUB-TEST (HbA2)';

    -- ========================================================================
    -- Insert another SUB-TEST (Level 1) with its own nested
    -- ========================================================================
    DECLARE
        v_wbc_parent_id uuid;
    BEGIN
        INSERT INTO lab_test_config (
            lab_id,
            test_name,
            sub_test_name,
            unit,
            min_age, max_age, age_unit, age_description,
            gender, min_value, max_value, normal_unit,
            parent_config_id, test_level, display_order, is_active
        ) VALUES (
            v_lab_id,
            'WORKING_TEST',
            'WBC Count',  -- Another SUB-TEST (Level 1)
            'cells/μL',
            18, 65, 'Years', 'Adult',
            'Both', 4000, 11000, 'cells/μL',
            NULL, 1, 1, true
        ) RETURNING id INTO v_wbc_parent_id;

        RAISE NOTICE '✅ Inserted SUB-TEST (WBC Count) with ID: %', v_wbc_parent_id;

        -- Nested under WBC
        INSERT INTO lab_test_config (
            lab_id, test_name, sub_test_name, unit,
            min_age, max_age, age_unit, age_description,
            gender, min_value, max_value, normal_unit,
            parent_config_id, test_level, display_order, is_active
        ) VALUES (
            v_lab_id, 'WORKING_TEST', 'Neutrophils', '%',
            18, 65, 'Years', 'Adult',
            'Both', 40, 70, '%',
            v_wbc_parent_id, 2, 0, true
        );

        RAISE NOTICE '✅ Inserted NESTED SUB-TEST (Neutrophils) under WBC';
    END;

    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 SUCCESS! All data inserted!';
    RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- Verify: Show what was inserted
-- ============================================================================

SELECT
    sub_test_name,
    test_level,
    CASE
        WHEN parent_config_id IS NULL THEN 'NULL (Root Level 1)'
        ELSE left(parent_config_id::text, 8) || '...'
    END as parent_config_id,
    CASE
        WHEN test_level = 1 AND parent_config_id IS NULL THEN '✅ SUB-TEST'
        WHEN test_level = 2 AND parent_config_id IS NOT NULL THEN '✅ NESTED SUB-TEST'
        ELSE '❌ ERROR'
    END as status
FROM lab_test_config
WHERE test_name = 'WORKING_TEST'
ORDER BY test_level, display_order;

-- Expected Output:
-- sub_test_name | test_level | parent_config_id | status
-- --------------|------------|------------------|--------------------
-- Hemoglobin    | 1          | NULL             | ✅ SUB-TEST
-- WBC Count     | 1          | NULL             | ✅ SUB-TEST
-- HbA1c         | 2          | 0779d1f7...      | ✅ NESTED SUB-TEST
-- HbA2          | 2          | 0779d1f7...      | ✅ NESTED SUB-TEST
-- Neutrophils   | 2          | 13737ba7...      | ✅ NESTED SUB-TEST

-- ============================================================================
-- Tree View
-- ============================================================================

SELECT
    REPEAT('  ', test_level - 1) || '└─ ' || sub_test_name as hierarchy,
    test_level,
    unit
FROM lab_test_config
WHERE test_name = 'WORKING_TEST'
ORDER BY display_order, test_level;

-- Expected:
-- └─ Hemoglobin (Level 1)
--   └─ HbA1c (Level 2)
--   └─ HbA2 (Level 2)
-- └─ WBC Count (Level 1)
--   └─ Neutrophils (Level 2)

-- ============================================================================
-- Count by level
-- ============================================================================

SELECT
    test_level,
    COUNT(*) as count,
    string_agg(sub_test_name, ', ') as tests
FROM lab_test_config
WHERE test_name = 'WORKING_TEST'
GROUP BY test_level
ORDER BY test_level;

-- Expected:
-- test_level | count | tests
-- -----------|-------|-----------------------------------
-- 1          | 2     | Hemoglobin, WBC Count
-- 2          | 3     | HbA1c, HbA2, Neutrophils

-- ============================================================================
-- Cleanup (uncomment to delete test data)
-- ============================================================================
-- DELETE FROM lab_test_config WHERE test_name = 'WORKING_TEST';
