-- ========================================================
-- COMPLETE FIX FOR CBC FORMULAS - COMPREHENSIVE SOLUTION
-- ========================================================
-- This will check everything and fix all mismatches
-- ========================================================

-- STEP 1: Check what test_name exists in lab_test_config for CBC
SELECT DISTINCT
    test_name,
    COUNT(DISTINCT sub_test_name) as sub_test_count
FROM public.lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood%'
GROUP BY test_name
ORDER BY test_name;

COMMENT ON COLUMN public.lab_test_config.test_name IS 'WRITE DOWN THE EXACT test_name FROM ABOVE FOR NEXT STEPS';

-- STEP 2: Check all sub-test names for CBC in lab_test_config
SELECT DISTINCT
    test_name,
    sub_test_name
FROM public.lab_test_config
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood%'
ORDER BY test_name, sub_test_name;

COMMENT ON COLUMN public.lab_test_config.sub_test_name IS 'CHECK IF THESE MATCH: Haemoglobin, Red Cell Count, Packed Cell Volume, Mean Cell Volume, Mean Cell Haemoglobin, Mean Cell He.Concentration';

-- STEP 3: Check current formulas in lab_test_formulas
SELECT
    id,
    test_name,
    sub_test_name,
    formula,
    LENGTH(formula) as formula_length,
    created_at,
    updated_at
FROM public.lab_test_formulas
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood%'
ORDER BY test_name, sub_test_name;

-- STEP 4: Delete all existing CBC formulas (clean slate)
DELETE FROM public.lab_test_formulas
WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood%';

-- STEP 5: Get the EXACT test_name from lab_test_config
-- This query will be used to insert formulas
DO $$
DECLARE
    v_test_name TEXT;
    v_lab_id UUID;
BEGIN
    -- Get the exact test name from lab_test_config
    SELECT DISTINCT test_name INTO v_test_name
    FROM public.lab_test_config
    WHERE test_name LIKE '%CBC%' OR test_name LIKE '%Complete%' OR test_name LIKE '%Blood%'
    LIMIT 1;

    RAISE NOTICE 'Found test_name: %', v_test_name;

    -- Get lab_id from lab_test_config
    SELECT DISTINCT lab_id INTO v_lab_id
    FROM public.lab_test_config
    WHERE test_name = v_test_name
    LIMIT 1;

    RAISE NOTICE 'Found lab_id: %', v_lab_id;

    -- Insert Mean Cell Volume formula
    IF EXISTS (SELECT 1 FROM public.lab_test_config WHERE test_name = v_test_name AND sub_test_name = 'Mean Cell Volume') THEN
        INSERT INTO public.lab_test_formulas (lab_id, test_name, sub_test_name, formula, is_active)
        VALUES (v_lab_id, v_test_name, 'Mean Cell Volume', '(Packed Cell Volume / Red Cell Count) * 10', true);
        RAISE NOTICE 'Inserted formula for Mean Cell Volume';
    ELSE
        RAISE NOTICE 'Sub-test "Mean Cell Volume" not found in lab_test_config';
    END IF;

    -- Insert Mean Cell Haemoglobin formula
    IF EXISTS (SELECT 1 FROM public.lab_test_config WHERE test_name = v_test_name AND sub_test_name = 'Mean Cell Haemoglobin') THEN
        INSERT INTO public.lab_test_formulas (lab_id, test_name, sub_test_name, formula, is_active)
        VALUES (v_lab_id, v_test_name, 'Mean Cell Haemoglobin', '(Haemoglobin / Red Cell Count) * 10', true);
        RAISE NOTICE 'Inserted formula for Mean Cell Haemoglobin';
    ELSE
        RAISE NOTICE 'Sub-test "Mean Cell Haemoglobin" not found in lab_test_config';
    END IF;

    -- Insert Mean Cell He.Concentration formula
    IF EXISTS (SELECT 1 FROM public.lab_test_config WHERE test_name = v_test_name AND sub_test_name = 'Mean Cell He.Concentration') THEN
        INSERT INTO public.lab_test_formulas (lab_id, test_name, sub_test_name, formula, is_active)
        VALUES (v_lab_id, v_test_name, 'Mean Cell He.Concentration', '(Haemoglobin / Packed Cell Volume) * 100', true);
        RAISE NOTICE 'Inserted formula for Mean Cell He.Concentration';
    ELSE
        RAISE NOTICE 'Sub-test "Mean Cell He.Concentration" not found in lab_test_config';
    END IF;

END $$;

-- STEP 6: Verify inserted formulas
SELECT
    ltf.id,
    ltf.test_name,
    ltf.sub_test_name,
    ltf.formula,
    LENGTH(ltf.formula) as formula_length,
    ltf.is_active,
    l.name as lab_name
FROM public.lab_test_formulas ltf
LEFT JOIN public.lab l ON ltf.lab_id = l.id
WHERE ltf.test_name LIKE '%CBC%' OR ltf.test_name LIKE '%Complete%' OR ltf.test_name LIKE '%Blood%'
ORDER BY ltf.test_name, ltf.sub_test_name;

-- STEP 7: Cross-verify that test_name and sub_test_name match between tables
SELECT
    'lab_test_config' as source_table,
    ltc.test_name,
    ltc.sub_test_name,
    CASE
        WHEN ltf.id IS NOT NULL THEN '✅ Has Formula'
        ELSE '❌ No Formula'
    END as formula_status,
    ltf.formula
FROM public.lab_test_config ltc
LEFT JOIN public.lab_test_formulas ltf ON
    ltc.test_name = ltf.test_name AND
    ltc.sub_test_name = ltf.sub_test_name
WHERE ltc.test_name LIKE '%CBC%' OR ltc.test_name LIKE '%Complete%' OR ltc.test_name LIKE '%Blood%'
GROUP BY ltc.test_name, ltc.sub_test_name, ltf.id, ltf.formula
ORDER BY ltc.test_name, ltc.sub_test_name;

-- Expected Results:
-- Mean Cell Volume: ✅ Has Formula: (Packed Cell Volume / Red Cell Count) * 10
-- Mean Cell Haemoglobin: ✅ Has Formula: (Haemoglobin / Red Cell Count) * 10
-- Mean Cell He.Concentration: ✅ Has Formula: (Haemoglobin / Packed Cell Volume) * 100

SELECT '✅ COMPLETE! Check results above. All three calculated fields should show "✅ Has Formula"' AS status;
