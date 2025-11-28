-- =====================================================
-- COMPLETE PHARMACY MIGRATION (FIXED VERSION)
-- Handles existing functions and views properly
-- =====================================================

-- =====================================================
-- STEP 0: Drop existing objects to avoid conflicts
-- =====================================================

-- Drop existing functions (all overloads)
DROP FUNCTION IF EXISTS public.create_pharmacy_sale(TEXT, BIGINT, TEXT, BIGINT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.create_pharmacy_sale(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);

-- Drop existing views
DROP VIEW IF EXISTS public.v_pharmacy_sales_complete CASCADE;
DROP VIEW IF EXISTS public.v_pharmacy_today_sales CASCADE;
DROP VIEW IF EXISTS public.v_pharmacy_low_stock_alert CASCADE;

-- Drop existing tables (will recreate with correct types)
DROP TABLE IF EXISTS public.pharmacy_sale_items CASCADE;
DROP TABLE IF EXISTS public.pharmacy_sales CASCADE;

-- =====================================================
-- STEP 1: Enhance medication table
-- =====================================================

-- Add new columns to existing medication table
ALTER TABLE public.medication
  -- Stock Management
  ADD COLUMN IF NOT EXISTS loose_stock_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minimum_stock INTEGER,
  ADD COLUMN IF NOT EXISTS maximum_stock INTEGER,
  ADD COLUMN IF NOT EXISTS reorder_level INTEGER,
  ADD COLUMN IF NOT EXISTS pack_size INTEGER DEFAULT 1,

  -- Product Identification
  ADD COLUMN IF NOT EXISTS drug_id_external TEXT,
  ADD COLUMN IF NOT EXISTS product_code TEXT,

  -- Medicine Details
  ADD COLUMN IF NOT EXISTS dosage_form TEXT,
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS therapeutic_category TEXT,
  ADD COLUMN IF NOT EXISTS med_strength_uom TEXT,

  -- Business Fields
  ADD COLUMN IF NOT EXISTS profit_percentage DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS expensive_product BOOLEAN DEFAULT FALSE,

  -- Ward-based Discounts
  ADD COLUMN IF NOT EXISTS gen_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS spcl_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS dlx_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS semi_spcl_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS isolation_ward_discount DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS opd_general_ward_discount DECIMAL(5,2),

  -- Flags
  ADD COLUMN IF NOT EXISTS is_common BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_favourite BOOLEAN DEFAULT FALSE,

  -- Additional Info
  ADD COLUMN IF NOT EXISTS patient_info TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_medication_drug_id ON public.medication(drug_id_external);
CREATE INDEX IF NOT EXISTS idx_medication_product_code ON public.medication(product_code);
CREATE INDEX IF NOT EXISTS idx_medication_item_code ON public.medication(item_code);
CREATE INDEX IF NOT EXISTS idx_medication_barcode ON public.medication(barcode);
CREATE INDEX IF NOT EXISTS idx_medication_supplier ON public.medication(supplier_id);
CREATE INDEX IF NOT EXISTS idx_medication_manufacturer ON public.medication(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_medication_reorder ON public.medication(reorder_level) WHERE reorder_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_medication_stock ON public.medication(stock);
CREATE INDEX IF NOT EXISTS idx_medication_deleted ON public.medication(is_deleted) WHERE is_deleted = FALSE;

-- Update existing records with default values
UPDATE public.medication
SET
  pack_size = COALESCE(pack_size, 1),
  loose_stock_quantity = COALESCE(loose_stock_quantity, 0),
  expensive_product = COALESCE(expensive_product, FALSE),
  is_common = COALESCE(is_common, FALSE),
  is_favourite = COALESCE(is_favourite, FALSE),
  is_deleted = COALESCE(is_deleted, FALSE),
  is_implant = COALESCE(is_implant, FALSE)
WHERE pack_size IS NULL
   OR loose_stock_quantity IS NULL
   OR expensive_product IS NULL;

-- =====================================================
-- STEP 2: Create pharmacy_sales table (WITH VARCHAR COLUMNS)
-- =====================================================

CREATE TABLE public.pharmacy_sales (
    sale_id BIGSERIAL PRIMARY KEY,
    sale_type VARCHAR(50),

    -- ✅ VARCHAR from the start - no conversion needed
    patient_id VARCHAR(255),
    visit_id VARCHAR(255),

    patient_name VARCHAR(255),
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Financial Details
    subtotal DECIMAL(10, 2),
    discount DECIMAL(10, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    tax_gst DECIMAL(10, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2),

    -- Payment Info
    payment_method VARCHAR(20) CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'INSURANCE')),
    payment_status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'REFUNDED', 'CANCELLED')),

    -- Additional Info
    prescription_number VARCHAR(100),
    doctor_id BIGINT,
    doctor_name VARCHAR(255),
    ward_type VARCHAR(50),
    remarks TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.pharmacy_sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pharmacy_sales
