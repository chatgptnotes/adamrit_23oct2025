-- ========================================
-- Add Quantity Support to visit_radiology Table
-- Enables quantity-based duplicate handling for radiology services
-- Similar to visit_labs and visit_mandatory_services tables
-- ========================================

-- Remove existing UNIQUE constraint that prevents duplicate radiology services
-- This allows the same radiology service to be added multiple times with different quantities
ALTER TABLE visit_radiology DROP CONSTRAINT IF EXISTS visit_radiology_visit_id_radiology_id_key;
ALTER TABLE visit_radiology DROP CONSTRAINT IF EXISTS unique_visit_radiology;

-- Add cost column to store actual radiology service price
-- This stores the total cost (quantity × unit rate)
ALTER TABLE visit_radiology ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0.00;

-- Add quantity column with default value
-- Tracks how many times this radiology service was ordered
ALTER TABLE visit_radiology ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 NOT NULL;

-- Add unit_rate column to store individual radiology service price
-- This stores the price per unit for consistent rate display
ALTER TABLE visit_radiology ADD COLUMN IF NOT EXISTS unit_rate DECIMAL(10,2) DEFAULT 0.00;

-- Update existing records to have proper cost and unit_rate values
-- For existing records, we'll set unit_rate equal to cost (assuming quantity = 1)
UPDATE visit_radiology
SET unit_rate = COALESCE(cost, 0.00),
    quantity = 1,
    cost = COALESCE(cost, 0.00)
WHERE unit_rate IS NULL OR unit_rate = 0;

-- Add index for better performance on visit_id lookups with quantity operations
CREATE INDEX IF NOT EXISTS idx_visit_radiology_visit_id_radiology_id ON visit_radiology(visit_id, radiology_id);

-- Add index for quantity-based queries
CREATE INDEX IF NOT EXISTS idx_visit_radiology_quantity ON visit_radiology(quantity);

-- Add comments for documentation
COMMENT ON COLUMN visit_radiology.quantity IS 'Number of times this radiology service was ordered for the visit';
COMMENT ON COLUMN visit_radiology.cost IS 'Total cost for this radiology service (quantity × unit_rate)';
COMMENT ON COLUMN visit_radiology.unit_rate IS 'Price per unit for this radiology service';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'visit_radiology'
AND column_name IN ('quantity', 'cost', 'unit_rate')
ORDER BY ordinal_position;

-- Show sample of updated data structure
SELECT visit_id, radiology_id, quantity, unit_rate, cost, status, ordered_date
FROM visit_radiology
LIMIT 5;

-- Migration complete message
DO $$
BEGIN
    RAISE NOTICE 'visit_radiology table migration completed successfully!';
    RAISE NOTICE 'Added columns: quantity, cost, unit_rate';
    RAISE NOTICE 'Removed UNIQUE constraints to allow quantity-based duplicates';
    RAISE NOTICE 'Added performance indexes for quantity operations';
END $$;