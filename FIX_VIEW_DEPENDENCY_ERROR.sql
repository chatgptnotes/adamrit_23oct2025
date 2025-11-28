-- =====================================================
-- FIX: View Dependency Error
-- Drop view → Change columns → Recreate view
-- =====================================================

-- Step 1: Drop the dependent view
DROP VIEW IF EXISTS public.v_pharmacy_sales_complete CASCADE;

-- Step 2: Change patient_id to VARCHAR
ALTER TABLE public.pharmacy_sales
ALTER COLUMN patient_id TYPE VARCHAR(255);

-- Step 3: Change visit_id to VARCHAR
ALTER TABLE public.pharmacy_sales
ALTER COLUMN visit_id TYPE VARCHAR(255);

-- Step 4: Recreate the view
CREATE OR REPLACE VIEW public.v_pharmacy_sales_complete AS
SELECT
    ps.sale_id,
    ps.sale_type,
    ps.patient_id,
    ps.patient_name,
    ps.visit_id,
    ps.sale_date,
    ps.prescription_number,
    ps.doctor_name,
    ps.ward_type,
    ps.subtotal,
    ps.discount,
    ps.tax_gst,
    ps.total_amount,
    ps.payment_method,
    ps.payment_status,
    psi.sale_item_id,
    psi.medication_id,
    psi.medication_name,
    psi.generic_name,
    psi.item_code,
    psi.batch_number,
    psi.quantity,
    psi.pack_size,
    psi.unit_price,
    psi.discount as item_discount,
    psi.total_price,
    psi.manufacturer,
    psi.dosage_form,
    psi.strength,
    psi.is_implant,
    m.supplier_name,
    m.shelf,
    m.stock,
    m.exp_date
FROM public.pharmacy_sales ps
LEFT JOIN public.pharmacy_sale_items psi ON ps.sale_id = psi.sale_id
LEFT JOIN public.medication m ON psi.medication_id = m.id;

-- Step 5: Verify column types changed
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pharmacy_sales'
AND column_name IN ('patient_id', 'visit_id');

-- Expected output:
-- patient_id | character varying | 255
-- visit_id   | character varying | 255

-- Step 6: Verify view recreated
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'v_pharmacy_sales_complete';

-- Expected output:
-- v_pharmacy_sales_complete | VIEW

-- ✅ Done! Now test your app
