-- ========================================================
-- INSERT FORMULA FOR MEAN CELL VOLUME AUTO-CALCULATION
-- ========================================================
-- Formula: Mean Cell Volume = (Packed Cell Volume / Red Cell Count) * 10
-- This will automatically calculate when both dependent values are entered
-- ========================================================

-- First, let's check if we have the lab_id for your lab
-- You'll need to replace 'YOUR_LAB_ID' with your actual lab UUID

-- Option 1: If you know your lab_id, use it directly
-- Replace 'YOUR_LAB_ID' below with your actual UUID

-- Option 2: Get lab_id by querying (uncomment if needed)
-- SELECT id, name FROM lab;

-- Insert the formula for Mean Cell Volume
-- IMPORTANT: Replace 'YOUR_LAB_ID' with your actual lab UUID from the lab table
INSERT INTO public.lab_test_formulas (
    lab_id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
)
VALUES (
    'YOUR_LAB_ID'::UUID,  -- Replace with your actual lab_id
    'CBC (Complete Blood Count)',  -- The main test name
    'Mean Cell Volume',     -- The sub-test that will be auto-calculated
    '(Packed Cell Volume / Red Cell Count) * 10',  -- The formula
    'Numeric',
    true
)
ON CONFLICT (lab_id, test_name, sub_test_name)
DO UPDATE SET
    formula = EXCLUDED.formula,
    test_type = EXCLUDED.test_type,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Verify the insertion
SELECT
    id,
    test_name,
    sub_test_name,
    formula,
    test_type,
    is_active
FROM public.lab_test_formulas
WHERE sub_test_name = 'Mean Cell Volume';

-- ========================================================
-- ALTERNATIVE: If you want to insert formulas for ALL labs
-- ========================================================
-- This will add the formula for every lab in your system

-- Uncomment the below query to insert for all labs:
/*
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
*/

SELECT 'Mean Cell Volume formula inserted successfully!' AS status;
