-- =====================================================
-- CREATE SAMPLE PHARMACY SALE ITEMS FOR RETURN TESTING
-- =====================================================
-- This creates sample medicine items using your actual table structure

-- Step 1: Check current data structure
SELECT 
    'pharmacy_sales' as table_name,
    count(*) as record_count
FROM pharmacy_sales
UNION ALL
SELECT 
    'pharmacy_sale_items' as table_name,
    count(*) as record_count  
FROM pharmacy_sale_items
UNION ALL
SELECT 
    'medicine_master' as table_name,
    count(*) as record_count
FROM medicine_master;

-- Step 2: Check existing sales for Test1 patient
SELECT 
    sale_id,
    bill_number,
    patient_id,
    total_amount,
    sale_date
FROM pharmacy_sales 
WHERE patient_id = 'UHH025,04001'
ORDER BY sale_date DESC
LIMIT 5;

-- Step 3: Check medicine_master data
SELECT id, medicine_name, generic_name, type 
FROM medicine_master 
WHERE is_deleted = false
LIMIT 5;

-- Step 4: Create sample medications in medicine_master if needed
INSERT INTO medicine_master (medicine_name, generic_name, type, is_deleted, created_at)
VALUES 
    ('Paracetamol 500mg', 'Paracetamol', 'Tablet', false, NOW()),
    ('Amoxicillin 250mg', 'Amoxicillin', 'Capsule', false, NOW()),
    ('Ibuprofen 400mg', 'Ibuprofen', 'Tablet', false, NOW()),
    ('Crocin Tablet', 'Paracetamol', 'Tablet', false, NOW()),
    ('Azithromycin 500mg', 'Azithromycin', 'Tablet', false, NOW())
ON CONFLICT (medicine_name) DO NOTHING;

-- Step 5: Create sample pharmacy_sale_items for Test1 patient's existing sales
WITH test_patient_sales AS (
    SELECT sale_id, total_amount, bill_number, 
           ROW_NUMBER() OVER (ORDER BY sale_date DESC) as rn
    FROM pharmacy_sales 
    WHERE patient_id = 'UHH025,04001'
    ORDER BY sale_date DESC
    LIMIT 3
),
sample_medications AS (
    SELECT id, medicine_name, generic_name, type
    FROM medicine_master 
    WHERE is_deleted = false
    ORDER BY created_at DESC
    LIMIT 5
)
INSERT INTO pharmacy_sale_items (
    sale_id,
    medication_id,
    medication_name,
    generic_name,
    quantity,
    unit_price,
    discount,
    tax_amount,
    total_amount,
    batch_number,
    expiry_date,
    created_at
)
SELECT 
    tps.sale_id,
    sm.id,
    sm.medicine_name,
    sm.generic_name,
    CASE 
        WHEN tps.rn = 1 THEN 2  -- First sale: 2 items each
        WHEN tps.rn = 2 THEN 1  -- Second sale: 1 item each 
        ELSE 3                  -- Third sale: 3 items each
    END as quantity,
    CASE sm.medicine_name
        WHEN 'Paracetamol 500mg' THEN 50.00
        WHEN 'Amoxicillin 250mg' THEN 120.00
        WHEN 'Ibuprofen 400mg' THEN 80.00
        WHEN 'Crocin Tablet' THEN 45.00
        WHEN 'Azithromycin 500mg' THEN 200.00
        ELSE 100.00
    END as unit_price,
    0 as discount,
    CASE sm.medicine_name
        WHEN 'Paracetamol 500mg' THEN 50.00 * 0.09
        WHEN 'Amoxicillin 250mg' THEN 120.00 * 0.09
        WHEN 'Ibuprofen 400mg' THEN 80.00 * 0.09
        WHEN 'Crocin Tablet' THEN 45.00 * 0.09
        WHEN 'Azithromycin 500mg' THEN 200.00 * 0.09
        ELSE 100.00 * 0.09
    END as tax_amount,
    (CASE sm.medicine_name
        WHEN 'Paracetamol 500mg' THEN 50.00
        WHEN 'Amoxicillin 250mg' THEN 120.00
        WHEN 'Ibuprofen 400mg' THEN 80.00
        WHEN 'Crocin Tablet' THEN 45.00
        WHEN 'Azithromycin 500mg' THEN 200.00
        ELSE 100.00
    END * CASE 
        WHEN tps.rn = 1 THEN 2
        WHEN tps.rn = 2 THEN 1  
        ELSE 3
    END) as total_amount,
    'BATCH' || LPAD((RANDOM() * 1000)::INT::TEXT, 3, '0') as batch_number,
    (CURRENT_DATE + INTERVAL '2 years')::DATE as expiry_date,
    NOW()
FROM test_patient_sales tps
CROSS JOIN sample_medications sm
WHERE tps.rn <= 3  -- Only for first 3 sales
ON CONFLICT DO NOTHING;

-- Step 6: Verify the created data
SELECT 
    ps.bill_number,
    ps.total_amount as sale_total,
    psi.medication_name,
    psi.quantity,
    psi.unit_price,
    psi.total_amount as item_total,
    psi.batch_number,
    psi.expiry_date
FROM pharmacy_sales ps
JOIN pharmacy_sale_items psi ON ps.sale_id = psi.sale_id
WHERE ps.patient_id = 'UHH025,04001'
ORDER BY ps.sale_date DESC, psi.medication_name;

-- Step 7: Update pharmacy_sales totals to match item totals (optional)
UPDATE pharmacy_sales 
SET total_amount = (
    SELECT COALESCE(SUM(psi.total_amount), 0)
    FROM pharmacy_sale_items psi
    WHERE psi.sale_id = pharmacy_sales.sale_id
),
subtotal = (
    SELECT COALESCE(SUM(psi.total_amount - psi.tax_amount), 0)
    FROM pharmacy_sale_items psi
    WHERE psi.sale_id = pharmacy_sales.sale_id
),
tax_gst = (
    SELECT COALESCE(SUM(psi.tax_amount), 0)
    FROM pharmacy_sale_items psi
    WHERE psi.sale_id = pharmacy_sales.sale_id
)
WHERE patient_id = 'UHH025,04001'
AND EXISTS (
    SELECT 1 FROM pharmacy_sale_items 
    WHERE sale_id = pharmacy_sales.sale_id
);

-- Step 8: Final verification - show complete data
SELECT 
    'Sample pharmacy sale items created successfully for Return Sales testing!' as status,
    COUNT(*) as items_created
FROM pharmacy_sale_items psi
JOIN pharmacy_sales ps ON psi.sale_id = ps.sale_id
WHERE ps.patient_id = 'UHH025,04001';

-- Step 9: Show what should now appear in Return Sales
SELECT 
    ps.bill_number,
    psi.medication_name,
    psi.generic_name,
    psi.quantity,
    psi.unit_price,
    psi.batch_number,
    '0' as quantity_returned,  -- No returns yet
    psi.quantity as quantity_available  -- All available for return
FROM pharmacy_sales ps
JOIN pharmacy_sale_items psi ON ps.sale_id = psi.sale_id
WHERE ps.patient_id = 'UHH025,04001'
ORDER BY ps.sale_date DESC, psi.medication_name;