CREATE POLICY "Enable read access for authenticated users" ON public.pharmacy_sales
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.pharmacy_sales
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.pharmacy_sales
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- STEP 3: Create pharmacy_sale_items table
-- =====================================================

CREATE TABLE public.pharmacy_sale_items (
    sale_item_id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL,

    -- Medication Reference
    medication_id UUID NOT NULL,
    medication_name VARCHAR(255),
    generic_name VARCHAR(255),

    -- Product Details
    item_code VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date DATE,

    -- Stock & Quantity
    quantity INTEGER NOT NULL,
    pack_size INTEGER DEFAULT 1,
    loose_quantity INTEGER DEFAULT 0,

    -- Pricing
    unit_price DECIMAL(10, 2),
    mrp DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),

    -- Discounts
    discount DECIMAL(10, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    ward_discount DECIMAL(5, 2) DEFAULT 0,

    -- Tax
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 0,

    -- Totals
    total_price DECIMAL(10, 2),

    -- Additional Info
    manufacturer VARCHAR(255),
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    is_implant BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Foreign Keys
    CONSTRAINT fk_sale FOREIGN KEY (sale_id)
        REFERENCES public.pharmacy_sales(sale_id) ON DELETE CASCADE,
    CONSTRAINT fk_medication FOREIGN KEY (medication_id)
        REFERENCES public.medication(id)
);

-- Enable Row Level Security
ALTER TABLE public.pharmacy_sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pharmacy_sale_items
CREATE POLICY "Enable read access for authenticated users" ON public.pharmacy_sale_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.pharmacy_sale_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_pharmacy_sales_patient ON public.pharmacy_sales(patient_id);
CREATE INDEX idx_pharmacy_sales_visit ON public.pharmacy_sales(visit_id);
CREATE INDEX idx_pharmacy_sales_date ON public.pharmacy_sales(sale_date);
CREATE INDEX idx_pharmacy_sales_payment ON public.pharmacy_sales(payment_method);
CREATE INDEX idx_pharmacy_sales_status ON public.pharmacy_sales(payment_status);
CREATE INDEX idx_pharmacy_sale_items_sale ON public.pharmacy_sale_items(sale_id);
CREATE INDEX idx_pharmacy_sale_items_medication ON public.pharmacy_sale_items(medication_id);

-- =====================================================
-- STEP 4: Create trigger for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_pharmacy_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_pharmacy_sales_timestamp
BEFORE UPDATE ON public.pharmacy_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_pharmacy_sales_updated_at();

-- =====================================================
-- STEP 5: Create useful views
-- =====================================================

-- Complete Sales View
CREATE OR REPLACE VIEW public.v_pharmacy_sales_complete AS
SELECT
    ps.sale_id,
    ps.sale_type,
    ps.patient_id,          -- VARCHAR(255)
    ps.patient_name,
    ps.visit_id,            -- VARCHAR(255)
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

-- Today's Sales Summary
CREATE OR REPLACE VIEW public.v_pharmacy_today_sales AS
SELECT
    COUNT(DISTINCT sale_id) as total_sales,
    SUM(total_amount) as total_revenue,
    SUM(discount) as total_discount,
    COUNT(DISTINCT patient_id) as unique_patients,
    payment_method,
    COUNT(*) as sales_by_payment
FROM public.pharmacy_sales
WHERE DATE(sale_date) = CURRENT_DATE
GROUP BY payment_method;

