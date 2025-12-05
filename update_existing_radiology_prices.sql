-- ========================================
-- Update Existing Radiology Records with Proper Pricing
-- Populates unit_rate and cost fields for existing visit_radiology records
-- Uses actual prices from radiology table
-- ========================================

-- First, let's see the current state of visit_radiology records
SELECT
    vr.visit_id,
    vr.radiology_id,
    r.name as radiology_name,
    r.cost as actual_radiology_cost_text,
    CASE
        WHEN r.cost ~ '^[0-9]+\.?[0-9]*$' THEN CAST(r.cost AS DECIMAL(10,2))
        ELSE 0.00
    END as actual_radiology_cost_numeric,
    vr.quantity,
    vr.unit_rate as current_unit_rate,
    vr.cost as current_total_cost,
    vr.status,
    vr.ordered_date
FROM visit_radiology vr
LEFT JOIN radiology r ON vr.radiology_id = r.id
WHERE vr.unit_rate = 0 OR vr.cost = 0
ORDER BY vr.ordered_date DESC;

-- Show what the update will do
SELECT
    'Before Update' as status,
    COUNT(*) as records_with_zero_pricing
FROM visit_radiology
WHERE unit_rate = 0 OR cost = 0;

-- Update existing visit_radiology records with proper pricing from radiology table
-- Handle TEXT to NUMERIC conversion safely
UPDATE visit_radiology
SET
    unit_rate = CASE
        WHEN radiology.cost ~ '^[0-9]+\.?[0-9]*$' THEN CAST(radiology.cost AS DECIMAL(10,2))
        ELSE 0.00
    END,
    cost = (CASE
        WHEN radiology.cost ~ '^[0-9]+\.?[0-9]*$' THEN CAST(radiology.cost AS DECIMAL(10,2))
        ELSE 0.00
    END) * COALESCE(visit_radiology.quantity, 1)
FROM radiology
WHERE visit_radiology.radiology_id = radiology.id
AND (visit_radiology.unit_rate = 0 OR visit_radiology.cost = 0);

-- Show results after update
SELECT
    'After Update' as status,
    COUNT(*) as records_with_zero_pricing
FROM visit_radiology
WHERE unit_rate = 0 OR cost = 0;

-- Verify the updated data
SELECT
    vr.visit_id,
    vr.radiology_id,
    r.name as radiology_name,
    r.cost as radiology_table_cost_text,
    CASE
        WHEN r.cost ~ '^[0-9]+\.?[0-9]*$' THEN CAST(r.cost AS DECIMAL(10,2))
        ELSE 0.00
    END as radiology_table_cost_numeric,
    vr.quantity,
    vr.unit_rate,
    vr.cost as total_cost,
    (vr.unit_rate * vr.quantity) as calculated_cost,
    CASE
        WHEN ABS(vr.cost - (vr.unit_rate * vr.quantity)) < 0.01 THEN '✓ Correct'
        ELSE '✗ Mismatch'
    END as cost_validation,
    vr.status,
    vr.ordered_date
FROM visit_radiology vr
LEFT JOIN radiology r ON vr.radiology_id = r.id
ORDER BY vr.ordered_date DESC
LIMIT 10;

-- Summary statistics
SELECT
    COUNT(*) as total_records,
    COUNT(CASE WHEN unit_rate > 0 THEN 1 END) as records_with_unit_rate,
    COUNT(CASE WHEN cost > 0 THEN 1 END) as records_with_cost,
    AVG(unit_rate) as avg_unit_rate,
    AVG(cost) as avg_total_cost,
    SUM(cost) as total_radiology_value
FROM visit_radiology;

-- Check for any records that still need attention
SELECT
    vr.visit_id,
    vr.radiology_id,
    'Missing radiology details' as issue,
    vr.quantity,
    vr.unit_rate,
    vr.cost
FROM visit_radiology vr
LEFT JOIN radiology r ON vr.radiology_id = r.id
WHERE r.id IS NULL;

-- Check for radiology records with invalid cost data
SELECT
    r.id,
    r.name,
    r.cost as cost_text,
    CASE
        WHEN r.cost ~ '^[0-9]+\.?[0-9]*$' THEN 'Valid numeric'
        WHEN r.cost IS NULL THEN 'NULL value'
        WHEN r.cost = '' THEN 'Empty string'
        ELSE 'Invalid format'
    END as cost_validation,
    COUNT(vr.id) as visit_radiology_count
FROM radiology r
LEFT JOIN visit_radiology vr ON r.id = vr.radiology_id
WHERE r.cost !~ '^[0-9]+\.?[0-9]*$' OR r.cost IS NULL OR r.cost = ''
GROUP BY r.id, r.name, r.cost
ORDER BY visit_radiology_count DESC;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ visit_radiology pricing update completed!';
    RAISE NOTICE 'All existing records should now have proper unit_rate and cost values';
    RAISE NOTICE 'Quantity-based duplicate handling is now ready to use';
    RAISE NOTICE 'Records with quantity > 1 will show correct total calculations';
END $$;