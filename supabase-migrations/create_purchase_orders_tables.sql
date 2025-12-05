-- =====================================================
-- Purchase Orders Module - Database Migration
-- =====================================================
-- This script creates the purchase_orders and purchase_order_items tables
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Create purchase_orders table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) NOT NULL,
    order_date TIMESTAMPTZ NOT NULL,
    order_for VARCHAR(100) NULL,
    supplier_id INTEGER NULL,
    status VARCHAR(50) NULL DEFAULT 'Pending',
    notes TEXT NULL,
    subtotal NUMERIC(15, 2) NULL DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) NULL DEFAULT 0.00,
    total_amount NUMERIC(15, 2) NULL DEFAULT 0.00,
    expected_delivery_date TIMESTAMPTZ NULL,
    actual_delivery_date TIMESTAMPTZ NULL,
    approved_by VARCHAR(100) NULL,
    approved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NULL DEFAULT NOW(),

    CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
    CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number),
    CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id)
        REFERENCES public.suppliers (id) ON DELETE SET NULL
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON public.purchase_orders(order_date DESC);

-- =====================================================
-- 2. Create purchase_order_items table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL,
    medicine_id UUID NULL,
    product_name TEXT NOT NULL,
    manufacturer TEXT NULL,
    pack VARCHAR(50) NULL,
    batch_no VARCHAR(100) NULL,
    mrp NUMERIC(10, 2) NULL DEFAULT 0.00,
    sale_price NUMERIC(10, 2) NULL DEFAULT 0.00,
    purchase_price NUMERIC(10, 2) NULL DEFAULT 0.00,
    tax_percentage NUMERIC(5, 2) NULL DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) NULL DEFAULT 0.00,
    order_quantity INTEGER NOT NULL DEFAULT 0,
    amount NUMERIC(15, 2) NULL DEFAULT 0.00,
    received_quantity INTEGER NULL DEFAULT 0,
    created_at TIMESTAMPTZ NULL DEFAULT NOW(),

    CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id),
    CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id)
        REFERENCES public.purchase_orders (id) ON DELETE CASCADE,
    CONSTRAINT purchase_order_items_medicine_id_fkey FOREIGN KEY (medicine_id)
        REFERENCES public.medicine_master (id) ON DELETE SET NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_medicine_id ON public.purchase_order_items(medicine_id);

-- =====================================================
-- 3. Create trigger function for updated_at timestamp
-- =====================================================
-- This function automatically updates the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Create trigger for purchase_orders table
-- =====================================================
DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON public.purchase_orders;

CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. Create RPC function for atomic medicine quantity increment
-- =====================================================
-- This function safely increments medicine quantity
CREATE OR REPLACE FUNCTION public.increment_medicine_quantity(
    medicine_id UUID,
    qty_to_add INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.medicine_master
    SET
        quantity = COALESCE(quantity, 0) + qty_to_add,
        updated_at = NOW()
    WHERE id = medicine_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Enable Row Level Security (Optional but recommended)
-- =====================================================
-- Uncomment these if you want to enable RLS
-- ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies as needed for your authentication setup
-- Example: Allow authenticated users to read all purchase orders
-- CREATE POLICY "Allow authenticated users to read purchase orders"
--     ON public.purchase_orders FOR SELECT
--     TO authenticated
--     USING (true);

-- =====================================================
-- 7. Grant permissions (adjust based on your setup)
-- =====================================================
-- Grant permissions to authenticated users
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.increment_medicine_quantity TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================
-- After running this script:
-- 1. Verify tables are created: Check Supabase Table Editor
-- 2. Test the Purchase Order form in your application
-- 3. Verify inventory updates when PO is saved
-- =====================================================
