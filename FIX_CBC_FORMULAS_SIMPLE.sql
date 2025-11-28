-- ========================================================
-- FIX CBC FORMULAS - SIMPLIFIED VERSION
-- ========================================================
-- This will check and fix the formulas properly
-- ========================================================

-- STEP 1: Check what columns exist in lab_test_formulas table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lab_test_formulas'
ORDER BY ordinal_position;

-- STEP 2: Check current test names in lab_test_config
SELECT DISTINCT test_name
FROM public.lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood Count%'
ORDER BY test_name;

-- STEP 3: Check current formulas
SELECT
    id,
    test_name,
    sub_test_name,
    formula,
    LENGTH(formula) as formula_length
FROM public.lab_test_formulas
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%'
ORDER BY test_name, sub_test_name;

-- STEP 4: Check sub-test names
SELECT DISTINCT
    sub_test_name
FROM public.lab_test_config
WHERE test_name LIKE '%CBC%'
ORDER BY sub_test_name;

-- STEP 5: Update existing formulas with correct complete formulas
-- For CBC(Complete Blood Count) - NO SPACE

UPDATE public.lab_test_formulas
SET
    formula = '(Packed Cell Volume / Red Cell Count) * 10',
    updated_at = NOW()
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Mean Cell Volume';

UPDATE public.lab_test_formulas
SET
    formula = '(Haemoglobin / Red Cell Count) * 10',
    updated_at = NOW()
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Mean Cell Haemoglobin';

UPDATE public.lab_test_formulas
SET
    formula = '(Haemoglobin / Packed Cell Volume) * 100',
    updated_at = NOW()
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Mean Cell He.Concentration';

-- Also try with space in case test name has space
UPDATE public.lab_test_formulas
SET
    formula = '(Packed Cell Volume / Red Cell Count) * 10',
    updated_at = NOW()
WHERE test_name = 'CBC (Complete Blood Count)'
  AND sub_test_name = 'Mean Cell Volume';

UPDATE public.lab_test_formulas
SET
    formula = '(Haemoglobin / Red Cell Count) * 10',
    updated_at = NOW()
WHERE test_name = 'CBC (Complete Blood Count)'
  AND sub_test_name = 'Mean Cell Haemoglobin';

UPDATE public.lab_test_formulas
SET
    formula = '(Haemoglobin / Packed Cell Volume) * 100',
    updated_at = NOW()
WHERE test_name = 'CBC (Complete Blood Count)'
  AND sub_test_name = 'Mean Cell He.Concentration';

-- STEP 6: Verify the updates
SELECT
    id,
    test_name,
    sub_test_name,
    formula,
    LENGTH(formula) as formula_length,
    updated_at
FROM public.lab_test_formulas
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%'
ORDER BY test_name, sub_test_name;

SELECT '✅ Formulas updated successfully! Check the results above.' AS status;
