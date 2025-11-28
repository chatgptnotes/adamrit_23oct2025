-- Enterprise Laboratory Management System Database Schema
-- Migration for complete lab management functionality

-- 1. Test Categories and Classifications
CREATE TABLE IF NOT EXISTS test_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID REFERENCES test_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Laboratory Departments
CREATE TABLE IF NOT EXISTS lab_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name VARCHAR(100) NOT NULL UNIQUE,
    department_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    head_of_department VARCHAR(255),
    location VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Test Master (Test Catalog)
CREATE TABLE IF NOT EXISTS lab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name VARCHAR(255) NOT NULL,
    test_code VARCHAR(50) UNIQUE NOT NULL,
    short_name VARCHAR(100),
    category_id UUID REFERENCES test_categories(id),
    department_id UUID REFERENCES lab_departments(id),
    
    -- Test Details
    test_type VARCHAR(50), -- QUALITATIVE, QUANTITATIVE, SEMI_QUANTITATIVE
    sample_type VARCHAR(100), -- Blood, Urine, Stool, etc.
    sample_volume VARCHAR(50),
    container_type VARCHAR(100),
    preparation_instructions TEXT,
    
    -- Processing Information
    processing_time_hours INTEGER DEFAULT 24,
    method VARCHAR(255),
    analyzer VARCHAR(255),
    
    -- Reference Values (stored as JSON for flexibility)
    reference_ranges JSONB, -- {male: {min: 12, max: 16}, female: {min: 12, max: 15}, unit: "g/dL"}
    critical_values JSONB, -- {low: 7, high: 20, action: "immediate notification"}
    
    -- Financial
    test_price DECIMAL(10,2) DEFAULT 0.00,
    insurance_coverage DECIMAL(5,2) DEFAULT 100.00, -- percentage
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_outsourced BOOLEAN DEFAULT false,
    outsourced_lab VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Test Panels/Profiles
CREATE TABLE IF NOT EXISTS test_panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_name VARCHAR(255) NOT NULL,
    panel_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES test_categories(id),
    department_id UUID REFERENCES lab_departments(id),
    
    -- Pricing
    panel_price DECIMAL(10,2) DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Panel Tests Mapping
CREATE TABLE IF NOT EXISTS panel_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_id UUID REFERENCES test_panels(id) ON DELETE CASCADE,
    test_id UUID REFERENCES lab_tests(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Lab Orders
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    
    -- Patient Information (denormalized for quick access)
    patient_name VARCHAR(255) NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(10),
    patient_phone VARCHAR(20),
    
    -- Doctor Information
    ordering_doctor VARCHAR(255) NOT NULL,
    doctor_id UUID,
    referring_facility VARCHAR(255),
    
    -- Order Details
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_time TIME DEFAULT CURRENT_TIME,
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
    order_type VARCHAR(20) DEFAULT 'Routine' CHECK (order_type IN ('Routine', 'Urgent', 'STAT', 'Emergency')),
    
    -- Clinical Information
    clinical_history TEXT,
    provisional_diagnosis TEXT,
    icd_codes TEXT[],
    
    -- Collection Information
    collection_date DATE,
    collection_time TIME,
    collection_location VARCHAR(255),
    collected_by VARCHAR(255),
    
    -- Financial
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partial', 'Paid', 'Refunded')),
    payment_method VARCHAR(50),
    
    -- Status and Workflow
    order_status VARCHAR(30) DEFAULT 'Created' CHECK (order_status IN (
        'Created', 'Sample_Collected', 'Sample_Received', 'In_Progress', 
        'Results_Ready', 'Results_Verified', 'Results_Dispatched', 'Completed', 'Cancelled'
    )),
    
    -- Timing
    sample_collection_datetime TIMESTAMP WITH TIME ZONE,
    sample_received_datetime TIMESTAMP WITH TIME ZONE,
    results_ready_datetime TIMESTAMP WITH TIME ZONE,
    report_dispatch_datetime TIMESTAMP WITH TIME ZONE,
    
    -- Quality and Notes
    special_instructions TEXT,
    internal_notes TEXT,
    cancellation_reason TEXT,
    
    -- Metadata
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Order Test Items
CREATE TABLE IF NOT EXISTS order_test_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES lab_orders(id) ON DELETE CASCADE,
    test_id UUID REFERENCES lab_tests(id),
    panel_id UUID REFERENCES test_panels(id),
    
    -- Item Details
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('Test', 'Panel')),
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    
    -- Sample Information
    sample_type VARCHAR(100),
    sample_volume VARCHAR(50),
    container_type VARCHAR(100),
    
    -- Status
    item_status VARCHAR(30) DEFAULT 'Ordered' CHECK (item_status IN (
        'Ordered', 'Sample_Collected', 'Sample_Received', 'In_Progress',
        'Completed', 'Cancelled', 'On_Hold'
    )),
    
    -- Pricing
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Processing
    assigned_technician VARCHAR(255),
    analyzer_used VARCHAR(255),
    processing_start_time TIMESTAMP WITH TIME ZONE,
    processing_end_time TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    technician_notes TEXT,
    quality_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sample Tracking
