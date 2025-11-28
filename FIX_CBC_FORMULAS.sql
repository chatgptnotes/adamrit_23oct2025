-- ========================================================
-- FIX CBC FORMULAS - Update Existing Incomplete Formulas
-- ========================================================
-- This script will update the existing formulas with correct ones
-- ========================================================

-- First, check current formulas
SELECT
    id,
    test_name,
    sub_test_name,
    formula,
    LENGTH(formula) as formula_length
FROM public.lab_test_formulas
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY sub_test_name;

-- Update Mean Cell Volume formula
UPDATE public.lab_test_formulas
SET
    formula = '(Packed Cell Volume / Red Cell Count) * 10',
    updated_at = NOW()
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Mean Cell Volume';

-- Update Mean Cell Haemoglobin formula
UPDATE public.lab_test_formulas
SET
    formula = '(Haemoglobin / Red Cell Count) * 10',
    updated_at = NOW()
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Mean Cell Haemoglobin';

-- Update Mean Cell He.Concentration formula
UPDATE public.lab_test_formulas
SET
    formula = '(Haemoglobin / Packed Cell Volume) * 100',
    updated_at = NOW()
WHERE test_name = 'CBC(Complete Blood Count)'
  AND sub_test_name = 'Mean Cell He.Concentration';

-- Verify the updates
SELECT
    id,
    test_name,
    sub_test_name,
    formula,
    LENGTH(formula) as formula_length,
    updated_at
FROM public.lab_test_formulas
WHERE test_name = 'CBC(Complete Blood Count)'
ORDER BY sub_test_name;

-- Also check what the exact test_name is in lab_test_config
SELECT DISTINCT test_name
FROM public.lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%'
ORDER BY test_name;

-- Check sub-test names to ensure they match
SELECT DISTINCT
    sub_test_name
FROM public.lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete Blood Count%'
ORDER BY sub_test_name;

SELECT '✅ Formulas updated successfully!' AS status;
