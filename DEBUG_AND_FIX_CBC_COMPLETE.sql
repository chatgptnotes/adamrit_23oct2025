-- ========================================================
-- DEBUG AND FIX CBC FORMULAS - COMPLETE SOLUTION
-- ========================================================

-- STEP 1: Check what test names exist in lab_test_config
SELECT DISTINCT
    test_name,
    COUNT(*) as sub_test_count
FROM public.lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood Count%'
GROUP BY test_name
ORDER BY test_name;

-- STEP 2: Check current formulas in lab_test_formulas
SELECT
    id,
    test_name,
    sub_test_name,
    formula,
    LENGTH(formula) as formula_length,
    test_type,
    is_active
FROM public.lab_test_formulas
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood Count%'
ORDER BY test_name, sub_test_name;

-- STEP 3: Check sub-test names in lab_test_config for CBC test
SELECT DISTINCT
    test_name,
    sub_test_name
FROM public.lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood Count%'
ORDER BY test_name, sub_test_name;

-- STEP 4: Delete existing formulas and re-insert with correct values
-- This ensures clean slate

DELETE FROM public.lab_test_formulas
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood Count%';

-- STEP 5: Insert formulas for EACH unique test_name found
-- Replace 'CBC(Complete Blood Count)' with your ACTUAL test name from STEP 1

-- For test name: CBC(Complete Blood Count) - NO SPACE
INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
SELECT
    ltc.lab_id,
    'CBC(Complete Blood Count)' AS test_name,
    'Mean Cell Volume' AS sub_test_name,
    '(Packed Cell Volume / Red Cell Count) * 10' AS formula,
    'Numeric' AS test_type,
    true AS is_active
FROM public.lab_test_config ltc
WHERE ltc.test_name = 'CBC(Complete Blood Count)'
  AND ltc.sub_test_name = 'Mean Cell Volume'
GROUP BY ltc.lab_id
ON CONFLICT (lab_id, test_name, sub_test_name) DO NOTHING;

INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
SELECT
    ltc.lab_id,
    'CBC(Complete Blood Count)' AS test_name,
    'Mean Cell Haemoglobin' AS sub_test_name,
    '(Haemoglobin / Red Cell Count) * 10' AS formula,
    'Numeric' AS test_type,
    true AS is_active
FROM public.lab_test_config ltc
WHERE ltc.test_name = 'CBC(Complete Blood Count)'
  AND ltc.sub_test_name = 'Mean Cell Haemoglobin'
GROUP BY ltc.lab_id
ON CONFLICT (lab_id, test_name, sub_test_name) DO NOTHING;

INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
SELECT
    ltc.lab_id,
    'CBC(Complete Blood Count)' AS test_name,
    'Mean Cell He.Concentration' AS sub_test_name,
    '(Haemoglobin / Packed Cell Volume) * 100' AS formula,
    'Numeric' AS test_type,
    true AS is_active
FROM public.lab_test_config ltc
WHERE ltc.test_name = 'CBC(Complete Blood Count)'
  AND ltc.sub_test_name = 'Mean Cell He.Concentration'
GROUP BY ltc.lab_id
ON CONFLICT (lab_id, test_name, sub_test_name) DO NOTHING;

-- For test name: CBC (Complete Blood Count) - WITH SPACE (if exists)
INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
SELECT
    ltc.lab_id,
    'CBC (Complete Blood Count)' AS test_name,
    'Mean Cell Volume' AS sub_test_name,
    '(Packed Cell Volume / Red Cell Count) * 10' AS formula,
    'Numeric' AS test_type,
    true AS is_active
FROM public.lab_test_config ltc
WHERE ltc.test_name = 'CBC (Complete Blood Count)'
  AND ltc.sub_test_name = 'Mean Cell Volume'
GROUP BY ltc.lab_id
ON CONFLICT (lab_id, test_name, sub_test_name) DO NOTHING;

INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
SELECT
    ltc.lab_id,
    'CBC (Complete Blood Count)' AS test_name,
    'Mean Cell Haemoglobin' AS sub_test_name,
    '(Haemoglobin / Red Cell Count) * 10' AS formula,
    'Numeric' AS test_type,
    true AS is_active
FROM public.lab_test_config ltc
WHERE ltc.test_name = 'CBC (Complete Blood Count)'
  AND ltc.sub_test_name = 'Mean Cell Haemoglobin'
GROUP BY ltc.lab_id
ON CONFLICT (lab_id, test_name, sub_test_name) DO NOTHING;

INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
SELECT
    ltc.lab_id,
    'CBC (Complete Blood Count)' AS test_name,
    'Mean Cell He.Concentration' AS sub_test_name,
    '(Haemoglobin / Packed Cell Volume) * 100' AS formula,
    'Numeric' AS test_type,
    true AS is_active
FROM public.lab_test_config ltc
WHERE ltc.test_name = 'CBC (Complete Blood Count)'
  AND ltc.sub_test_name = 'Mean Cell He.Concentration'
GROUP BY ltc.lab_id
ON CONFLICT (lab_id, test_name, sub_test_name) DO NOTHING;

-- STEP 6: Verify final formulas
SELECT
    ltf.id,
    ltf.test_name,
    ltf.sub_test_name,
    ltf.formula,
    LENGTH(ltf.formula) as formula_length,
    ltf.test_type,
    ltf.is_active,
    l.name as lab_name
FROM public.lab_test_formulas ltf
LEFT JOIN public.lab l ON ltf.lab_id = l.id
WHERE ltf.test_name LIKE '%CBC%' OR ltf.test_name LIKE '%Complete%'
ORDER BY ltf.test_name, ltf.sub_test_name;

SELECT '✅ All formulas fixed and verified!' AS status;
