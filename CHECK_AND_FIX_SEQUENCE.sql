-- ============================================
-- STEP-BY-STEP: CHECK AND FIX CBC SEQUENCE
-- ============================================

-- ============================================
-- STEP 1: Find EXACT test name
-- ============================================
-- Copy the EXACT test_name from the result
SELECT DISTINCT test_name
FROM lab_test_config
WHERE test_name ILIKE '%CBC%'
   OR test_name ILIKE '%Complete%Blood%'
   OR test_name ILIKE '%blood%count%';

-- ============================================
-- STEP 2: See current sequence with sub-test names
-- ============================================
-- Check karo kaunse sub-tests hai aur kya sequence hai
SELECT
  id,
  test_name,
  sub_test_name,
  display_order,
  created_at
FROM lab_test_config
WHERE test_name ILIKE '%CBC%'
   OR test_name ILIKE '%Complete%Blood%'
ORDER BY display_order, created_at, id;

-- ============================================
-- STEP 3: Count kitne tests hai
-- ============================================
SELECT COUNT(*) as total_tests
FROM lab_test_config
WHERE test_name ILIKE '%CBC%'
   OR test_name ILIKE '%Complete%Blood%';

-- ============================================
-- STEP 4: FIX SEQUENCE - OPTION 1 (Generic)
-- ============================================
-- Yeh sabhi CBC variants ko cover karega

-- Update for Haemoglobin -> Position 0
UPDATE lab_test_config
SET display_order = 0
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND sub_test_name ILIKE '%Haemoglobin%'
AND sub_test_name NOT ILIKE '%Mean%';

-- Update for Total Leucocyte Count -> Position 1
UPDATE lab_test_config
SET display_order = 1
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND sub_test_name ILIKE '%Total%Leucocyte%Count%';

-- Update for Differential Leucocyte Count -> Position 2
UPDATE lab_test_config
SET display_order = 2
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND sub_test_name ILIKE '%Differential%Leucocyte%Count%';

-- Update for Red Cell Count -> Position 3
UPDATE lab_test_config
SET display_order = 3
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND sub_test_name ILIKE '%Red%Cell%Count%';

-- Update for Packed Cell Volume -> Position 4
UPDATE lab_test_config
SET display_order = 4
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND sub_test_name ILIKE '%Packed%Cell%Volume%';

-- Update for Mean Cell Volume -> Position 5
UPDATE lab_test_config
SET display_order = 5
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND sub_test_name ILIKE '%Mean%Cell%Volume%'
AND sub_test_name NOT ILIKE '%Concentration%';

-- Update for Mean Cell Haemoglobin -> Position 6
UPDATE lab_test_config
SET display_order = 6
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND sub_test_name ILIKE '%Mean%Cell%Haemoglobin%'
AND sub_test_name NOT ILIKE '%Concentration%';

-- Update for Mean Cell He.Concentration -> Position 7
UPDATE lab_test_config
SET display_order = 7
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND (sub_test_name ILIKE '%Mean%Cell%He%Concentration%'
     OR sub_test_name ILIKE '%Mean%Cell%Hb%Concentration%');

-- Update for Platelet Count -> Position 8
UPDATE lab_test_config
SET display_order = 8
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND sub_test_name ILIKE '%Platelet%Count%';

-- Update for E.S.R. (Wintrobe) -> Position 9
UPDATE lab_test_config
SET display_order = 9
WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%')
AND (sub_test_name ILIKE '%E.S.R%'
     OR sub_test_name ILIKE '%ESR%'
     OR sub_test_name ILIKE '%Wintrobe%');

-- ============================================
-- STEP 5: VERIFY THE FIX
-- ============================================
SELECT
  display_order,
  sub_test_name,
  test_name,
  id
FROM lab_test_config
WHERE test_name ILIKE '%CBC%'
   OR test_name ILIKE '%Complete%Blood%'
ORDER BY display_order, id;

-- ============================================
-- STEP 6: ONE-CLICK FIX (Copy-Paste Ready)
-- ============================================
-- Copy pura block niche se aur paste karo SQL editor me

BEGIN;

-- Reset all to avoid conflicts
UPDATE lab_test_config SET display_order = 999
WHERE test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%';

-- Set correct sequence
UPDATE lab_test_config SET display_order = 0 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND sub_test_name ILIKE '%Haemoglobin%' AND sub_test_name NOT ILIKE '%Mean%';
UPDATE lab_test_config SET display_order = 1 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND sub_test_name ILIKE '%Total%Leucocyte%Count%';
UPDATE lab_test_config SET display_order = 2 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND sub_test_name ILIKE '%Differential%Leucocyte%Count%';
UPDATE lab_test_config SET display_order = 3 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND sub_test_name ILIKE '%Red%Cell%Count%';
UPDATE lab_test_config SET display_order = 4 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND sub_test_name ILIKE '%Packed%Cell%Volume%';
UPDATE lab_test_config SET display_order = 5 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND sub_test_name ILIKE '%Mean%Cell%Volume%' AND sub_test_name NOT ILIKE '%Concentration%';
UPDATE lab_test_config SET display_order = 6 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND sub_test_name ILIKE '%Mean%Cell%Haemoglobin%' AND sub_test_name NOT ILIKE '%Concentration%';
UPDATE lab_test_config SET display_order = 7 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND (sub_test_name ILIKE '%Mean%Cell%He%Concentration%' OR sub_test_name ILIKE '%Mean%Cell%Hb%Concentration%');
UPDATE lab_test_config SET display_order = 8 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND sub_test_name ILIKE '%Platelet%Count%';
UPDATE lab_test_config SET display_order = 9 WHERE (test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%') AND (sub_test_name ILIKE '%E.S.R%' OR sub_test_name ILIKE '%ESR%' OR sub_test_name ILIKE '%Wintrobe%');

COMMIT;

-- Verify
SELECT display_order, sub_test_name FROM lab_test_config WHERE test_name ILIKE '%CBC%' OR test_name ILIKE '%Complete%Blood%' ORDER BY display_order;
