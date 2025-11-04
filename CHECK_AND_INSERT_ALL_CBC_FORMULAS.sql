-- ========================================================
-- CHECK AND INSERT ALL CBC FORMULAS
-- ========================================================
-- This script will:
-- 1. Check existing formulas
-- 2. Insert all three CBC formulas for auto-calculation
-- ========================================================

-- Step 1: Check existing formulas
SELECT
    ltf.id,
    ltf.test_name,
    ltf.sub_test_name,
    ltf.formula,
    ltf.test_type,
    ltf.is_active,
    l.name as lab_name
FROM public.lab_test_formulas ltf
LEFT JOIN public.lab l ON ltf.lab_id = l.id
WHERE ltf.test_name = 'CBC (Complete Blood Count)'
ORDER BY ltf.sub_test_name;

-- Step 2: Get all labs
SELECT id, name FROM public.lab;

-- Step 3: Insert all three formulas for ALL labs
-- This will work for all labs in your system

-- Mean Cell Volume = (Packed Cell Volume / Red Cell Count) * 10
INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
SELECT
    l.id AS lab_id,
    'CBC (Complete Blood Count)' AS test_name,
    'Mean Cell Volume' AS sub_test_name,
    '(Packed Cell Volume / Red Cell Count) * 10' AS formula,
    'Numeric' AS test_type,
    true AS is_active
FROM lab l
ON CONFLICT (lab_id, test_name, sub_test_name)
DO UPDATE SET
    formula = EXCLUDED.formula,
    test_type = EXCLUDED.test_type,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Mean Cell Haemoglobin = (Haemoglobin / Red Cell Count) * 10
INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
SELECT
    l.id AS lab_id,
    'CBC (Complete Blood Count)' AS test_name,
    'Mean Cell Haemoglobin' AS sub_test_name,
    '(Haemoglobin / Red Cell Count) * 10' AS formula,
    'Numeric' AS test_type,
    true AS is_active
FROM lab l
ON CONFLICT (lab_id, test_name, sub_test_name)
DO UPDATE SET
    formula = EXCLUDED.formula,
    test_type = EXCLUDED.test_type,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Mean Cell He.Concentration = (Haemoglobin / Packed Cell Volume) * 100
INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
SELECT
    l.id AS lab_id,
    'CBC (Complete Blood Count)' AS test_name,
    'Mean Cell He.Concentration' AS sub_test_name,
    '(Haemoglobin / Packed Cell Volume) * 100' AS formula,
    'Numeric' AS test_type,
    true AS is_active
FROM lab l
ON CONFLICT (lab_id, test_name, sub_test_name)
DO UPDATE SET
    formula = EXCLUDED.formula,
    test_type = EXCLUDED.test_type,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Step 4: Verify all formulas were inserted
SELECT
    ltf.id,
    ltf.test_name,
    ltf.sub_test_name,
    ltf.formula,
    ltf.test_type,
    ltf.is_active,
    l.name as lab_name,
    ltf.created_at,
    ltf.updated_at
FROM public.lab_test_formulas ltf
LEFT JOIN public.lab l ON ltf.lab_id = l.id
WHERE ltf.test_name = 'CBC (Complete Blood Count)'
ORDER BY ltf.sub_test_name;

-- Step 5: Check the sub-test names in lab_test_config
SELECT DISTINCT
    sub_test_name
FROM public.lab_test_config
WHERE test_name = 'CBC (Complete Blood Count)'
ORDER BY sub_test_name;

SELECT '✅ All CBC formulas inserted successfully!' AS status;
