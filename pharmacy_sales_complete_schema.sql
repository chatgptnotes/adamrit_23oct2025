-- =====================================================
-- COMPLETE PHARMACY SALES SYSTEM
-- Enhanced with pharmacy_items integration
-- =====================================================

-- Drop existing tables (if recreating)
DROP TABLE IF EXISTS pharmacy_sale_items CASCADE;
DROP TABLE IF EXISTS pharmacy_sales CASCADE;

-- =====================================================
-- MAIN SALES TABLE (Parent - ONE)
-- =====================================================
CREATE TABLE pharmacy_sales (
    sale_id SERIAL PRIMARY KEY,
    sale_type VARCHAR(50),
    patient_id INT,
    visit_id INT,
    patient_name VARCHAR(255),
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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
    doctor_id INT,
    doctor_name VARCHAR(255),
    ward_type VARCHAR(50),
    remarks TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT
);

-- =====================================================
-- SALE ITEMS TABLE (Child - MANY)
-- =====================================================
CREATE TABLE pharmacy_sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL,

    -- Medication Reference
    medication_id UUID NOT NULL,
    medication_name VARCHAR(255),
    generic_name VARCHAR(255),

    -- Product Details
    item_code VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date DATE,

    -- Stock & Quantity
    quantity INT NOT NULL,
    pack_size INT DEFAULT 1,
    loose_quantity INT DEFAULT 0,

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_sale FOREIGN KEY (sale_id)
        REFERENCES pharmacy_sales(sale_id) ON DELETE CASCADE,
    CONSTRAINT fk_medication FOREIGN KEY (medication_id)
        REFERENCES medication(id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Sales Table Indexes
CREATE INDEX idx_pharmacy_sales_patient ON pharmacy_sales(patient_id);
CREATE INDEX idx_pharmacy_sales_visit ON pharmacy_sales(visit_id);
CREATE INDEX idx_pharmacy_sales_date ON pharmacy_sales(sale_date);
CREATE INDEX idx_pharmacy_sales_payment ON pharmacy_sales(payment_method);
CREATE INDEX idx_pharmacy_sales_status ON pharmacy_sales(payment_status);
CREATE INDEX idx_pharmacy_sales_prescription ON pharmacy_sales(prescription_number);

-- Sale Items Indexes
CREATE INDEX idx_pharmacy_sale_items_sale ON pharmacy_sale_items(sale_id);
CREATE INDEX idx_pharmacy_sale_items_medication ON pharmacy_sale_items(medication_id);
CREATE INDEX idx_pharmacy_sale_items_batch ON pharmacy_sale_items(batch_number);
CREATE INDEX idx_pharmacy_sale_items_expiry ON pharmacy_sale_items(expiry_date);
CREATE INDEX idx_pharmacy_sale_items_implant ON pharmacy_sale_items(is_implant) WHERE is_implant = TRUE;

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_pharmacy_sales_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pharmacy_sales_timestamp
BEFORE UPDATE ON pharmacy_sales
FOR EACH ROW
EXECUTE FUNCTION update_pharmacy_sales_timestamp();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Complete Sales View with Medication Details
CREATE OR REPLACE VIEW v_pharmacy_sales_complete AS
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

FROM pharmacy_sales ps
LEFT JOIN pharmacy_sale_items psi ON ps.sale_id = psi.sale_id
LEFT JOIN medication m ON psi.medication_id = m.id;

-- Today's Sales Summary
CREATE OR REPLACE VIEW v_pharmacy_today_sales AS
SELECT
    COUNT(DISTINCT sale_id) as total_sales,
    SUM(total_amount) as total_revenue,
    SUM(discount) as total_discount,
    COUNT(DISTINCT patient_id) as unique_patients,
    payment_method,
    COUNT(*) as sales_by_payment
FROM pharmacy_sales
WHERE DATE(sale_date) = CURRENT_DATE
GROUP BY payment_method;

-- Low Stock Alert View
CREATE OR REPLACE VIEW v_pharmacy_low_stock_alert AS
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
FROM medication m
WHERE m.is_deleted = FALSE
  AND (
    (m.reorder_level IS NOT NULL AND CAST(m.stock AS INTEGER) <= m.reorder_level)
    OR (m.minimum_stock IS NOT NULL AND CAST(m.stock AS INTEGER) <= m.minimum_stock)
  )
ORDER BY CAST(m.stock AS INTEGER) ASC;

-- =====================================================
-- SAMPLE QUERIES
-- =====================================================

-- Insert new sale
COMMENT ON TABLE pharmacy_sales IS 'Example Insert:
INSERT INTO pharmacy_sales (sale_type, patient_id, patient_name, visit_id, subtotal, discount, tax_gst, total_amount, payment_method)
VALUES (''IPD'', 123, ''Ram Kumar'', 456, 1000.00, 50.00, 90.00, 1040.00, ''CASH'');
';

-- Insert sale items
COMMENT ON TABLE pharmacy_sale_items IS 'Example Insert:
INSERT INTO pharmacy_sale_items (sale_id, medication_id, medication_name, quantity, unit_price, total_price, item_code)
VALUES (1, ''uuid-here'', ''Paracetamol 500mg'', 2, 50.00, 100.00, ''T1AL001'');
';

-- Retrieve patient complete sale history
COMMENT ON VIEW v_pharmacy_sales_complete IS 'Get patient complete sales:
SELECT * FROM v_pharmacy_sales_complete WHERE patient_id = 123 ORDER BY sale_date DESC;
';

-- Get low stock items
COMMENT ON VIEW v_pharmacy_low_stock_alert IS 'Get low stock medications:
SELECT * FROM v_pharmacy_low_stock_alert;
';

-- =====================================================
-- STORED PROCEDURE: Create Complete Sale
-- =====================================================

CREATE OR REPLACE FUNCTION create_pharmacy_sale(
    p_sale_type VARCHAR,
    p_patient_id INT,
    p_patient_name VARCHAR,
    p_visit_id INT,
    p_payment_method VARCHAR,
    p_items JSONB  -- Array of items: [{medication_id, quantity, unit_price, discount}, ...]
)
RETURNS INT AS $$
DECLARE
    v_sale_id INT;
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

    v_total_tax := v_subtotal * 0.09; -- Example: 9% GST
    v_total_amount := v_subtotal - v_total_discount + v_total_tax;

    -- Insert sale
    INSERT INTO pharmacy_sales (sale_type, patient_id, patient_name, visit_id, subtotal, discount, tax_gst, total_amount, payment_method)
    VALUES (p_sale_type, p_patient_id, p_patient_name, p_visit_id, v_subtotal, v_total_discount, v_total_tax, v_total_amount, p_payment_method)
    RETURNING sale_id INTO v_sale_id;

    -- Insert sale items
    INSERT INTO pharmacy_sale_items (sale_id, medication_id, medication_name, quantity, unit_price, discount, total_price)
    SELECT
        v_sale_id,
        (item->>'medication_id')::UUID,
        item->>'medication_name',
        (item->>'quantity')::INT,
        (item->>'unit_price')::DECIMAL,
        COALESCE((item->>'discount')::DECIMAL, 0),
        ((item->>'quantity')::INT * (item->>'unit_price')::DECIMAL) - COALESCE((item->>'discount')::DECIMAL, 0)
    FROM jsonb_array_elements(p_items) AS item;

    RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT create_pharmacy_sale('OPD', 123, 'Ram Kumar', 456, 'CASH',
--   '[{"medication_id": "uuid-here", "medication_name": "Paracetamol", "quantity": 2, "unit_price": 50.00, "discount": 5.00}]'::jsonb
-- );
