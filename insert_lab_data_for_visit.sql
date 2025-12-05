-- First, add the visit_id_string column if it doesn't exist
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS visit_id_string VARCHAR(50);

-- Insert lab data specifically for visit ID: IH25F25001
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
-- KFT Test Results
('IH25F25001', 'KFT (Kidney Function Test)', 'Blood Urea', 'Biochemistry', '39.3', 'mg/dl', 'Test Patient', 45, 'Male', '2025-09-26 10:30:00'),
('IH25F25001', 'KFT (Kidney Function Test)', 'Creatinine', 'Biochemistry', '1.03', 'mg/dl', 'Test Patient', 45, 'Male', '2025-09-26 10:30:00'),
('IH25F25001', 'KFT (Kidney Function Test)', 'Sr. Sodium', 'Biochemistry', '147', 'mmol/L', 'Test Patient', 45, 'Male', '2025-09-26 10:30:00'),
('IH25F25001', 'KFT (Kidney Function Test)', 'Sr. Potassium', 'Biochemistry', '4.2', 'mmol/L', 'Test Patient', 45, 'Male', '2025-09-26 10:30:00'),

-- LFT Test Results
('IH25F25001', 'LFT (Liver Function Test)', 'SGPT/ALT', 'Biochemistry', '28', 'U/L', 'Test Patient', 45, 'Male', '2025-09-26 10:30:00'),
('IH25F25001', 'LFT (Liver Function Test)', 'SGOT/AST', 'Biochemistry', '32', 'U/L', 'Test Patient', 45, 'Male', '2025-09-26 10:30:00'),
('IH25F25001', 'LFT (Liver Function Test)', 'Bilirubin Total', 'Biochemistry', '1.1', 'mg/dl', 'Test Patient', 45, 'Male', '2025-09-26 10:30:00'),
('IH25F25001', 'LFT (Liver Function Test)', 'Albumin', 'Biochemistry', '4.5', 'g/dl', 'Test Patient', 45, 'Male', '2025-09-26 10:30:00'),

-- Complete Blood Count
('IH25F25001', 'CBC (Complete Blood Count)', 'Hemoglobin', 'Hematology', '12.5', 'g/dl', 'Test Patient', 45, 'Male', '2025-09-26 11:00:00'),
('IH25F25001', 'CBC (Complete Blood Count)', 'Total WBC Count', 'Hematology', '8500', '/cumm', 'Test Patient', 45, 'Male', '2025-09-26 11:00:00'),
('IH25F25001', 'CBC (Complete Blood Count)', 'Platelet Count', 'Hematology', '250000', '/cumm', 'Test Patient', 45, 'Male', '2025-09-26 11:00:00');