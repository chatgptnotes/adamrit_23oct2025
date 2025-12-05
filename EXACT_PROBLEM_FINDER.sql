-- ============================================================================
-- EXACT PROBLEM FINDER - Tell me EXACTLY what's wrong
-- ============================================================================

-- Question 1: Does lab_test_config table exist?
SELECT
    '1. TABLE CHECK' as question,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_test_config')
        THEN '✅ YES - Table exists'
        ELSE '❌ NO - Table does NOT exist'
    END as answer;

-- Question 2: Does lab table have data?
SELECT
    '2. LAB DATA CHECK' as question,
    CASE
        WHEN (SELECT COUNT(*) FROM lab) > 0
        THEN '✅ YES - Lab table has ' || (SELECT COUNT(*) FROM lab)::text || ' records'
        ELSE '❌ NO - Lab table is EMPTY'
    END as answer;

-- Show first lab
SELECT '2a. First Lab:' as info, id, name FROM lab LIMIT 1;

-- Question 3: Which columns exist in lab_test_config?
SELECT
    '3. COLUMNS' as question,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
ORDER BY ordinal_position;

-- Question 4: Does parent_config_id column exist?
SELECT
    '4. PARENT_CONFIG_ID CHECK' as question,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'lab_test_config'
            AND column_name = 'parent_config_id'
        )
        THEN '✅ YES - parent_config_id column exists'
        ELSE '❌ NO - parent_config_id column MISSING'
    END as answer;

-- Question 5: Can we insert basic data?
DO $$
DECLARE
    v_lab_id uuid;
    v_inserted_id uuid;
BEGIN
    -- Get lab_id
    SELECT id INTO v_lab_id FROM lab LIMIT 1;

    IF v_lab_id IS NULL THEN
        RAISE NOTICE '❌ PROBLEM 1: No lab_id found in lab table!';
        RAISE NOTICE 'SOLUTION: Run this first: INSERT INTO lab (name) VALUES (''Test Lab'')';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Found lab_id: %', v_lab_id;

    -- Delete old test
    DELETE FROM lab_test_config WHERE test_name = 'PROBLEM_FINDER';

    -- Try basic insert
    INSERT INTO lab_test_config (
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
        v_lab_id,
        'PROBLEM_FINDER',
        'Basic Test',
        'unit',
        0, 100, 'Years', 'Both', 0, 0
    ) RETURNING id INTO v_inserted_id;

    RAISE NOTICE '✅ SUCCESS: Basic insert works! ID: %', v_inserted_id;

    -- Try insert with parent_config_id
    BEGIN
        INSERT INTO lab_test_config (
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
            v_lab_id,
            'PROBLEM_FINDER',
            'Nested Test',
            'unit',
            0, 100, 'Years', 'Both', 0, 0,
            v_inserted_id,  -- Use parent
            2, 0, true
        );

        RAISE NOTICE '✅ SUCCESS: Nested insert also works!';

    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ PROBLEM 2: Cannot insert with parent_config_id';
        RAISE NOTICE 'Error: %', SQLERRM;
        RAISE NOTICE 'SOLUTION: Run CHECK_AND_ADD_COLUMNS.sql first';
    END;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ PROBLEM 3: Basic insert failed';
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- Question 6: Show what was inserted
SELECT
    '5. INSERTED DATA' as question,
    sub_test_name,
    test_level,
    parent_config_id,
    CASE
        WHEN test_level = 1 THEN '✅ Level 1 (Root)'
        WHEN test_level = 2 AND parent_config_id IS NOT NULL THEN '✅ Level 2 (Nested) - WORKING!'
        ELSE '❌ Problem'
    END as status
FROM lab_test_config
WHERE test_name = 'PROBLEM_FINDER'
ORDER BY test_level;

-- Question 7: Count records
SELECT
    '6. COUNT CHECK' as question,
    COUNT(*) as total,
    COUNT(CASE WHEN test_level = 2 AND parent_config_id IS NOT NULL THEN 1 END) as nested_count,
    CASE
        WHEN COUNT(CASE WHEN test_level = 2 AND parent_config_id IS NOT NULL THEN 1 END) > 0
        THEN '✅ NESTED SUB-TESTS ARE WORKING!'
        ELSE '❌ NO NESTED SUB-TESTS FOUND'
    END as result
FROM lab_test_config
WHERE test_name = 'PROBLEM_FINDER';

-- CLEANUP
-- DELETE FROM lab_test_config WHERE test_name = 'PROBLEM_FINDER';
