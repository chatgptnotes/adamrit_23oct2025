-- Add patient information fields to lab_results table
ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS patient_age INTEGER,
ADD COLUMN IF NOT EXISTS patient_gender VARCHAR(20);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_name ON lab_results(patient_name);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_age ON lab_results(patient_age);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_gender ON lab_results(patient_gender);