-- Add opd_admission_notes column to visits table
-- This column will store OPD-specific admission notes as JSONB

ALTER TABLE visits
ADD COLUMN IF NOT EXISTS opd_admission_notes JSONB DEFAULT NULL;

-- Add comment to explain the column purpose
COMMENT ON COLUMN visits.opd_admission_notes IS 'Stores OPD admission notes including diagnosis, complaints, vitals, prescriptions, advice, pathology, and other OPD-specific medical information';
