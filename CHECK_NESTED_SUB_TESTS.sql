-- Check if nested sub-tests are saved in database
SELECT
  id,
  test_name,
  sub_test_name,
  unit,
  nested_sub_tests,
  jsonb_array_length(nested_sub_tests) as nested_count
FROM public.lab_test_config
WHERE test_name = 'CBC'
ORDER BY sub_test_name;

-- Check specifically for Differential Leukocyte Count
SELECT
  test_name,
  sub_test_name,
  nested_sub_tests
FROM public.lab_test_config
WHERE sub_test_name = 'Differential Leukocyte Count'
  AND test_name = 'CBC';
