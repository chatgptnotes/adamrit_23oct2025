-- ========================================
-- FIX CBC TEST SEQUENCE - FINAL VERSION
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Check current sequence
SELECT sub_test_name, display_order, id
FROM lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%'
ORDER BY display_order, id;

-- Step 2: Update display_order for correct sequence
-- Desired Sequence:
-- 1. Haemoglobin
-- 2. Total Leucocyte Count
-- 3. Differential Leucocyte Count (with nested: Polymorphs, Lymphocyte, Monocyte, Eosinophills)
-- 4. Red Cell Count
-- 5. Packed Cell Volume
-- 6. Mean Cell Volume
-- 7. Mean Cell Haemoglobin
-- 8. Mean Cell He.Concentration
-- 9. Platelet Count
-- 10. E.S.R. (Wintrobe)

UPDATE lab_test_config
SET display_order = 0
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND sub_test_name = 'Haemoglobin';

UPDATE lab_test_config
SET display_order = 1
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND sub_test_name = 'Total Leucocyte Count';

UPDATE lab_test_config
SET display_order = 2
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND sub_test_name = 'Differential Leucocyte Count';

UPDATE lab_test_config
SET display_order = 3
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND sub_test_name = 'Red Cell Count';

UPDATE lab_test_config
SET display_order = 4
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND sub_test_name = 'Packed Cell Volume';

UPDATE lab_test_config
SET display_order = 5
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND sub_test_name = 'Mean Cell Volume';

UPDATE lab_test_config
SET display_order = 6
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND sub_test_name = 'Mean Cell Haemoglobin';

UPDATE lab_test_config
SET display_order = 7
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND (sub_test_name = 'Mean Cell He.Concentration' OR sub_test_name = 'Mean Cell He Concentration');

UPDATE lab_test_config
SET display_order = 8
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND sub_test_name = 'Platelet Count';

UPDATE lab_test_config
SET display_order = 9
WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%')
AND (sub_test_name = 'E.S.R. (Wintrobe)' OR sub_test_name = 'ESR (Wintrobe)' OR sub_test_name LIKE '%E.S.R%');

-- Step 3: Verify the update
SELECT sub_test_name, display_order, id
FROM lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%'
ORDER BY display_order, id;

-- Step 4: Count total records updated
SELECT COUNT(*) as total_cbc_tests
FROM lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%';

-- ========================================
-- COPY-PASTE READY VERSION (Single Query)
-- ========================================
-- Copy everything below and paste in Supabase SQL Editor, then click RUN

DO $$
BEGIN
  -- Update all display orders
  UPDATE lab_test_config SET display_order = 0 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND sub_test_name = 'Haemoglobin';
  UPDATE lab_test_config SET display_order = 1 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND sub_test_name = 'Total Leucocyte Count';
  UPDATE lab_test_config SET display_order = 2 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND sub_test_name = 'Differential Leucocyte Count';
  UPDATE lab_test_config SET display_order = 3 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND sub_test_name = 'Red Cell Count';
  UPDATE lab_test_config SET display_order = 4 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND sub_test_name = 'Packed Cell Volume';
  UPDATE lab_test_config SET display_order = 5 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND sub_test_name = 'Mean Cell Volume';
  UPDATE lab_test_config SET display_order = 6 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND sub_test_name = 'Mean Cell Haemoglobin';
  UPDATE lab_test_config SET display_order = 7 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND (sub_test_name = 'Mean Cell He.Concentration' OR sub_test_name = 'Mean Cell He Concentration');
  UPDATE lab_test_config SET display_order = 8 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND sub_test_name = 'Platelet Count';
  UPDATE lab_test_config SET display_order = 9 WHERE (test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%') AND (sub_test_name = 'E.S.R. (Wintrobe)' OR sub_test_name = 'ESR (Wintrobe)' OR sub_test_name LIKE '%E.S.R%');

  RAISE NOTICE 'CBC sequence updated successfully!';
END $$;

-- Final verification query
SELECT
  sub_test_name,
  display_order,
  test_name
FROM lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%'
ORDER BY display_order, id;
