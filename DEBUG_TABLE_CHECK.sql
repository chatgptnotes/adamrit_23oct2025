-- ============================================================================
-- DEBUG: Check if table and columns exist properly
-- ============================================================================

-- Step 1: Check if table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'lab_test_config';

-- Step 2: Check all columns in table
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'lab_test_config'
ORDER BY ordinal_position;

-- Step 3: Check if required columns exist
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_test_config' AND column_name = 'parent_config_id') THEN '✅ parent_config_id exists'
        ELSE '❌ parent_config_id MISSING'
    END as parent_config_id_check,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_test_config' AND column_name = 'test_level') THEN '✅ test_level exists'
        ELSE '❌ test_level MISSING'
    END as test_level_check,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_test_config' AND column_name = 'display_order') THEN '✅ display_order exists'
        ELSE '❌ display_order MISSING'
    END as display_order_check,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_test_config' AND column_name = 'is_active') THEN '✅ is_active exists'
        ELSE '❌ is_active MISSING'
    END as is_active_check;

-- Step 4: Check current data in table
SELECT
    id,
    lab_id,
    test_name,
    sub_test_name,
    test_level,
    parent_config_id,
    is_active,
    created_at
FROM public.lab_test_config
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Check if lab table has data
SELECT id, name FROM lab LIMIT 5;

-- Step 6: Count total records
SELECT
    COUNT(*) as total_records,
    COUNT(CASE WHEN parent_config_id IS NULL THEN 1 END) as root_level_tests,
    COUNT(CASE WHEN parent_config_id IS NOT NULL THEN 1 END) as nested_tests
FROM public.lab_test_config;
