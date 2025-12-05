-- Check nested sub-tests units in database
SELECT
  test_name,
  sub_test_name,
  nested_sub_tests
FROM public.lab_test_config
WHERE test_name = 'CBC'
  AND sub_test_name = 'Differential Leukocyte Count';

-- This should show nested_sub_tests JSONB with structure like:
-- [
--   {"name": "Eosinophills", "unit": "%", "age_ranges": [...], "normal_ranges": [...]},
--   {"name": "Monocyte", "unit": "%", ...},
--   ...
-- ]
