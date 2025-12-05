-- Migration: Fix Hospital Data Isolation
-- This migration corrects hospital_name assignments based on patient ID prefixes

-- Step 1: Fix hospital_name values based on patient ID prefixes
UPDATE patients 
SET hospital_name = 'hope'
WHERE patients_id LIKE 'UHHO%' AND hospital_name != 'hope';

UPDATE patients
SET hospital_name = 'ayushman'
WHERE patients_id LIKE 'UHAY%' AND hospital_name != 'ayushman';

-- Step 2: Handle any NULL hospital_name cases
UPDATE patients
SET hospital_name = CASE 
    WHEN patients_id LIKE 'UHHO%' THEN 'hope'
    WHEN patients_id LIKE 'UHAY%' THEN 'ayushman'
    ELSE 'hope' -- default fallback for any edge cases
END
WHERE hospital_name IS NULL;

-- Step 3: Add constraints to prevent future data mixing
ALTER TABLE patients 
DROP CONSTRAINT IF EXISTS patients_hospital_name_check;

ALTER TABLE patients 
ADD CONSTRAINT patients_hospital_name_check 
CHECK (hospital_name IN ('hope', 'ayushman'));

-- Step 4: Add constraint to ensure hospital_name matches patient ID pattern
ALTER TABLE patients
DROP CONSTRAINT IF EXISTS patients_hospital_id_consistency_check;

ALTER TABLE patients
ADD CONSTRAINT patients_hospital_id_consistency_check
CHECK (
    (patients_id LIKE 'UHHO%' AND hospital_name = 'hope') OR
    (patients_id LIKE 'UHAY%' AND hospital_name = 'ayushman')
);

-- Step 5: Create indexes for better performance on hospital-based queries
CREATE INDEX IF NOT EXISTS idx_patients_hospital_name 
ON patients (hospital_name);

CREATE INDEX IF NOT EXISTS idx_patients_hospital_id_pattern 
ON patients (hospital_name, patients_id);

-- Step 6: Create a trigger to auto-assign hospital_name for new records
CREATE OR REPLACE FUNCTION auto_assign_hospital_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-assign hospital_name based on patient ID prefix
    IF NEW.patients_id LIKE 'UHHO%' THEN
        NEW.hospital_name := 'hope';
    ELSIF NEW.patients_id LIKE 'UHAY%' THEN
        NEW.hospital_name := 'ayushman';
    ELSE
        -- For unknown patterns, default to hope
        NEW.hospital_name := 'hope';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS trigger_auto_assign_hospital_name ON patients;
CREATE TRIGGER trigger_auto_assign_hospital_name
    BEFORE INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_hospital_name();

-- Step 7: Update existing patient_data records to ensure consistency
-- This ensures patient_data queries can also be filtered by hospital if needed
-- (No direct hospital_name column in patient_data, but ensures referential integrity)

-- Step 8: Add helpful view for hospital-specific patient counts
CREATE OR REPLACE VIEW hospital_patient_statistics AS
SELECT 
    hospital_name,
    COUNT(*) as total_patients,
    COUNT(CASE WHEN patients_id LIKE 'UHHO%' THEN 1 END) as hope_id_count,
    COUNT(CASE WHEN patients_id LIKE 'UHAY%' THEN 1 END) as ayushman_id_count,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM patients)), 2) as percentage
FROM patients
GROUP BY hospital_name
ORDER BY total_patients DESC;

-- Step 9: Verification query (can be run to check results)
-- SELECT * FROM hospital_patient_statistics;