-- ============================================================================
-- STEP-BY-STEP: Insert nested config using actual lab_id
-- ============================================================================

-- STEP 1: First, get your actual lab_id
SELECT id, name FROM lab LIMIT 5;

-- Copy one lab_id from above result, for example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

-- ============================================================================
-- STEP 2: Then run this query (replace lab_id in all places)
-- ============================================================================

-- Replace THIS_IS_YOUR_LAB_ID with actual UUID from STEP 1
-- For example: a1b2c3d4-e5f6-7890-abcd-ef1234567890

WITH
hemoglobin AS (
    INSERT INTO public.lab_test_config (
        lab_id, test_name, sub_test_name, unit,
        min_age, max_age, age_unit, age_description,
        gender, min_value, max_value, normal_unit,
        parent_config_id, test_level, display_order, is_active
    ) VALUES (
        'THIS_IS_YOUR_LAB_ID'::uuid,  -- ⬅️ Replace this
        'CBC', 'Hemoglobin', 'g/dL',
        18, 65, 'Years', 'Adult Male',
        'Male', 13.0, 17.0, 'g/dL',
        NULL, 1, 0, true
    ) RETURNING id
),
hba1c AS (
    INSERT INTO public.lab_test_config (
        lab_id, test_name, sub_test_name, unit,
        min_age, max_age, age_unit, age_description,
        gender, min_value, max_value, normal_unit,
        parent_config_id, test_level, display_order, is_active
    )
    SELECT
        'THIS_IS_YOUR_LAB_ID'::uuid,  -- ⬅️ Replace this
        'CBC', 'HbA1c', '%',
        18, 65, 'Years', 'Adult',
        'Both', 4.0, 5.6, '%',
        id, 2, 0, true
    FROM hemoglobin
    RETURNING id
),
wbc AS (
    INSERT INTO public.lab_test_config (
        lab_id, test_name, sub_test_name, unit,
        min_age, max_age, age_unit, age_description,
        gender, min_value, max_value, normal_unit,
        parent_config_id, test_level, display_order, is_active
    ) VALUES (
        'THIS_IS_YOUR_LAB_ID'::uuid,  -- ⬅️ Replace this
        'CBC', 'WBC Count', 'cells/μL',
        18, 65, 'Years', 'Adult',
        'Both', 4000, 11000, 'cells/μL',
        NULL, 1, 1, true
    ) RETURNING id
),
neutrophils AS (
    INSERT INTO public.lab_test_config (
        lab_id, test_name, sub_test_name, unit,
        min_age, max_age, age_unit, age_description,
        gender, min_value, max_value, normal_unit,
        parent_config_id, test_level, display_order, is_active
    )
    SELECT
        'THIS_IS_YOUR_LAB_ID'::uuid,  -- ⬅️ Replace this
        'CBC', 'Neutrophils', '%',
        18, 65, 'Years', 'Adult',
        'Both', 40, 70, '%',
        id, 2, 0, true
    FROM wbc
    RETURNING id
)
SELECT 'Success! Inserted nested configs' as status;

-- ============================================================================
-- STEP 3: Verify the data
-- ============================================================================

SELECT
    REPEAT('  ', test_level - 1) || '└─ ' || sub_test_name as hierarchy,
    test_level,
    min_value || '-' || max_value || ' ' || normal_unit as range
FROM public.lab_test_config
WHERE test_name = 'CBC'
  AND lab_id = 'THIS_IS_YOUR_LAB_ID'::uuid  -- ⬅️ Replace this
ORDER BY display_order, test_level;

-- Expected output:
-- Hemoglobin (Level 1) → 13-17 g/dL
--   └─ HbA1c (Level 2) → 4-5.6 %
-- WBC Count (Level 1) → 4000-11000 cells/μL
--   └─ Neutrophils (Level 2) → 40-70 %