CREATE TABLE IF NOT EXISTS lab_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_barcode VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES lab_orders(id),
    
    -- Sample Details
    sample_type VARCHAR(100) NOT NULL,
    container_type VARCHAR(100),
    volume_collected VARCHAR(50),
    number_of_containers INTEGER DEFAULT 1,
    
    -- Collection Information
    collection_datetime TIMESTAMP WITH TIME ZONE,
    collection_location VARCHAR(255),
    collected_by VARCHAR(255),
    collection_method VARCHAR(100),
    
    -- Receipt Information
    received_datetime TIMESTAMP WITH TIME ZONE,
    received_by VARCHAR(255),
    temperature_at_receipt DECIMAL(4,1),
    
    -- Quality Assessment
    sample_quality VARCHAR(20) DEFAULT 'Acceptable' CHECK (sample_quality IN ('Acceptable', 'Questionable', 'Rejected')),
    quality_notes TEXT,
    rejection_reason TEXT,
    
    -- Storage Information
    storage_location VARCHAR(100),
    storage_temperature DECIMAL(4,1),
    storage_conditions TEXT,
    
    -- Processing Status
    processing_status VARCHAR(30) DEFAULT 'Received' CHECK (processing_status IN (
        'Collected', 'In_Transit', 'Received', 'Processing', 'Completed', 'Discarded'
    )),
    
    -- Aliquot Information
    parent_sample_id UUID REFERENCES lab_samples(id),
    is_aliquot BOOLEAN DEFAULT false,
    aliquot_number INTEGER,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Test Results
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES lab_orders(id),
    order_item_id UUID REFERENCES order_test_items(id),
    test_id UUID REFERENCES lab_tests(id),
    sample_id UUID REFERENCES lab_samples(id),
    
    -- Result Information
    result_value VARCHAR(500),
    result_unit VARCHAR(50),
    result_type VARCHAR(20) CHECK (result_type IN ('Numeric', 'Text', 'Choice', 'Image')),
    
    -- Reference Information
    reference_range VARCHAR(200),
    is_abnormal BOOLEAN DEFAULT false,
    abnormal_flag VARCHAR(20), -- H, L, HH, LL, A
    is_critical BOOLEAN DEFAULT false,
    
    -- Quality Control
    result_status VARCHAR(20) DEFAULT 'Preliminary' CHECK (result_status IN ('Preliminary', 'Final', 'Amended', 'Cancelled')),
    qc_status VARCHAR(20) DEFAULT 'Pending' CHECK (qc_status IN ('Pending', 'Passed', 'Failed', 'Review_Required')),
    
    -- Processing Information
    analyzer_used VARCHAR(255),
    method_used VARCHAR(255),
    reagent_lot VARCHAR(100),
    calibration_datetime TIMESTAMP WITH TIME ZONE,
    
    -- Personnel
    performed_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    approved_by VARCHAR(255),
    
    -- Timestamps
    result_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_datetime TIMESTAMP WITH TIME ZONE,
    approved_datetime TIMESTAMP WITH TIME ZONE,
    
    -- Comments and Notes
    result_comment TEXT,
    technician_comment TEXT,
    pathologist_comment TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Lab Equipment
CREATE TABLE IF NOT EXISTS lab_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_name VARCHAR(255) NOT NULL,
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(100),
    
    -- Location and Assignment
    department_id UUID REFERENCES lab_departments(id),
    location VARCHAR(255),
    room_number VARCHAR(50),
    
    -- Status
    equipment_status VARCHAR(20) DEFAULT 'Active' CHECK (equipment_status IN ('Active', 'Maintenance', 'Out_of_Service', 'Calibration')),
    is_interfaced BOOLEAN DEFAULT false,
    interface_type VARCHAR(100),
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_frequency_days INTEGER DEFAULT 90,
    warranty_expiry_date DATE,
    
    -- Calibration
    last_calibration_date DATE,
    next_calibration_date DATE,
    calibration_frequency_days INTEGER DEFAULT 30,
    
    -- Service Information
    service_provider VARCHAR(255),
    service_contact VARCHAR(255),
    
    -- Notes
    equipment_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Quality Control
