-- Enterprise Laboratory Management System Database Schema
-- Created: 2025-06-13

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
    reference_ranges JSONB, -- Store normal ranges by age/gender
    
    -- Pricing
    test_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    outsourced BOOLEAN DEFAULT false,
    outsource_lab VARCHAR(255),
    outsource_price DECIMAL(10,2),
    
    -- Quality Control
    critical_values JSONB,
    delta_check_rules JSONB,
    panic_values JSONB,
    
    -- Additional Info
    clinical_significance TEXT,
    interfering_factors TEXT,
    reporting_units VARCHAR(50),
    decimal_places INTEGER DEFAULT 2,
    
    is_active BOOLEAN DEFAULT true,
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
    
    -- Pricing
    panel_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Panel Test Mappings
CREATE TABLE IF NOT EXISTS panel_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_id UUID REFERENCES test_panels(id) ON DELETE CASCADE,
    test_id UUID REFERENCES lab_tests(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(panel_id, test_id)
);

-- 6. Lab Orders/Requisitions
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    doctor_id UUID, -- Reference to doctors table if exists
    doctor_name VARCHAR(255),
    
    -- Order Details
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    order_type VARCHAR(20) DEFAULT 'ROUTINE' CHECK (order_type IN ('ROUTINE', 'URGENT', 'STAT', 'EMERGENCY')),
    clinical_info TEXT,
    provisional_diagnosis TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ORDERED' CHECK (status IN (
        'ORDERED', 'SAMPLE_COLLECTED', 'RECEIVED', 'IN_PROGRESS', 
        'COMPLETED', 'VERIFIED', 'REPORTED', 'CANCELLED'
    )),
    
    -- Financial
    total_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED')),
    
    -- Scheduling
    scheduled_date DATE,
    collection_date TIMESTAMP WITH TIME ZONE,
    reporting_date TIMESTAMP WITH TIME ZONE,
    
    -- Additional Info
    priority_level INTEGER DEFAULT 1, -- 1=Low, 2=Medium, 3=High, 4=Critical
    special_instructions TEXT,
    
    created_by UUID,
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
    item_type VARCHAR(20) CHECK (item_type IN ('TEST', 'PANEL')),
    test_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ORDERED' CHECK (status IN (
        'ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sample Collection and Tracking
CREATE TABLE IF NOT EXISTS lab_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES lab_orders(id),
    patient_id UUID REFERENCES patients(id),
    
    -- Sample Details
    sample_type VARCHAR(100) NOT NULL,
    container_type VARCHAR(100),
    sample_volume VARCHAR(50),
    collection_method VARCHAR(100),
    
    -- Collection Info
    collected_at TIMESTAMP WITH TIME ZONE,
    collected_by UUID, -- User who collected
    collection_location VARCHAR(255),
    
    -- Received Info
    received_at TIMESTAMP WITH TIME ZONE,
    received_by UUID, -- Lab technician who received
    received_condition VARCHAR(50), -- GOOD, CLOTTED, HEMOLYZED, etc.
    
    -- Storage Info
    storage_location VARCHAR(100),
    storage_temperature VARCHAR(50),
    storage_conditions TEXT,
    
    -- Quality Info
    quality_status VARCHAR(20) DEFAULT 'ACCEPTABLE' CHECK (quality_status IN (
        'ACCEPTABLE', 'QUESTIONABLE', 'REJECTED'
    )),
    rejection_reason TEXT,
    
    -- Additional Info
    barcode VARCHAR(100),
    comments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Test Results
CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES lab_orders(id),
    test_id UUID REFERENCES lab_tests(id),
    sample_id UUID REFERENCES lab_samples(id),
    
    -- Result Details
    result_value VARCHAR(500),
    result_numeric DECIMAL(15,6),
    result_text TEXT,
    result_units VARCHAR(50),
    
    -- Reference Values
    reference_range VARCHAR(255),
    normal_low DECIMAL(15,6),
    normal_high DECIMAL(15,6),
    
    -- Flags and Interpretation
    abnormal_flag VARCHAR(10), -- H, L, HH, LL, N
    critical_flag BOOLEAN DEFAULT false,
    delta_flag BOOLEAN DEFAULT false,
    interpretation TEXT,
    
    -- Processing Info
    tested_at TIMESTAMP WITH TIME ZONE,
    tested_by UUID, -- Technician who performed test
    analyzer_id VARCHAR(100),
    method_used VARCHAR(255),
    
    -- Validation Info
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID, -- Senior technician/pathologist
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID, -- Pathologist
    
    -- Quality Control
    qc_level VARCHAR(20),
    qc_lot_number VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'VERIFIED', 'REPORTED'
    )),
    
    -- Additional Info
    comments TEXT,
    technical_comments TEXT,
    
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
    serial_number VARCHAR(255),
    
    -- Location and Assignment
    department_id UUID REFERENCES lab_departments(id),
    location VARCHAR(255),
    responsible_person UUID,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN (
        'ACTIVE', 'MAINTENANCE', 'OUT_OF_ORDER', 'RETIRED'
    )),
    
    -- Maintenance
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_frequency_days INTEGER DEFAULT 365,
    
    -- Calibration
    last_calibration_date DATE,
    next_calibration_date DATE,
    calibration_frequency_days INTEGER DEFAULT 180,
    
    -- Purchase Info
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    warranty_expiry DATE,
    vendor_contact TEXT,
    
    -- Additional Info
    specifications JSONB,
    operating_manual_url VARCHAR(500),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Quality Control