-- Low Stock Alert View
CREATE OR REPLACE VIEW public.v_pharmacy_low_stock_alert AS
SELECT
    m.id,
    m.name,
    m.generic_name,
    m.item_code,
    CAST(m.stock AS INTEGER) as current_stock,
    m.reorder_level,
    m.minimum_stock,
    m.supplier_name,
    m.manufacturer,
    m.shelf
FROM public.medication m
WHERE m.is_deleted = FALSE
  AND (
    (m.reorder_level IS NOT NULL AND CAST(m.stock AS INTEGER) <= m.reorder_level)
    OR (m.minimum_stock IS NOT NULL AND CAST(m.stock AS INTEGER) <= m.minimum_stock)
  )
ORDER BY CAST(m.stock AS INTEGER) ASC;

-- =====================================================
-- STEP 6: Create RPC function for creating sales
-- =====================================================

-- Create function with TEXT parameters (matches VARCHAR columns)
CREATE OR REPLACE FUNCTION public.create_pharmacy_sale(
    p_sale_type TEXT,
    p_patient_id TEXT,              -- TEXT to match VARCHAR(255)
    p_patient_name TEXT,
    p_visit_id TEXT,                -- TEXT to match VARCHAR(255)
    p_payment_method TEXT,
    p_items JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id BIGINT;
    v_subtotal DECIMAL(10,2) := 0;
    v_total_discount DECIMAL(10,2) := 0;
    v_total_tax DECIMAL(10,2) := 0;
    v_total_amount DECIMAL(10,2) := 0;
    v_item JSONB;
BEGIN
    -- Calculate totals from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_subtotal := v_subtotal + ((v_item->>'quantity')::INT * (v_item->>'unit_price')::DECIMAL);
        v_total_discount := v_total_discount + COALESCE((v_item->>'discount')::DECIMAL, 0);
    END LOOP;

    v_total_tax := v_subtotal * 0.09; -- 9% GST
    v_total_amount := v_subtotal - v_total_discount + v_total_tax;

    -- Insert sale
    INSERT INTO public.pharmacy_sales (
        sale_type, patient_id, patient_name, visit_id,
        subtotal, discount, tax_gst, total_amount,
        payment_method, created_by
    )
    VALUES (
        p_sale_type, p_patient_id, p_patient_name, p_visit_id,
        v_subtotal, v_total_discount, v_total_tax, v_total_amount,
        p_payment_method, auth.uid()
    )
    RETURNING sale_id INTO v_sale_id;

    -- Insert sale items
    INSERT INTO public.pharmacy_sale_items (
        sale_id, medication_id, medication_name, generic_name,
        quantity, unit_price, discount, total_price,
        item_code, batch_number
    )
    SELECT
        v_sale_id,
        (item->>'medication_id')::UUID,
        item->>'medication_name',
        item->>'generic_name',
        (item->>'quantity')::INT,
        (item->>'unit_price')::DECIMAL,
        COALESCE((item->>'discount')::DECIMAL, 0),
        ((item->>'quantity')::INT * (item->>'unit_price')::DECIMAL) - COALESCE((item->>'discount')::DECIMAL, 0),
        item->>'item_code',
        item->>'batch_number'
    FROM jsonb_array_elements(p_items) AS item;

    RETURN v_sale_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_pharmacy_sale TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check pharmacy_sales table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pharmacy_sales'
AND column_name IN ('patient_id', 'visit_id')
ORDER BY ordinal_position;

-- Expected output:
-- patient_id | character varying | 255
-- visit_id   | character varying | 255

-- Check pharmacy_sale_items table exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pharmacy_sale_items'
ORDER BY ordinal_position;

-- Check views exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'v_pharmacy%';

-- Expected output:
-- v_pharmacy_sales_complete | VIEW
-- v_pharmacy_today_sales | VIEW
-- v_pharmacy_low_stock_alert | VIEW

-- Check function exists with correct signature
SELECT proname, prokind, proargtypes::regtype[]
FROM pg_proc
WHERE proname = 'create_pharmacy_sale'
AND pronamespace = 'public'::regnamespace;

-- Expected output:
-- create_pharmacy_sale | f | {text,text,text,text,text,jsonb}

-- ✅ Done! All objects created successfully with VARCHAR columns
