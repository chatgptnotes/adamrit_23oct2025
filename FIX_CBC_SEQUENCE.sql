-- Fix CBC Test Sequence
-- Yeh query run karo Supabase SQL Editor me

-- First, check current sequence
SELECT id, sub_test_name, display_order
FROM lab_test_config
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY display_order, id;

-- Update display_order for correct sequence
-- Aap niche ka sequence apne desired sequence se replace kar sakte ho

UPDATE lab_test_config SET display_order = 0 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'Haemoglobin';
UPDATE lab_test_config SET display_order = 1 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'Total Leucocyte Count';
UPDATE lab_test_config SET display_order = 2 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'Packed Cell Volume';
UPDATE lab_test_config SET display_order = 3 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'Mean Cell Haemoglobin';
UPDATE lab_test_config SET display_order = 4 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'E.S.R. (Wintrobe)';
UPDATE lab_test_config SET display_order = 5 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'Platelet Count';
UPDATE lab_test_config SET display_order = 6 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'Red Cell Count';
UPDATE lab_test_config SET display_order = 7 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'Mean Cell Volume';
UPDATE lab_test_config SET display_order = 8 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'Mean Cell He.Concentration';
UPDATE lab_test_config SET display_order = 9 WHERE test_name = 'CBC(Complete Blood Count)' AND sub_test_name = 'Differential Leucocyte Count';

-- Verify the update
SELECT id, sub_test_name, display_order
FROM lab_test_config
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY display_order;

-- NOTE: Yeh sequence aapke desired order ke hisab se change karo
-- Haemoglobin ko first rakhne ke liye maine display_order = 0 diya hai
