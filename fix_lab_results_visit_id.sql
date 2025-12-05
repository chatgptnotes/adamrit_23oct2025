-- Fix for lab results not being fetched in investigations
-- This script adds a visit_id_string column to support string-based visit IDs like "IH25F25001"

-- Add visit_id_string column to lab_results table
ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS visit_id_string VARCHAR(50);

-- Create index for better performance on string visit_id lookups
CREATE INDEX IF NOT EXISTS idx_lab_results_visit_id_string ON lab_results(visit_id_string);

-- Update existing data: if visit_id is UUID, try to map it to corresponding visit_id_string from visits table
UPDATE lab_results
SET visit_id_string = (
    SELECT v.visit_id
    FROM visits v
    WHERE v.id = lab_results.visit_id
)
WHERE visit_id IS NOT NULL AND visit_id_string IS NULL;

-- Insert some sample lab results data for testing (optional - remove if not needed)
INSERT INTO lab_results (
    visit_id_string,
    main_test_name,
    test_name,
    test_category,
    result_value,
    result_unit,
    patient_name,
    patient_age,
    patient_gender,
    created_at
) VALUES
(
    'IH25F25001',
    'KFT (Kidney Function Test)',
    'Blood Urea',
    'Biochemistry',
    '39.3',
    'mg/dl',
    'Test Patient',
    45,
    'Male',
    NOW()
),
(
    'IH25F25001',
    'KFT (Kidney Function Test)',
    'Creatinine',
    'Biochemistry',
    '1.03',
    'mg/dl',
    'Test Patient',
    45,
    'Male',
    NOW()
),
(
    'IH25F25001',
    'KFT (Kidney Function Test)',
    'Sr. Sodium',
    'Biochemistry',
    '147',
    'mmol/L',
    'Test Patient',
    45,
    'Male',
    NOW()
)
ON CONFLICT (id) DO NOTHING;