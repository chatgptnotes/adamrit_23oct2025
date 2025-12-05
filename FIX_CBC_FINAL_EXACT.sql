-- ============================================
-- FIX CBC SEQUENCE - EXACT MATCH VERSION
-- Run this in Supabase SQL Editor
-- ============================================

-- Test Name: CBC(Complete Blood Count)
-- This will set the exact order as shown in your screenshot

BEGIN;

-- First, reset all CBC tests to avoid conflicts
UPDATE lab_test_config
SET display_order = 999
WHERE test_name = 'CBC(Complete Blood Count)';

-- Now set the correct sequence (0-9)

-- 1. Haemoglobin -> Position 0
UPDATE lab_test_config
SET display_order = 0
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Haemoglobin';

-- 2. Total Leucocyte Count -> Position 1
UPDATE lab_test_config
SET display_order = 1
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Total Leucocyte Count';

-- 3. Differential Leucocyte Count -> Position 2
UPDATE lab_test_config
SET display_order = 2
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Differential Leucocyte Count';

-- 3a. Polymorphs (nested under Differential) -> Position 2.1
UPDATE lab_test_config
SET display_order = 2.1
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Polymorphs';

-- 3b. Lymphocyte (nested under Differential) -> Position 2.2
UPDATE lab_test_config
SET display_order = 2.2
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Lymphocyte';

-- 3c. Monocyte (nested under Differential) -> Position 2.3
UPDATE lab_test_config
SET display_order = 2.3
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Monocyte';

-- 3d. Eosinophills (nested under Differential) -> Position 2.4
UPDATE lab_test_config
SET display_order = 2.4
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Eosinophills';

-- 4. Red Cell Count -> Position 3
UPDATE lab_test_config
SET display_order = 3
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Red Cell Count';

-- 5. Packed Cell Volume -> Position 4
UPDATE lab_test_config
SET display_order = 4
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Packed Cell Volume';

-- 6. Mean Cell Volume -> Position 5
UPDATE lab_test_config
SET display_order = 5
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Mean Cell Volume';

-- 7. Mean Cell Haemoglobin -> Position 6
UPDATE lab_test_config
SET display_order = 6
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Mean Cell Haemoglobin';

-- 8. Mean Cell He.Concentration -> Position 7
UPDATE lab_test_config
SET display_order = 7
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Mean Cell He.Concentration';

-- 9. Platelet Count -> Position 8
UPDATE lab_test_config
SET display_order = 8
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Platelet Count';

-- 10. E.S.R. (Wintrobe) -> Position 9
UPDATE lab_test_config
SET display_order = 9
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'E.S.R. (Wintrobe)';

COMMIT;

-- ============================================
-- VERIFY THE FIX
-- ============================================
SELECT
  display_order,
  sub_test_name,
  test_name,
  id
FROM lab_test_config
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY display_order, id;

-- ============================================
-- Count total records updated
-- ============================================
SELECT COUNT(*) as total_updated
FROM lab_test_config
WHERE test_name = 'CBC(Complete Blood Count)';