CREATE TABLE IF NOT EXISTS quality_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qc_lot_number VARCHAR(100) NOT NULL,
    test_id UUID REFERENCES lab_tests(id),
    equipment_id UUID REFERENCES lab_equipment(id),
    
    -- QC Details
    qc_level VARCHAR(20), -- NORMAL, HIGH, LOW
    qc_material VARCHAR(255),
    target_value DECIMAL(15,6),
    acceptable_range_low DECIMAL(15,6),
    acceptable_range_high DECIMAL(15,6),
    
    -- Lot Info
    lot_expiry_date DATE,
    storage_temperature VARCHAR(50),
    
    -- Results
    measured_value DECIMAL(15,6),
    measured_at TIMESTAMP WITH TIME ZONE,
    measured_by UUID,
    
    -- Status
    qc_status VARCHAR(20) DEFAULT 'PENDING' CHECK (qc_status IN (
        'PENDING', 'PASSED', 'FAILED', 'OUT_OF_RANGE'
    )),
    
    -- Actions
    action_taken TEXT,
    comments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Lab Reports
CREATE TABLE IF NOT EXISTS lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES lab_orders(id),
    patient_id UUID REFERENCES patients(id),
    
    -- Report Details
    report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_type VARCHAR(50), -- PRELIMINARY, FINAL, AMENDED, CORRECTED
    
    -- Content
    report_header TEXT,
    report_body TEXT,
    report_footer TEXT,
    clinical_interpretation TEXT,
    recommendations TEXT,
    
    -- Validation
    prepared_by UUID,
    reviewed_by UUID,
    authorized_by UUID, -- Senior pathologist
    
    -- Distribution
    printed_at TIMESTAMP WITH TIME ZONE,
    emailed_at TIMESTAMP WITH TIME ZONE,
    delivery_method VARCHAR(50), -- PRINT, EMAIL, PORTAL, SMS
    
    -- Status
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_REVIEW', 'REVIEWED', 'AUTHORIZED', 'DELIVERED'
    )),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. External Lab Integration
CREATE TABLE IF NOT EXISTS external_labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_name VARCHAR(255) NOT NULL,
    lab_code VARCHAR(50) UNIQUE NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    
    -- Integration Details
    api_endpoint VARCHAR(500),
    api_key VARCHAR(255),
    integration_type VARCHAR(50), -- HL7, ASTM, API, MANUAL
    
    -- Business Details
    contract_start_date DATE,
    contract_end_date DATE,
    payment_terms TEXT,
    turnaround_time_hours INTEGER DEFAULT 48,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Lab Worklists
CREATE TABLE IF NOT EXISTS lab_worklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worklist_name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES lab_departments(id),
    equipment_id UUID REFERENCES lab_equipment(id),
    
    -- Worklist Details
    worklist_date DATE NOT NULL,
    shift VARCHAR(20), -- MORNING, AFTERNOON, NIGHT
    assigned_to UUID, -- Technician
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    )),
    
    -- Metrics
    total_tests INTEGER DEFAULT 0,
    completed_tests INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Worklist Items
CREATE TABLE IF NOT EXISTS worklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worklist_id UUID REFERENCES lab_worklists(id) ON DELETE CASCADE,
    order_id UUID REFERENCES lab_orders(id),
    test_id UUID REFERENCES lab_tests(id),
    sample_id UUID REFERENCES lab_samples(id),
    
    -- Priority and Sequencing
    priority_order INTEGER,
    processing_order INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'
    )),
    
    -- Processing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests(category_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_department ON lab_tests(department_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_code ON lab_tests(test_code);

CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_date ON lab_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_number ON lab_orders(order_number);

CREATE INDEX IF NOT EXISTS idx_lab_samples_id ON lab_samples(sample_id);
CREATE INDEX IF NOT EXISTS idx_lab_samples_order ON lab_samples(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_samples_patient ON lab_samples(patient_id);

CREATE INDEX IF NOT EXISTS idx_test_results_order ON test_results(order_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_sample ON test_results(sample_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);

CREATE INDEX IF NOT EXISTS idx_lab_reports_order ON lab_reports(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_patient ON lab_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_reports_date ON lab_reports(report_date);

-- Enable RLS on all lab tables
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

-- Create RLS Policies
CREATE POLICY "Allow all for authenticated users" ON test_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON lab_departments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON lab_tests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON test_panels FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON panel_tests FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON lab_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON order_test_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON lab_samples FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON test_results FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON lab_equipment FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON quality_controls FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON lab_reports FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON external_labs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON lab_worklists FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON worklist_items FOR ALL USING (auth.role() = 'authenticated');

SELECT 'Laboratory database schema created successfully!' as status;