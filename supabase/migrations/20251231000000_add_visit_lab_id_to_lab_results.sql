-- Add visit_lab_id column to link lab_results to specific visit_labs entry
-- This ensures each lab result is linked to a specific test entry, not just visit + lab combination
ALTER TABLE lab_results ADD COLUMN IF NOT EXISTS visit_lab_id UUID;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lab_results_visit_lab_id ON lab_results(visit_lab_id);
