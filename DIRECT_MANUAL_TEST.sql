-- ============================================================================
-- DIRECT MANUAL TEST - Manually test if nested sub-test saves
-- ============================================================================
-- Run each section one by one and check results
-- ============================================================================

-- ========================================
-- SECTION 1: Cleanup old test data
-- ========================================
DELETE FROM public.lab_test_config WHERE test_name = 'MANUAL_TEST';

-- ========================================
-- SECTION 2: Get lab_id (MUST HAVE DATA)
-- ========================================
SELECT id, name FROM lab LIMIT 5;

-- If no data above, create test lab:
-- INSERT INTO lab (name) VALUES ('Test Lab') RETURNING id;

-- Copy one lab_id from above, for example: 12345678-1234-1234-1234-123456789012

-- ========================================
-- SECTION 3: Insert SUB-TEST (Level 1)
-- ========================================
-- Replace YOUR_LAB_ID below with actual lab_id from Section 2

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
    'YOUR_LAB_ID'::uuid,  -- ⬅️ REPLACE THIS
    'MANUAL_TEST',
    'Parent Sub-Test',
    'g/dL',
    0,
    100,
    'Years',
    'All Ages',
    'Both',
    10.0,
    20.0,
    'g/dL',
    NULL,  -- No parent
    1,     -- Level 1
    0,
    true
)
RETURNING
    id as parent_id,
    test_name,
    sub_test_name,
    test_level,
    parent_config_id,
    '✅ SUB-TEST INSERTED!' as status;

-- ⚠️ COPY the returned "parent_id" from above!
-- For example: 87654321-4321-4321-4321-210987654321

-- ========================================
-- SECTION 4: Verify SUB-TEST was saved
-- ========================================
SELECT
    id,
    sub_test_name,
    test_level,
    parent_config_id,
    'This should show Level 1 with NULL parent' as note
FROM public.lab_test_config
WHERE test_name = 'MANUAL_TEST'
  AND test_level = 1;

-- If no data shows above, SUB-TEST did not save!
-- Check error messages in Supabase

-- ========================================
-- SECTION 5: Insert NESTED SUB-TEST (Level 2)
-- ========================================
-- Replace:
-- - YOUR_LAB_ID with lab_id from Section 2
-- - YOUR_PARENT_ID with id returned from Section 3

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
    'YOUR_LAB_ID'::uuid,       -- ⬅️ REPLACE THIS (same as Section 3)
    'MANUAL_TEST',
    'Nested Sub-Test',          -- This is nested
    '%',
    1,
    5,
    'Years',
    'Child',
    'Both',
    40.0,
    70.0,
    '%',
    'YOUR_PARENT_ID'::uuid,    -- ⬅️ REPLACE THIS (parent_id from Section 3)
    2,                          -- Level 2 (NESTED)
    0,
    true
)
RETURNING
    id as nested_id,
    test_name,
    sub_test_name,
    test_level,
    parent_config_id,
    '✅ NESTED SUB-TEST INSERTED!' as status;

-- ========================================
-- SECTION 6: Verify BOTH tests saved
-- ========================================
SELECT
    id,
    sub_test_name,
    test_level,
    parent_config_id,
    CASE
        WHEN test_level = 1 AND parent_config_id IS NULL THEN '✅ SUB-TEST (Level 1)'
        WHEN test_level = 2 AND parent_config_id IS NOT NULL THEN '✅ NESTED SUB-TEST (Level 2)'
        ELSE '❌ UNEXPECTED'
    END as status
FROM public.lab_test_config
WHERE test_name = 'MANUAL_TEST'
ORDER BY test_level;

-- Expected output:
-- Row 1: Parent Sub-Test | Level 1 | NULL        | ✅ SUB-TEST
-- Row 2: Nested Sub-Test | Level 2 | <parent_id> | ✅ NESTED SUB-TEST

-- ========================================
-- SECTION 7: Tree view (if both saved)
-- ========================================
SELECT
    REPEAT('  ', test_level - 1) || '└─ ' || sub_test_name as hierarchy,
    test_level,
    unit,
    min_value || '-' || max_value || ' ' || normal_unit as range
FROM public.lab_test_config
WHERE test_name = 'MANUAL_TEST'
ORDER BY test_level, display_order;

-- Expected output:
-- └─ Parent Sub-Test (Level 1)
--   └─ Nested Sub-Test (Level 2)

-- ========================================
-- SECTION 8: Count results
-- ========================================
SELECT
    COUNT(*) as total_rows,
    COUNT(CASE WHEN test_level = 1 THEN 1 END) as level_1_count,
    COUNT(CASE WHEN test_level = 2 THEN 1 END) as level_2_count,
    CASE
        WHEN COUNT(*) = 2 AND COUNT(CASE WHEN test_level = 2 THEN 1 END) = 1
        THEN '✅ SUCCESS! Both sub-test and nested sub-test saved!'
        ELSE '❌ FAILED! Data not saved correctly'
    END as result
FROM public.lab_test_config
WHERE test_name = 'MANUAL_TEST';

-- ========================================
-- CLEANUP (run only if you want to delete test data)
-- ========================================
-- DELETE FROM public.lab_test_config WHERE test_name = 'MANUAL_TEST';

-- ========================================
-- TROUBLESHOOTING
-- ========================================
-- If SECTION 3 fails:
-- 1. Check if lab table has data: SELECT * FROM lab;
-- 2. Check if you replaced YOUR_LAB_ID correctly
-- 3. Check error message in Supabase

-- If SECTION 5 fails:
-- 1. Check if SECTION 3 succeeded first
-- 2. Check if you copied parent_id correctly from SECTION 3
-- 3. Make sure parent_config_id column exists: SELECT column_name FROM information_schema.columns WHERE table_name = 'lab_test_config' AND column_name = 'parent_config_id';
