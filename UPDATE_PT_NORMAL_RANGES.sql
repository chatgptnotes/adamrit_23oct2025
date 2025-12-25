-- Update PT (Prothrombin Time) Normal Ranges
-- Run this in Supabase SQL Editor

-- First, let's check current values
SELECT id, test_name, sub_test_name, normal_ranges
FROM lab_test_config
WHERE test_name ILIKE '%PROTHROMBIN%' OR test_name ILIKE '%PT%';

-- Update Prothrombin Time normal range to "Control 13 Sec"
UPDATE lab_test_config
SET normal_ranges = '[{"gender": "Both", "minValue": "", "maxValue": "", "displayRange": "Control 13 Sec"}]'::jsonb
WHERE test_name ILIKE '%PROTHROMBIN TIME%'
AND sub_test_name ILIKE '%Prothrombin Time%'
AND sub_test_name NOT ILIKE '%Index%';

-- Update PT (INR) Value normal range to "-"
UPDATE lab_test_config
SET normal_ranges = '[{"gender": "Both", "minValue": "", "maxValue": "", "displayRange": "-"}]'::jsonb
WHERE test_name ILIKE '%PROTHROMBIN TIME%'
AND (sub_test_name ILIKE '%INR%' OR sub_test_name ILIKE '%PT (INR)%');

-- Verify the updates
SELECT id, test_name, sub_test_name, normal_ranges
FROM lab_test_config
WHERE test_name ILIKE '%PROTHROMBIN%' OR test_name ILIKE '%PT%';
