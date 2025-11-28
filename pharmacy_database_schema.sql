-- Enterprise Pharmacy Module Database Schema
-- Created: 2025-06-13

-- 1. Medicine Categories and Classifications
CREATE TABLE IF NOT EXISTS medicine_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES medicine_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Medicine Manufacturers
CREATE TABLE IF NOT EXISTS medicine_manufacturers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_name VARCHAR(255) NOT NULL,
    manufacturer_code VARCHAR(50) UNIQUE,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    license_number VARCHAR(100),
    gst_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Medicine Master (Drug Database)
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    medicine_code VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    category_id UUID REFERENCES medicine_categories(id),
    manufacturer_id UUID REFERENCES medicine_manufacturers(id),
    
    -- Medicine Details
    strength VARCHAR(100), -- e.g., "500mg", "10ml"
    dosage_form VARCHAR(50), -- Tablet, Capsule, Syrup, Injection, etc.
    pack_size INTEGER, -- Number of units per pack
    unit_of_measurement VARCHAR(20), -- Piece, ml, gm, etc.
    
    -- Regulatory Information
    schedule_type VARCHAR(20), -- H, H1, X, etc.
    prescription_required BOOLEAN DEFAULT true,
    controlled_substance BOOLEAN DEFAULT false,
    
    -- Pricing
    mrp DECIMAL(10,2) NOT NULL,
    purchase_rate DECIMAL(10,2),
    selling_rate DECIMAL(10,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    gst_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Stock Management
    minimum_stock_level INTEGER DEFAULT 10,
    reorder_level INTEGER DEFAULT 20,
    maximum_stock_level INTEGER DEFAULT 1000,
    
    -- Additional Information
    side_effects TEXT,
    contraindications TEXT,
    drug_interactions TEXT,
    storage_conditions TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Medicine Inventory/Stock
CREATE TABLE IF NOT EXISTS medicine_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    
    -- Stock Quantities
    received_quantity INTEGER NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER DEFAULT 0, -- For pending prescriptions
    damaged_stock INTEGER DEFAULT 0,
    
    -- Purchase Information
    supplier_id UUID REFERENCES medicine_manufacturers(id),
    purchase_order_id UUID,
    purchase_rate DECIMAL(10,2),
    purchase_date DATE,
    
    -- Location
    rack_number VARCHAR(50),
    shelf_location VARCHAR(100),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(medicine_id, batch_number)
);

-- 5. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID, -- Reference to doctors table if exists
    doctor_name VARCHAR(255),
    
    -- Prescription Details
    prescription_date DATE NOT NULL,
    diagnosis TEXT,
    symptoms TEXT,
    vital_signs JSONB, -- Blood pressure, temperature, etc.
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIALLY_DISPENSED', 'DISPENSED', 'CANCELLED')),
    priority VARCHAR(20) DEFAULT 'NORMAL' CHECK (priority IN ('NORMAL', 'URGENT', 'EMERGENCY')),
    
    -- Financial
    total_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Timestamps
    dispensed_at TIMESTAMP WITH TIME ZONE,
    dispensed_by UUID, -- User who dispensed
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Prescription Items (Medicines in prescription)
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    
    -- Prescription Details
    quantity_prescribed INTEGER NOT NULL,
    quantity_dispensed INTEGER DEFAULT 0,
    
    -- Dosage Instructions
    dosage_frequency VARCHAR(100), -- "Twice daily", "Every 8 hours"
    dosage_timing VARCHAR(100), -- "Before meals", "After meals"
    duration_days INTEGER,
    special_instructions TEXT,
    
    -- Pricing
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Dispensing
    batch_numbers TEXT[], -- Array of batch numbers used for dispensing
    dispensed_at TIMESTAMP WITH TIME ZONE,
    
    is_substituted BOOLEAN DEFAULT false,
    substitute_medicine_id UUID REFERENCES medicines(id),
    substitute_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Medicine Sales/Billing
CREATE TABLE IF NOT EXISTS medicine_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    prescription_id UUID REFERENCES prescriptions(id),
    
    -- Sale Details
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sale_type VARCHAR(20) DEFAULT 'PRESCRIPTION' CHECK (sale_type IN ('PRESCRIPTION', 'OTC', 'EMERGENCY')),
    
    -- Financial Details
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Payment Details
    payment_method VARCHAR(20) DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'INSURANCE', 'CREDIT')),
    payment_reference VARCHAR(100),
    insurance_claim_number VARCHAR(100),
    
    -- Staff
    cashier_id UUID, -- User who processed the sale
    pharmacist_id UUID, -- Pharmacist who verified
    
    -- Status
    status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED')),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Medicine Sale Items
CREATE TABLE IF NOT EXISTS medicine_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES medicine_sales(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    inventory_id UUID REFERENCES medicine_inventory(id),
    
    -- Sale Item Details
    quantity_sold INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Batch Information
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES medicine_manufacturers(id),
    
    -- Order Details
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    
    -- Financial
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED')),
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    
    -- Order Details
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Batch Information (filled when received)
    batch_number VARCHAR(100),
    manufacturing_date DATE,
    expiry_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Stock Movements/Transactions
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID REFERENCES medicines(id),
    inventory_id UUID REFERENCES medicine_inventory(id),
    
    -- Movement Details
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', 'DAMAGE', 'EXPIRY')),
    reference_type VARCHAR(20), -- 'SALE', 'PURCHASE', 'ADJUSTMENT', 'PRESCRIPTION'
    reference_id UUID, -- ID of the related transaction
    
    -- Quantities
    quantity_before INTEGER NOT NULL,
    quantity_changed INTEGER NOT NULL, -- Positive for IN, Negative for OUT
    quantity_after INTEGER NOT NULL,
    
    -- Details
    reason TEXT,
    performed_by UUID, -- User who performed the movement
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Medicine Returns
CREATE TABLE IF NOT EXISTS medicine_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(50) UNIQUE NOT NULL,
    original_sale_id UUID REFERENCES medicine_sales(id),
    patient_id UUID REFERENCES patients(id),
    
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
    
    -- Approval
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Medicine Return Items
CREATE TABLE IF NOT EXISTS medicine_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES medicine_returns(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id),
    original_sale_item_id UUID REFERENCES medicine_sale_items(id),
    
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

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category_id);
CREATE INDEX IF NOT EXISTS idx_medicines_manufacturer ON medicines(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_medicines_code ON medicines(medicine_code);

CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON medicine_inventory(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON medicine_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_batch ON medicine_inventory(batch_number);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(prescription_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

CREATE INDEX IF NOT EXISTS idx_sales_patient ON medicine_sales(patient_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON medicine_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_prescription ON medicine_sales(prescription_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_medicine ON stock_movements(medicine_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);

-- Enable RLS on all pharmacy tables
ALTER TABLE medicine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_return_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow all for authenticated users" ON medicine_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON medicine_manufacturers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON medicines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON medicine_inventory FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON prescriptions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON prescription_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON medicine_sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON medicine_sale_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON purchase_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON purchase_order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON stock_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON medicine_returns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON medicine_return_items FOR ALL USING (auth.role() = 'authenticated');

SELECT 'Pharmacy database schema created successfully!' as status;