-- ============================================================================
-- COMPLETE DIAGNOSTIC - Find out why data is not saving
-- ============================================================================

-- ========================================
-- DIAGNOSTIC 1: Check Table Exists
-- ========================================
SELECT 'Table Check' as step,
       CASE
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_test_config')
           THEN '✅ Table EXISTS'
           ELSE '❌ Table DOES NOT EXIST'
       END as result;

-- ========================================
-- DIAGNOSTIC 2: Check Columns
-- ========================================
SELECT 'Column Check' as step, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'lab_test_config'
ORDER BY ordinal_position;

-- ========================================
-- DIAGNOSTIC 3: Check Foreign Key (lab_id)
-- ========================================
SELECT 'Lab Table Check' as step,
       COUNT(*) as lab_count,
       CASE
           WHEN COUNT(*) > 0 THEN '✅ Lab table has data'
           ELSE '❌ Lab table is EMPTY - INSERT lab first!'
       END as result
FROM lab;

-- ========================================
-- DIAGNOSTIC 4: Try Insert with Error Handling
-- ========================================
DO $$
DECLARE
    v_lab_id uuid;
    v_error_msg text;
BEGIN
    -- Get lab_id
    SELECT id INTO v_lab_id FROM lab LIMIT 1;

    IF v_lab_id IS NULL THEN
        RAISE EXCEPTION '❌ ERROR: No lab found! Please insert a lab first: INSERT INTO lab (name) VALUES (''Test Lab'')';
    END IF;

    RAISE NOTICE '✅ Found lab_id: %', v_lab_id;

    -- Try insert
    BEGIN
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
            v_lab_id,
            'DIAGNOSTIC_TEST',
            'Test Insert',
            'unit',
            0,
            100,
            'Years',
            'Both',
            0,
            0
        );

        RAISE NOTICE '✅ SUCCESS! Data inserted into lab_test_config';

    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ ERROR during INSERT: %', v_error_msg;
        RAISE EXCEPTION '❌ INSERT FAILED: %', v_error_msg;
    END;
END $$;

-- ========================================
-- DIAGNOSTIC 5: Check if data was inserted
-- ========================================
SELECT 'Insert Verification' as step,
       COUNT(*) as records_inserted,
       CASE
           WHEN COUNT(*) > 0 THEN '✅ Data WAS inserted'
           ELSE '❌ Data was NOT inserted'
       END as result
FROM public.lab_test_config
WHERE test_name = 'DIAGNOSTIC_TEST';

-- ========================================
-- DIAGNOSTIC 6: Show inserted data
-- ========================================
SELECT * FROM public.lab_test_config
WHERE test_name = 'DIAGNOSTIC_TEST'
ORDER BY created_at DESC;

-- ========================================
-- DIAGNOSTIC 7: Check constraints
-- ========================================
SELECT
    'Constraint Check' as step,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'lab_test_config';

-- ========================================
-- DIAGNOSTIC 8: Check RLS (Row Level Security)
-- ========================================
SELECT
    'RLS Check' as step,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'lab_test_config';

-- ========================================
-- CLEANUP (uncomment to remove test data)
-- ========================================
-- DELETE FROM public.lab_test_config WHERE test_name = 'DIAGNOSTIC_TEST';

-- ========================================
-- SUMMARY
-- ========================================
SELECT '========================================' as summary
UNION ALL
SELECT 'DIAGNOSTIC COMPLETE'
UNION ALL
SELECT 'Check results above for errors'
UNION ALL
SELECT 'If you see ✅ SUCCESS, data is saving'
UNION ALL
SELECT 'If you see ❌ ERROR, check the error message'
UNION ALL
SELECT '========================================';
