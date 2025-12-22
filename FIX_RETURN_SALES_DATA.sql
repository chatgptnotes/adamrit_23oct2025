-- =====================================================
-- FIX RETURN SALES - CREATE MISSING TEST DATA
-- =====================================================
-- This creates sample medicine items for existing sales

-- Step 1: Check if we have any sale items data
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
    'medication' as table_name,
    count(*) as record_count
FROM medication;

-- Step 2: Check existing sales for Test1 patient
SELECT 
    sale_id,
    bill_number,
    patient_id,
    total_amount,
    sale_date
FROM pharmacy_sales 
WHERE patient_id = 'UHH025,04001'
ORDER BY sale_date DESC;

-- Step 3: Check if medication table has data
SELECT id, name, item_code, price_per_strip 
FROM medication 
LIMIT 5;

-- Step 4: Create sample medicine items for existing sales (if medication exists)
-- First, let's create some sample medications if they don't exist
INSERT INTO medication (name, generic_name, item_code, stock, price_per_strip, created_at)
VALUES 
    ('Paracetamol 500mg', 'Paracetamol', 'P001', '100', '50.00', NOW()),
    ('Amoxicillin 250mg', 'Amoxicillin', 'A001', '80', '120.00', NOW()),
    ('Ibuprofen 400mg', 'Ibuprofen', 'I001', '60', '80.00', NOW()),
    ('Crocin Tablet', 'Paracetamol', 'C001', '150', '45.00', NOW()),
    ('Azithromycin 500mg', 'Azithromycin', 'AZ001', '40', '200.00', NOW())
ON CONFLICT (item_code) DO NOTHING;

-- Step 5: Create sample sale items for the first few sales of Test1 patient
-- Get sale IDs for Test1 patient first
WITH test_patient_sales AS (
    SELECT sale_id, total_amount, ROW_NUMBER() OVER (ORDER BY sale_date DESC) as rn
    FROM pharmacy_sales 
    WHERE patient_id = 'UHH025,04001'
    LIMIT 3
),
sample_medications AS (
    SELECT id, name, generic_name, item_code, price_per_strip
    FROM medication 
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
    total_price,
    item_code,
    batch_number,
    expiry_date,
    created_at
)
SELECT 
    tps.sale_id,
    sm.id,
    sm.name,
    sm.generic_name,
    CASE 
        WHEN tps.rn = 1 THEN 2  -- First sale: 2 items
        WHEN tps.rn = 2 THEN 1  -- Second sale: 1 item  
        ELSE 3                  -- Third sale: 3 items
    END as quantity,
    sm.price_per_strip,
    0 as discount,
    sm.price_per_strip * 0.09 as tax_amount, -- 9% GST
    sm.price_per_strip * CASE 
        WHEN tps.rn = 1 THEN 2
        WHEN tps.rn = 2 THEN 1  
        ELSE 3
    END as total_price,
    sm.item_code,
    'BATCH' || LPAD((RANDOM() * 1000)::INT::TEXT, 3, '0') as batch_number,
    (CURRENT_DATE + INTERVAL '2 years')::DATE as expiry_date,
    NOW()
FROM test_patient_sales tps
CROSS JOIN sample_medications sm
WHERE tps.rn <= 3  -- Only for first 3 sales
ON CONFLICT DO NOTHING;

-- Step 6: Verify the data was created
SELECT 
    ps.bill_number,
    ps.total_amount,
    psi.medication_name,
    psi.quantity,
    psi.unit_price,
    psi.batch_number,
    psi.expiry_date
FROM pharmacy_sales ps
JOIN pharmacy_sale_items psi ON ps.sale_id = psi.sale_id
WHERE ps.patient_id = 'UHH025,04001'
ORDER BY ps.sale_date DESC, psi.medication_name;

-- Step 7: Update sale totals to match item totals (optional)
UPDATE pharmacy_sales 
SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM pharmacy_sale_items 
    WHERE sale_id = pharmacy_sales.sale_id
)
WHERE patient_id = 'UHH025,04001'
AND EXISTS (
    SELECT 1 FROM pharmacy_sale_items 
    WHERE sale_id = pharmacy_sales.sale_id
);

-- Success message
SELECT 'Sample medicine items created for Return Sales testing!' as status;