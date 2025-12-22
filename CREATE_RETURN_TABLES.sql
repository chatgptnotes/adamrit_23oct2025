-- =====================================================
-- CREATE MEDICINE RETURN TABLES FOR PHARMACY MODULE
-- =====================================================
-- This creates the missing tables that ReturnSales.tsx expects

-- 1. Create medicine_returns table (main return header)
CREATE TABLE IF NOT EXISTS public.medicine_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(50) UNIQUE NOT NULL,
    original_sale_id BIGINT REFERENCES public.pharmacy_sales(sale_id),
    patient_id UUID, -- Will link to patients table
    
    -- Return Details
    return_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    return_reason TEXT NOT NULL,
    return_type VARCHAR(20) DEFAULT 'PATIENT' CHECK (return_type IN ('PATIENT', 'DAMAGED', 'EXPIRED', 'RECALLED')),
    
    -- Financial
    refund_amount DECIMAL(10,2) DEFAULT 0,
    processing_fee DECIMAL(10,2) DEFAULT 0,
    net_refund DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PROCESSED', 'REJECTED')),
    
    -- Approval & Processing
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_by VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Multi-hospital support
    hospital_name VARCHAR(100),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create medicine_return_items table (return line items)
CREATE TABLE IF NOT EXISTS public.medicine_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES public.medicine_returns(id) ON DELETE CASCADE,
    medicine_id UUID, -- Will link to medication table
    original_sale_item_id BIGINT REFERENCES public.pharmacy_sale_items(sale_item_id),
    
    -- Return Details
    quantity_returned INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    
    -- Batch Information
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    -- Quality Check
    medicine_condition VARCHAR(20) DEFAULT 'GOOD' CHECK (medicine_condition IN ('GOOD', 'DAMAGED', 'EXPIRED', 'OPENED')),
    can_restock BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create basic inventory tracking table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.medicine_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL,
    batch_number VARCHAR(100),
    quantity_in_stock INTEGER DEFAULT 0,
    expiry_date DATE,
    
    -- Multi-hospital support  
    hospital_name VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate batches
    UNIQUE(medicine_id, batch_number, hospital_name)
);

-- 4. Enable Row Level Security (but keep permissive for now)
ALTER TABLE public.medicine_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_inventory ENABLE ROW LEVEL SECURITY;

-- 5. Create permissive policies for authenticated users
CREATE POLICY "Allow all for authenticated users" ON public.medicine_returns 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.medicine_return_items 
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.medicine_inventory 
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Create indexes for performance
CREATE INDEX idx_medicine_returns_patient ON public.medicine_returns(patient_id);
CREATE INDEX idx_medicine_returns_sale ON public.medicine_returns(original_sale_id);
CREATE INDEX idx_medicine_returns_hospital ON public.medicine_returns(hospital_name);
CREATE INDEX idx_medicine_returns_date ON public.medicine_returns(return_date);

CREATE INDEX idx_medicine_return_items_return ON public.medicine_return_items(return_id);
CREATE INDEX idx_medicine_return_items_medicine ON public.medicine_return_items(medicine_id);
CREATE INDEX idx_medicine_return_items_sale_item ON public.medicine_return_items(original_sale_item_id);

CREATE INDEX idx_medicine_inventory_medicine ON public.medicine_inventory(medicine_id);
CREATE INDEX idx_medicine_inventory_batch ON public.medicine_inventory(batch_number);
CREATE INDEX idx_medicine_inventory_hospital ON public.medicine_inventory(hospital_name);

-- 7. Grant permissions to authenticated users
GRANT ALL ON public.medicine_returns TO authenticated;
GRANT ALL ON public.medicine_return_items TO authenticated;
GRANT ALL ON public.medicine_inventory TO authenticated;

-- 8. Create updated_at trigger for medicine_returns
CREATE OR REPLACE FUNCTION public.update_medicine_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_medicine_returns_timestamp
    BEFORE UPDATE ON public.medicine_returns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_medicine_returns_updated_at();

-- 9. Create updated_at trigger for medicine_inventory  
CREATE OR REPLACE FUNCTION public.update_medicine_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_medicine_inventory_timestamp
    BEFORE UPDATE ON public.medicine_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_medicine_inventory_updated_at();

-- 10. Verification queries
SELECT 
    'medicine_returns' as table_name,
    count(*) as record_count
FROM public.medicine_returns
UNION ALL
SELECT 
    'medicine_return_items' as table_name,
    count(*) as record_count  
FROM public.medicine_return_items
UNION ALL
SELECT 
    'medicine_inventory' as table_name,
    count(*) as record_count
FROM public.medicine_inventory;

-- ✅ Success message
SELECT 'Return tables created successfully! Run this SQL in Supabase SQL Editor.' as status;