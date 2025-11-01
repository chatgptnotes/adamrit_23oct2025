-- ============================================
-- STEP 1: FIND EXACT TEST AND SUB-TEST NAMES
-- ============================================
-- Run this FIRST to see exact names in your database

SELECT
  id,
  test_name,
  sub_test_name,
  display_order,
  created_at
FROM lab_test_config
WHERE test_name ILIKE '%CBC%'
   OR test_name ILIKE '%Complete%Blood%'
   OR test_name ILIKE '%blood%count%'
ORDER BY display_order, created_at, id;

-- ============================================
-- Count how many CBC tests exist
-- ============================================
SELECT COUNT(*) as total_cbc_records
FROM lab_test_config
WHERE test_name ILIKE '%CBC%'
   OR test_name ILIKE '%Complete%Blood%'
   OR test_name ILIKE '%blood%count%';

-- ============================================
-- See all unique test_name values
-- ============================================
SELECT DISTINCT test_name
FROM lab_test_config
WHERE test_name ILIKE '%CBC%'
   OR test_name ILIKE '%Complete%Blood%'
   OR test_name ILIKE '%blood%count%';

-- ============================================
-- See all unique sub_test_name values
-- ============================================
SELECT DISTINCT sub_test_name
FROM lab_test_config
WHERE test_name ILIKE '%CBC%'
   OR test_name ILIKE '%Complete%Blood%'
   OR test_name ILIKE '%blood%count%'
ORDER BY sub_test_name;
