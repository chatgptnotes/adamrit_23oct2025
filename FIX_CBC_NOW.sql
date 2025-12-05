-- ============================================
-- IMMEDIATE FIX FOR CBC SEQUENCE
-- Copy and paste this entire block and RUN
-- ============================================

BEGIN;

-- Update by exact ID to avoid any conflicts

-- Haemoglobin -> 0
UPDATE lab_test_config
SET display_order = 0
WHERE id = '9b8cbd34-3f2b-49c0-9716-09dc1ba1e7fb';

-- Total Leukocyte Count -> 1
UPDATE lab_test_config
SET display_order = 1
WHERE id = 'bbbe9103-9c35-4934-b597-5df4e8c14f28';

-- Differential Leukocyte Count -> 2
UPDATE lab_test_config
SET display_order = 2
WHERE id = 'd1dd4252-8fd0-47a2-94b8-50a1871b7fca';

-- Red Cell Count -> 3
UPDATE lab_test_config
SET display_order = 3
WHERE id = '7813294c-8c49-4ad0-9aa7-461e7eee7acf';

-- Packed Cell Volume -> 4
UPDATE lab_test_config
SET display_order = 4
WHERE id = 'e2e64b9e-5e08-4e68-af4a-75779dc29e17';

-- Mean Cell Volume -> 5
UPDATE lab_test_config
SET display_order = 5
WHERE id = '6e731219-9c8a-4609-948f-6014603156a6';

-- Mean Cell Haemoglobin -> 6
UPDATE lab_test_config
SET display_order = 6
WHERE id = '3b7d0e89-a546-4176-bd3e-4f5316320767';

-- Mean Cell He.Concentration -> 7
UPDATE lab_test_config
SET display_order = 7
WHERE id = '1eb51bd9-fb89-41dd-9b74-750b22975bf6';

-- Platelet Count -> 8
UPDATE lab_test_config
SET display_order = 8
WHERE id = '31e4a4c7-e77b-49c6-b685-58768850241e';

COMMIT;

-- Verify the fix
SELECT
  sub_test_name,
  display_order,
  id
FROM lab_test_config
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY display_order, id;
