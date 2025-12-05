-- Insert CBC test data exactly as shown in Screenshot 2025-10-03 164012.png
-- This will create the complete test structure with all ranges

-- Get lab_id (replace with your actual lab_id)
-- You can find it by running: SELECT id FROM lab WHERE name = 'Your Lab Name';

-- First, delete existing CBC data for this lab
DELETE FROM lab_test_config WHERE test_name = 'CBC' AND lab_id = '0a4abbbe-9029-427a-9e5f-e874ee87968f';

-- Insert all sub-tests with their ranges
INSERT INTO lab_test_config (
  lab_id, test_name, sub_test_name, unit,
  min_age, max_age, age_unit,
  gender, min_value, max_value, normal_unit,
  test_level, display_order, is_active,
  nested_sub_tests
) VALUES
-- Packed Cell Volume
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'Packed Cell Volume', 'unit',
 0, 100, 'Years',
 'Both', 35, 55, 'unit',
 1, 1, true, '[]'::jsonb),

-- Mean Cell Volume
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'Mean Cell Volume', 'unit',
 0, 100, 'Years',
 'Both', 76, 96, 'unit',
 1, 2, true, '[]'::jsonb),

-- Haemoglobin
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'Haemoglobin', 'unit',
 0, 100, 'Years',
 'Both', 13.8, 17.2, 'unit',
 1, 3, true, '[]'::jsonb),

-- Mean Cell Haemoglobin
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'Mean Cell Haemoglobin', 'unit',
 0, 100, 'Years',
 'Both', 26, 34, 'unit',
 1, 4, true, '[]'::jsonb),

-- E.S.R. (Wintrobe)
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'E.S.R. (Wintrobe)', 'unit',
 0, 100, 'Years',
 'Both', 0, 9, 'unit',
 1, 5, true, '[]'::jsonb),

-- Total Leukocyte Count
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'Total Leukocyte Count', 'unit',
 0, 100, 'Years',
 'Both', 4000, 11000, 'unit',
 1, 6, true, '[]'::jsonb),

-- Mean Cell He.Concentration
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'Mean Cell He.Concentration', 'unit',
 0, 100, 'Years',
 'Both', 31, 35.5, 'unit',
 1, 7, true, '[]'::jsonb),

-- Differential Leukocyte Count (Parent with nested sub-tests)
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'Differential Leukocyte Count', 'unit',
 0, 100, 'Years',
 'Both', 0, 0, 'unit',
 1, 8, true,
 '[
   {"name": "Eosinophills", "unit": "%", "normal_ranges": [{"age_range": "0-100 Years", "gender": "Both", "min_value": 1, "max_value": 6, "unit": "%"}]},
   {"name": "Monocyte", "unit": "%", "normal_ranges": [{"age_range": "0-100 Years", "gender": "Both", "min_value": 2, "max_value": 8, "unit": "%"}]},
   {"name": "Polymorphs", "unit": "%", "normal_ranges": [{"age_range": "0-100 Years", "gender": "Both", "min_value": 40, "max_value": 75, "unit": "%"}]},
   {"name": "Lymphocyte", "unit": "%", "normal_ranges": [{"age_range": "0-100 Years", "gender": "Both", "min_value": 20, "max_value": 40, "unit": "%"}]}
 ]'::jsonb),

-- Platelet Count
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'Platelet Count', 'unit',
 0, 100, 'Years',
 'Both', 1.5, 4, 'unit',
 1, 9, true, '[]'::jsonb),

-- Red Cell Count
('0a4abbbe-9029-427a-9e5f-e874ee87968f', 'CBC', 'Red Cell Count', 'unit',
 0, 100, 'Years',
 'Both', 4, 6.2, 'unit',
 1, 10, true, '[]'::jsonb);

-- Verify inserted data
SELECT
  sub_test_name,
  min_value,
  max_value,
  normal_unit,
  nested_sub_tests
FROM lab_test_config
WHERE test_name = 'CBC'
  AND lab_id = '0a4abbbe-9029-427a-9e5f-e874ee87968f'
ORDER BY display_order;