CREATE TABLE IF NOT EXISTS quality_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qc_type VARCHAR(50) NOT NULL, -- Daily, Weekly, Monthly, Per_Batch
    equipment_id UUID REFERENCES lab_equipment(id),
    test_id UUID REFERENCES lab_tests(id),
    
    -- QC Details
    qc_material VARCHAR(255),
    lot_number VARCHAR(100),
    expiry_date DATE,
    level VARCHAR(20), -- Normal, Abnormal, Low, High
    
    -- Expected Values
    expected_value DECIMAL(15,6),
    expected_unit VARCHAR(50),
    acceptable_range_min DECIMAL(15,6),
    acceptable_range_max DECIMAL(15,6),
    
    -- Actual Results
    actual_value DECIMAL(15,6),
    result_unit VARCHAR(50),
    qc_status VARCHAR(20) DEFAULT 'Pending' CHECK (qc_status IN ('Pending', 'Pass', 'Fail', 'Review')),
    
    -- Processing Information
    performed_by VARCHAR(255),
    performed_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by VARCHAR(255),
    reviewed_datetime TIMESTAMP WITH TIME ZONE,
    
    -- Actions
    corrective_action TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Lab Reports
CREATE TABLE IF NOT EXISTS lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES lab_orders(id),
    report_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Report Details
    report_type VARCHAR(50) DEFAULT 'Standard', -- Standard, Cumulative, Interim
    report_status VARCHAR(20) DEFAULT 'Draft' CHECK (report_status IN ('Draft', 'Final', 'Amended', 'Cancelled')),
    
    -- Content
    report_content TEXT, -- HTML or formatted content
    report_template VARCHAR(255),
    interpretation TEXT,
    recommendations TEXT,
    
    -- Personnel
    prepared_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    approved_by VARCHAR(255),
    pathologist VARCHAR(255),
    
    -- Timestamps
    prepared_datetime TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_datetime TIMESTAMP WITH TIME ZONE,
    approved_datetime TIMESTAMP WITH TIME ZONE,
    dispatch_datetime TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    delivery_method VARCHAR(50), -- Email, Print, Portal, Fax
    delivered_to VARCHAR(255),
    delivery_status VARCHAR(20) DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'Sent', 'Delivered', 'Failed')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. External Labs
CREATE TABLE IF NOT EXISTS external_labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_name VARCHAR(255) NOT NULL,
    lab_code VARCHAR(50) UNIQUE NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    
    -- Service Details
    speciality_areas TEXT[],
    turnaround_time_hours INTEGER DEFAULT 48,
    pricing_structure JSONB,
    
    -- Integration
    interface_type VARCHAR(100),
    lis_connection_details JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    contract_start_date DATE,
    contract_end_date DATE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Lab Worklist
CREATE TABLE IF NOT EXISTS lab_worklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worklist_name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES lab_departments(id),
    equipment_id UUID REFERENCES lab_equipment(id),
    
    -- Worklist Details
    worklist_type VARCHAR(50), -- Daily, Batch, Stat, QC
    worklist_date DATE DEFAULT CURRENT_DATE,
    shift VARCHAR(20), -- Morning, Evening, Night
    
    -- Personnel
    assigned_technician VARCHAR(255),
    supervisor VARCHAR(255),
    
    -- Status
    worklist_status VARCHAR(20) DEFAULT 'Created' CHECK (worklist_status IN ('Created', 'In_Progress', 'Completed', 'On_Hold')),
    
    -- Statistics
    total_samples INTEGER DEFAULT 0,
    completed_samples INTEGER DEFAULT 0,
    pending_samples INTEGER DEFAULT 0,
    
    -- Timestamps
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Worklist Items
CREATE TABLE IF NOT EXISTS worklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worklist_id UUID REFERENCES lab_worklists(id) ON DELETE CASCADE,
    order_id UUID REFERENCES lab_orders(id),
    order_item_id UUID REFERENCES order_test_items(id),
    sample_id UUID REFERENCES lab_samples(id),
    
    -- Item Details
    test_name VARCHAR(255),
    sample_type VARCHAR(100),
    priority VARCHAR(20),
    
    -- Status
    item_status VARCHAR(20) DEFAULT 'Pending' CHECK (item_status IN ('Pending', 'In_Progress', 'Completed', 'On_Hold', 'Cancelled')),
    sequence_number INTEGER,
    
    -- Processing
    started_by VARCHAR(255),
    completed_by VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE,
    completion_time TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    processing_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_order_date ON lab_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_priority ON lab_orders(priority);
