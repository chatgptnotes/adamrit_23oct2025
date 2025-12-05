-- Migration script to enable quantity-based lab services
-- This enables quantity-based duplicate handling for lab services

-- CRITICAL: Backup existing data before running this migration
-- CREATE TABLE visit_labs_backup AS SELECT * FROM visit_labs;

-- Step 1: Remove UNIQUE constraint that prevents duplicate lab services
-- This constraint blocks the same lab service from being added multiple times
ALTER TABLE visit_labs DROP CONSTRAINT IF EXISTS visit_labs_visit_id_lab_id_key;

-- Step 2: Add cost column to store actual lab service price
ALTER TABLE visit_labs
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0.00;

-- Step 3: Add quantity column with default value
ALTER TABLE visit_labs
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 NOT NULL;

-- Step 4: Update existing records to have quantity = 1 and cost = 0
UPDATE visit_labs
SET quantity = 1
WHERE quantity IS NULL;

UPDATE visit_labs
SET cost = 0.00
WHERE cost IS NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN visit_labs.quantity IS 'Number of units of this lab service ordered for the visit';
COMMENT ON COLUMN visit_labs.cost IS 'Total cost for this lab service (quantity × unit_price)';

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visit_labs_quantity ON visit_labs(quantity);
CREATE INDEX IF NOT EXISTS idx_visit_labs_cost ON visit_labs(cost);

-- Step 7: Create a new composite index for efficient queries
CREATE INDEX IF NOT EXISTS idx_visit_labs_visit_lab_quantity ON visit_labs(visit_id, lab_id, quantity);

-- Step 8: Verification queries to check the migration

-- Check that the UNIQUE constraint was removed
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'visit_labs'
AND constraint_type = 'UNIQUE';

-- Verify new columns were added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'visit_labs'
AND column_name IN ('quantity', 'cost')
ORDER BY column_name;

-- Sample query to verify data structure
SELECT
    id,
    visit_id,
    lab_id,
    quantity,
    cost,
    (cost / COALESCE(NULLIF(quantity, 0), 1)) as cost_per_unit,
    status,
    ordered_date
FROM visit_labs
ORDER BY created_at DESC
LIMIT 5;

-- Verify indexes were created
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'visit_labs'
AND indexname LIKE '%quantity%' OR indexname LIKE '%cost%';