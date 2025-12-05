-- ========================================
-- RADIOLOGY MODULE DATABASE SCHEMA
-- Comprehensive Enterprise-Level Radiology Management System
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modalities Table
CREATE TABLE IF NOT EXISTS radiology_modalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE, -- CT, MRI, XR, US, etc.
    description TEXT,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    location VARCHAR(100),
    installation_date DATE,
    calibration_date DATE,
    next_calibration_date DATE,
    is_active BOOLEAN DEFAULT true,
    radiation_type VARCHAR(50), -- ionizing, non-ionizing
    max_patients_per_day INTEGER DEFAULT 50,
    avg_study_duration INTEGER DEFAULT 30, -- minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiology Procedures/Protocols
CREATE TABLE IF NOT EXISTS radiology_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    modality_id UUID REFERENCES radiology_modalities(id),
    body_part VARCHAR(100),
    study_type VARCHAR(100), -- routine, urgent, stat
    contrast_required BOOLEAN DEFAULT false,
    contrast_type VARCHAR(100),
    estimated_duration INTEGER DEFAULT 30, -- minutes
    radiation_dose DECIMAL(10,3), -- mGy
    preparation_instructions TEXT,
    procedure_steps TEXT,
    price DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    cpt_code VARCHAR(10),
    icd_codes TEXT[], -- array of ICD codes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiologists
CREATE TABLE IF NOT EXISTS radiologists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    license_number VARCHAR(50) UNIQUE,
    specializations TEXT[], -- neuro, cardiac, MSK, etc.
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    digital_signature_path VARCHAR(500),
    reporting_rate INTEGER DEFAULT 20, -- reports per day
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technologists
CREATE TABLE IF NOT EXISTS radiology_technologists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    license_number VARCHAR(50),
    certified_modalities TEXT[], -- array of modality codes
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    shift_timings JSONB, -- flexible shift data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiology Orders
CREATE TABLE IF NOT EXISTS radiology_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID NOT NULL, -- references patients table
    ordering_physician VARCHAR(200),
    ordering_department VARCHAR(100),
    procedure_id UUID REFERENCES radiology_procedures(id),
    modality_id UUID REFERENCES radiology_modalities(id),
    priority VARCHAR(20) DEFAULT 'routine', -- stat, urgent, routine
    clinical_indication TEXT,
    clinical_history TEXT,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    requested_date DATE,
    contrast_allergies TEXT,
    patient_weight DECIMAL(5,2),
    patient_height DECIMAL(5,2),
    pregnancy_status VARCHAR(20), -- pregnant, not_pregnant, unknown
    status VARCHAR(30) DEFAULT 'ordered', -- ordered, scheduled, in_progress, completed, cancelled
    insurance_authorization VARCHAR(100),
    estimated_cost DECIMAL(12,2),
    notes TEXT,
    created_by UUID, -- user who created the order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiology Appointments/Scheduling
