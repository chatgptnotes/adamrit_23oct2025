-- Check ALL CBC records including nested sub-tests
SELECT
  sub_test_name,
  display_order,
  parent_test,
  id
FROM lab_test_config
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY display_order, id;

-- Count total
SELECT COUNT(*) as total
FROM lab_test_config
WHERE test_name = 'CBC(Complete Blood Count)';
