-- Rollback script for visit_labs quantity migration
-- Use this script if you need to revert the changes made by add_quantity_to_visit_labs.sql

-- WARNING: This will remove the quantity and cost columns and their data
-- Make sure you have a backup before running this rollback!

-- Step 1: Drop the new indexes
DROP INDEX IF EXISTS idx_visit_labs_quantity;
DROP INDEX IF EXISTS idx_visit_labs_cost;
DROP INDEX IF EXISTS idx_visit_labs_visit_lab_quantity;

-- Step 2: Remove the new columns (this will delete all quantity and cost data)
ALTER TABLE visit_labs DROP COLUMN IF EXISTS quantity;
ALTER TABLE visit_labs DROP COLUMN IF EXISTS cost;

-- Step 3: Restore the UNIQUE constraint that prevents duplicate lab services
-- NOTE: This may fail if there are duplicate (visit_id, lab_id) combinations
-- You may need to clean up duplicates first
ALTER TABLE visit_labs
ADD CONSTRAINT visit_labs_visit_id_lab_id_key UNIQUE (visit_id, lab_id);

-- Verification queries to confirm rollback
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'visit_labs'
AND column_name IN ('quantity', 'cost');

-- Check that UNIQUE constraint was restored
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'visit_labs'
AND constraint_type = 'UNIQUE';

-- Note: If you had backed up your data, you can restore it with:
-- INSERT INTO visit_labs SELECT * FROM visit_labs_backup;