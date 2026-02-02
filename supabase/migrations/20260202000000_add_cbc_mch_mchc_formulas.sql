-- Migration: Add missing MCH and MCHC formulas for CBC test
-- These formulas were accidentally deleted and need to be restored

-- Insert MCH formula (Mean Cell Haemoglobin)
-- Formula: (Haemoglobin / Red Cell Count) * 10
INSERT INTO public.lab_test_formulas (lab_id, test_name, sub_test_name, formula, test_type, is_active)
SELECT
    lab_id,
    test_name,
    'Mean Cell Haemoglobin',
    '(Haemoglobin / Red Cell Count) * 10',
    'Numeric',
    true
FROM public.lab_test_formulas
WHERE sub_test_name = 'Mean Cell Volume'
  AND formula IS NOT NULL
ON CONFLICT (lab_id, test_name, sub_test_name) DO UPDATE
SET formula = EXCLUDED.formula,
    is_active = true,
    updated_at = NOW();

-- Insert MCHC formula (Mean Cell Haemoglobin Concentration)
-- Formula: (Haemoglobin / Packed Cell Volume) * 100
INSERT INTO public.lab_test_formulas (lab_id, test_name, sub_test_name, formula, test_type, is_active)
SELECT
    lab_id,
    test_name,
    'Mean Cell He.Concentration',
    '(Haemoglobin / Packed Cell Volume) * 100',
    'Numeric',
    true
FROM public.lab_test_formulas
WHERE sub_test_name = 'Mean Cell Volume'
  AND formula IS NOT NULL
ON CONFLICT (lab_id, test_name, sub_test_name) DO UPDATE
SET formula = EXCLUDED.formula,
    is_active = true,
    updated_at = NOW();

-- Log the results
DO $$
BEGIN
    RAISE NOTICE 'CBC formulas migration complete. MCH and MCHC formulas added/updated.';
END $$;