CREATE TABLE IF NOT EXISTS radiology_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES radiology_orders(id),
    appointment_number VARCHAR(20) UNIQUE,
    patient_id UUID NOT NULL,
    modality_id UUID REFERENCES radiology_modalities(id),
    technologist_id UUID REFERENCES radiology_technologists(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    estimated_duration INTEGER DEFAULT 30, -- minutes
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'scheduled', -- scheduled, confirmed, in_progress, completed, no_show, cancelled
    patient_arrived_at TIMESTAMP WITH TIME ZONE,
    preparation_completed BOOLEAN DEFAULT false,
    contrast_administered BOOLEAN DEFAULT false,
    contrast_volume DECIMAL(10,2), -- ml
    complications TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DICOM Studies
CREATE TABLE IF NOT EXISTS dicom_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_instance_uid VARCHAR(100) UNIQUE NOT NULL,
    appointment_id UUID REFERENCES radiology_appointments(id),
    order_id UUID REFERENCES radiology_orders(id),
    patient_id UUID NOT NULL,
    study_date DATE NOT NULL,
    study_time TIME,
    modality VARCHAR(10) NOT NULL,
    study_description TEXT,
    accession_number VARCHAR(50),
    referring_physician VARCHAR(200),
    performing_physician VARCHAR(200),
    patient_position VARCHAR(20),
    body_part_examined VARCHAR(100),
    view_position VARCHAR(50),
    series_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    study_size_mb DECIMAL(12,2),
    pacs_location VARCHAR(500),
    archived BOOLEAN DEFAULT false,
    archive_location VARCHAR(500),
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    technical_adequacy VARCHAR(50), -- excellent, good, fair, poor
    artifacts_present BOOLEAN DEFAULT false,
    artifact_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiology Reports
CREATE TABLE IF NOT EXISTS radiology_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_number VARCHAR(20) UNIQUE NOT NULL,
    study_id UUID REFERENCES dicom_studies(id),
    order_id UUID REFERENCES radiology_orders(id),
    patient_id UUID NOT NULL,
    radiologist_id UUID REFERENCES radiologists(id),
    preliminary_radiologist_id UUID REFERENCES radiologists(id),
    report_status VARCHAR(30) DEFAULT 'pending', -- pending, preliminary, final, amended, signed
    priority VARCHAR(20) DEFAULT 'routine',
    clinical_information TEXT,
    comparison_studies TEXT,
    technique TEXT,
    findings TEXT NOT NULL,
    impression TEXT NOT NULL,
    recommendations TEXT,
    critical_findings TEXT,
    critical_notified BOOLEAN DEFAULT false,
    critical_notification_time TIMESTAMP WITH TIME ZONE,
    critical_notified_to VARCHAR(200),
    dictated_at TIMESTAMP WITH TIME ZONE,
    preliminary_report_time TIMESTAMP WITH TIME ZONE,
    final_report_time TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    amended_at TIMESTAMP WITH TIME ZONE,
    amendment_reason TEXT,
    turnaround_time_minutes INTEGER,
    word_count INTEGER,
    template_used VARCHAR(100),
    structured_reporting JSONB, -- for structured reports
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report Templates
CREATE TABLE IF NOT EXISTS radiology_report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    modality VARCHAR(10) NOT NULL,
    body_part VARCHAR(100),
    procedure_type VARCHAR(200),
    template_content TEXT NOT NULL,
    structured_fields JSONB, -- for structured reporting
    macros JSONB, -- keyboard shortcuts/macros
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality Assurance
CREATE TABLE IF NOT EXISTS radiology_qa_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modality_id UUID REFERENCES radiology_modalities(id),
    qa_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, annual
    test_name VARCHAR(200) NOT NULL,
    test_date DATE NOT NULL,
    performed_by UUID REFERENCES radiology_technologists(id),
    phantom_used VARCHAR(100),
    test_parameters JSONB,
    measured_values JSONB,
    reference_values JSONB,
    tolerance_limits JSONB,
    pass_fail_status VARCHAR(10) DEFAULT 'pass', -- pass, fail, warning
    deviation_percentage DECIMAL(5,2),
    corrective_action TEXT,
    next_test_date DATE,
    supervisor_review BOOLEAN DEFAULT false,
    supervisor_comments TEXT,
    documentation_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiation Dose Tracking
CREATE TABLE IF NOT EXISTS radiation_dose_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID REFERENCES dicom_studies(id),
    patient_id UUID NOT NULL,
    modality VARCHAR(10) NOT NULL,
    procedure_name VARCHAR(200),
    dose_length_product DECIMAL(10,3), -- mGy.cm for CT
    ct_dose_index DECIMAL(10,3), -- mGy for CT
    effective_dose DECIMAL(10,3), -- mSv
    entrance_skin_dose DECIMAL(10,3), -- mGy for radiography
    fluoroscopy_time INTEGER, -- seconds
    kvp INTEGER, -- kilovolt peak
    mas DECIMAL(10,2), -- milliampere-seconds
    exposure_factors JSONB,
    body_part VARCHAR(100),
    patient_age INTEGER,
    patient_weight DECIMAL(5,2),
    pregnancy_status VARCHAR(20),
    dose_reference_level DECIMAL(10,3),
    exceeds_drl BOOLEAN DEFAULT false,
    dose_optimization_notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contrast Management
CREATE TABLE IF NOT EXISTS contrast_administrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES radiology_appointments(id),
    patient_id UUID NOT NULL,
    contrast_agent VARCHAR(200) NOT NULL,
    contrast_type VARCHAR(50), -- ionic, non-ionic, gadolinium
    route VARCHAR(50), -- IV, oral, rectal, intra-articular
    volume_ml DECIMAL(10,2),
    concentration VARCHAR(50),
    batch_number VARCHAR(100),
    expiry_date DATE,
    administered_by UUID REFERENCES radiology_technologists(id),
    administration_time TIMESTAMP WITH TIME ZONE,
    pre_medication_given BOOLEAN DEFAULT false,
    pre_medication_details TEXT,
    adverse_reaction BOOLEAN DEFAULT false,
    reaction_type VARCHAR(100),
    reaction_severity VARCHAR(50), -- mild, moderate, severe
    reaction_treatment TEXT,
    creatinine_level DECIMAL(5,2),
    egfr_value DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image Archive Management
CREATE TABLE IF NOT EXISTS image_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID REFERENCES dicom_studies(id),
    archive_type VARCHAR(50), -- nearline, offline, cloud
    archive_location VARCHAR(500),
    archive_date TIMESTAMP WITH TIME ZONE,
    retrieval_time_estimate INTEGER, -- minutes
    storage_cost_per_gb DECIMAL(8,4),
    compression_ratio DECIMAL(5,2),
    checksum VARCHAR(128),
    verification_date TIMESTAMP WITH TIME ZONE,
    retrieval_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    retention_period_years INTEGER DEFAULT 7,
    deletion_eligible_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment Maintenance
CREATE TABLE IF NOT EXISTS radiology_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modality_id UUID REFERENCES radiology_modalities(id),
    maintenance_type VARCHAR(50), -- preventive, corrective, calibration
    scheduled_date DATE,
    completed_date DATE,
    performed_by VARCHAR(200), -- service engineer name/company
    maintenance_description TEXT,
    parts_replaced TEXT[],
    parts_cost DECIMAL(10,2),
    labor_hours DECIMAL(5,2),
    total_cost DECIMAL(12,2),
    downtime_hours DECIMAL(5,2),
    next_maintenance_date DATE,
    warranty_status VARCHAR(50),
    service_report_path VARCHAR(500),
    equipment_status_after VARCHAR(50), -- operational, limited, out_of_service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS radiology_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    modality VARCHAR(10),
    department VARCHAR(100),
    total_studies INTEGER DEFAULT 0,
    urgent_studies INTEGER DEFAULT 0,
    stat_studies INTEGER DEFAULT 0,
    avg_turnaround_time_hours DECIMAL(5,2),
    avg_reporting_time_hours DECIMAL(5,2),
    patient_satisfaction_score DECIMAL(3,2),
    equipment_uptime_percentage DECIMAL(5,2),
    radiation_dose_compliance_percentage DECIMAL(5,2),
    report_accuracy_score DECIMAL(3,2),
    revenue_generated DECIMAL(12,2),
    cost_per_study DECIMAL(8,2),
    no_show_rate DECIMAL(5,2),
    cancellation_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_radiology_orders_patient_id ON radiology_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_radiology_orders_status ON radiology_orders(status);
CREATE INDEX IF NOT EXISTS idx_radiology_orders_date ON radiology_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_radiology_appointments_date ON radiology_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_radiology_appointments_modality ON radiology_appointments(modality_id);
CREATE INDEX IF NOT EXISTS idx_dicom_studies_patient_id ON dicom_studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_dicom_studies_study_date ON dicom_studies(study_date);
CREATE INDEX IF NOT EXISTS idx_radiology_reports_status ON radiology_reports(report_status);
CREATE INDEX IF NOT EXISTS idx_radiology_reports_radiologist ON radiology_reports(radiologist_id);
CREATE INDEX IF NOT EXISTS idx_radiation_dose_patient ON radiation_dose_tracking(patient_id);
CREATE INDEX IF NOT EXISTS idx_qa_checks_modality_date ON radiology_qa_checks(modality_id, test_date);

-- Row Level Security (RLS) Policies
ALTER TABLE radiology_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_technologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dicom_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_qa_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiation_dose_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrast_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all for now - implement proper authentication later)
CREATE POLICY "Allow all operations" ON radiology_modalities FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_procedures FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiologists FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_technologists FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_appointments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON dicom_studies FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_reports FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_report_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_qa_checks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiation_dose_tracking FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON contrast_administrations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON image_archives FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_maintenance FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_metrics FOR ALL USING (true);