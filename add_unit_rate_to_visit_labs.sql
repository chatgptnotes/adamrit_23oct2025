-- Migration to add unit_rate column to visit_labs table
-- This enables proper rate display regardless of quantity

-- Step 1: Add unit_rate column to store the rate per unit
ALTER TABLE visit_labs
ADD COLUMN IF NOT EXISTS unit_rate DECIMAL(10,2) DEFAULT 0.00;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN visit_labs.unit_rate IS 'Rate per unit of the lab service (cost = unit_rate × quantity)';

-- Step 3: Update existing records to populate unit_rate
-- For existing records, calculate unit_rate from cost and quantity
UPDATE visit_labs
SET unit_rate = CASE
    WHEN quantity > 0 THEN cost / quantity
ELSE cost
END
WHERE unit_rate IS NULL OR unit_rate = 0;

-- Step 4: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_visit_labs_unit_rate ON visit_labs(unit_rate);

-- Step 5: Verification query
SELECT
    id,
    lab_id,
    quantity,
    cost as total_cost,
    unit_rate,
    (unit_rate * quantity) as calculated_total,
    ordered_date
FROM visit_labs
WHERE unit_rate > 0
ORDER BY ordered_date DESC
LIMIT 5;

-- Step 6: Check column was added
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'visit_labs'
AND column_name = 'unit_rate';