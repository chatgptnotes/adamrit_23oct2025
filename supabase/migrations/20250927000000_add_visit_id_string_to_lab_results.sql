-- Add visit_id_string column to lab_results table to support string-based visit IDs
ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS visit_id_string VARCHAR(50);

-- Create index for better performance on string visit_id lookups
CREATE INDEX IF NOT EXISTS idx_lab_results_visit_id_string ON lab_results(visit_id_string);

-- Update existing data: if visit_id is UUID, try to map it to corresponding visit_id_string from visits table
-- This is a one-time migration to sync existing data
UPDATE lab_results
SET visit_id_string = (
    SELECT v.visit_id
    FROM visits v
    WHERE v.id = lab_results.visit_id
)
WHERE visit_id IS NOT NULL AND visit_id_string IS NULL;