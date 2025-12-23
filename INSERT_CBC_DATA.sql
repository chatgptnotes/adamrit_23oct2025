-- Insert CBC sub-tests data
-- Run this SQL in Supabase SQL Editor

-- First, delete any existing CBC entries (to avoid duplicates)
DELETE FROM lab_test_config WHERE test_name = 'CBC (Complete Blood Count)';

-- Insert CBC sub-tests
INSERT INTO lab_test_config (test_name, sub_test_name, unit, min_age, max_age, age_unit, gender, min_value, max_value, normal_unit, display_order, is_active)
VALUES
  ('CBC (Complete Blood Count)', 'Haemoglobin', 'g/dL', 0, 100, 'Years', 'Both', 13.8, 17.2, 'g/dL', 1, true),
  ('CBC (Complete Blood Count)', 'Packed Cell Volume', '%', 0, 100, 'Years', 'Both', 35, 55, '%', 2, true),
  ('CBC (Complete Blood Count)', 'Red Cell Count', 'millions/μL', 0, 100, 'Years', 'Both', 4.0, 6.2, 'millions/μL', 3, true),
  ('CBC (Complete Blood Count)', 'Mean Cell Volume', 'fL', 0, 100, 'Years', 'Both', 76, 96, 'fL', 4, true),
  ('CBC (Complete Blood Count)', 'Mean Cell Haemoglobin', 'pg', 0, 100, 'Years', 'Both', 26, 34, 'pg', 5, true),
  ('CBC (Complete Blood Count)', 'Mean Cell He. Concentration', 'g/dL', 0, 100, 'Years', 'Both', 31, 35.5, 'g/dL', 6, true),
  ('CBC (Complete Blood Count)', 'Total Leukocyte Count', '/μL', 0, 100, 'Years', 'Both', 4000, 11000, '/μL', 7, true),
  ('CBC (Complete Blood Count)', 'Platelet Count', 'lakhs/μL', 0, 100, 'Years', 'Both', 1.5, 4.0, 'lakhs/μL', 8, true),
  ('CBC (Complete Blood Count)', 'E.S.R. (Wintrobe)', 'mm/hr', 0, 100, 'Years', 'Both', 0, 9, 'mm/hr', 9, true),
  ('CBC (Complete Blood Count)', 'Differential Leukocyte Count', '%', 0, 100, 'Years', 'Both', 0, 0, '%', 10, true);

-- Update nested_sub_tests for Differential Leukocyte Count
UPDATE lab_test_config
SET nested_sub_tests = '[
  {"name": "Polymorphs", "unit": "%", "normal_ranges": [{"age_range": "0-100 Years", "gender": "Both", "min_value": 40, "max_value": 75, "unit": "%"}]},
  {"name": "Lymphocyte", "unit": "%", "normal_ranges": [{"age_range": "0-100 Years", "gender": "Both", "min_value": 20, "max_value": 40, "unit": "%"}]},
  {"name": "Eosinophils", "unit": "%", "normal_ranges": [{"age_range": "0-100 Years", "gender": "Both", "min_value": 1, "max_value": 6, "unit": "%"}]},
  {"name": "Monocyte", "unit": "%", "normal_ranges": [{"age_range": "0-100 Years", "gender": "Both", "min_value": 2, "max_value": 8, "unit": "%"}]}
]'::jsonb
WHERE test_name = 'CBC (Complete Blood Count)' AND sub_test_name = 'Differential Leukocyte Count';

-- Verify the data
SELECT test_name, sub_test_name, unit, min_value, max_value, display_order
FROM lab_test_config
WHERE test_name = 'CBC (Complete Blood Count)'
ORDER BY display_order;
