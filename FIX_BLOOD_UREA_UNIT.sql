-- Fix Blood Urea Unit in normal_ranges JSONB
-- Run this in Supabase SQL Editor

-- First check current data
SELECT id, test_name, sub_test_name, unit, normal_ranges
FROM lab_test_config
WHERE sub_test_name ILIKE '%Blood Urea%';

-- Update normal_ranges to include unit for each gender entry
UPDATE lab_test_config
SET normal_ranges = (
  SELECT jsonb_agg(
    jsonb_set(elem, '{unit}', '"mg/dl"'::jsonb)
  )
  FROM jsonb_array_elements(normal_ranges) AS elem
)
WHERE sub_test_name ILIKE '%Blood Urea%'
AND normal_ranges IS NOT NULL;

-- Verify the update
SELECT id, test_name, sub_test_name, unit, normal_ranges
FROM lab_test_config
WHERE sub_test_name ILIKE '%Blood Urea%';