CREATE INDEX IF NOT EXISTS idx_lab_orders_order_number ON lab_orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_test_items_order_id ON order_test_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_test_items_test_id ON order_test_items(test_id);
CREATE INDEX IF NOT EXISTS idx_order_test_items_status ON order_test_items(item_status);

CREATE INDEX IF NOT EXISTS idx_lab_samples_barcode ON lab_samples(sample_barcode);
CREATE INDEX IF NOT EXISTS idx_lab_samples_order_id ON lab_samples(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_samples_status ON lab_samples(processing_status);

CREATE INDEX IF NOT EXISTS idx_test_results_order_id ON test_results(order_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(result_status);
CREATE INDEX IF NOT EXISTS idx_test_results_datetime ON test_results(result_datetime);

CREATE INDEX IF NOT EXISTS idx_lab_tests_category_id ON lab_tests(category_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_department_id ON lab_tests(department_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_code ON lab_tests(test_code);
CREATE INDEX IF NOT EXISTS idx_lab_tests_active ON lab_tests(is_active);

CREATE INDEX IF NOT EXISTS idx_panel_tests_panel_id ON panel_tests(panel_id);
CREATE INDEX IF NOT EXISTS idx_panel_tests_test_id ON panel_tests(test_id);

CREATE INDEX IF NOT EXISTS idx_quality_controls_equipment_id ON quality_controls(equipment_id);
CREATE INDEX IF NOT EXISTS idx_quality_controls_test_id ON quality_controls(test_id);
CREATE INDEX IF NOT EXISTS idx_quality_controls_datetime ON quality_controls(performed_datetime);

CREATE INDEX IF NOT EXISTS idx_lab_reports_order_id ON lab_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_status ON lab_reports(report_status);

CREATE INDEX IF NOT EXISTS idx_worklist_items_worklist_id ON worklist_items(worklist_id);
CREATE INDEX IF NOT EXISTS idx_worklist_items_order_id ON worklist_items(order_id);

-- Create Triggers for Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_test_categories_updated_at BEFORE UPDATE ON test_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_departments_updated_at BEFORE UPDATE ON lab_departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_tests_updated_at BEFORE UPDATE ON lab_tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_panels_updated_at BEFORE UPDATE ON test_panels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_orders_updated_at BEFORE UPDATE ON lab_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_test_items_updated_at BEFORE UPDATE ON order_test_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_samples_updated_at BEFORE UPDATE ON lab_samples FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_results_updated_at BEFORE UPDATE ON test_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_equipment_updated_at BEFORE UPDATE ON lab_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quality_controls_updated_at BEFORE UPDATE ON quality_controls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_reports_updated_at BEFORE UPDATE ON lab_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_external_labs_updated_at BEFORE UPDATE ON external_labs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_worklists_updated_at BEFORE UPDATE ON lab_worklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_worklist_items_updated_at BEFORE UPDATE ON worklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_test_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_worklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE worklist_items ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (allowing authenticated users to access all records for now)
CREATE POLICY "Allow authenticated users to view test categories" ON test_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify test categories" ON test_categories FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view lab departments" ON lab_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify lab departments" ON lab_departments FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view lab tests" ON lab_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify lab tests" ON lab_tests FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view test panels" ON test_panels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify test panels" ON test_panels FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view panel tests" ON panel_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify panel tests" ON panel_tests FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view lab orders" ON lab_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify lab orders" ON lab_orders FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view order test items" ON order_test_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify order test items" ON order_test_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view lab samples" ON lab_samples FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify lab samples" ON lab_samples FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view test results" ON test_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify test results" ON test_results FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view lab equipment" ON lab_equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify lab equipment" ON lab_equipment FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view quality controls" ON quality_controls FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify quality controls" ON quality_controls FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view lab reports" ON lab_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify lab reports" ON lab_reports FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view external labs" ON external_labs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify external labs" ON external_labs FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view lab worklists" ON lab_worklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify lab worklists" ON lab_worklists FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view worklist items" ON worklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify worklist items" ON worklist_items FOR ALL TO authenticated USING (true);