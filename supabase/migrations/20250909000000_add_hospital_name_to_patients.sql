-- Add hospital_name column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_hospital_name ON patients(hospital_name);

-- Add a comment to document the column
COMMENT ON COLUMN patients.hospital_name IS 'The name of the hospital this patient belongs to (Hope Hospital, Ayushman Hospital, etc.)';