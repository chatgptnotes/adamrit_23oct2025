-- Create IPD Discharge Summary Table
CREATE TABLE IF NOT EXISTS ipd_discharge_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- FOREIGN KEY RELATIONSHIPS --
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

    -- PATIENT BASIC INFO --
    patient_name VARCHAR(255) NOT NULL,
    reg_id VARCHAR(50), -- UHAY25F25001
    address TEXT,
    age_sex VARCHAR(50),

    -- ADMISSION & DISCHARGE --
    admission_date DATE,
    date_of_discharge DATE,
    total_stay_days INTEGER,

    -- CONSULTANTS --
    treating_consultant VARCHAR(255),
    other_consultants TEXT,
    reason_of_discharge VARCHAR(255),
    corporate_type VARCHAR(100),

    -- OT NOTES SECTION --
    ot_notes TEXT,
    stay_notes TEXT,
    favorite_templates TEXT,

    -- PATIENT ADVICE SECTION --
    patient_advice TEXT,
    patient_advice_medications TEXT,

    -- MEDICATION ON DISCHARGE --
    medication_on_discharge TEXT,
    continue_prescribed_medications TEXT,

    -- OT ADVICE --
    ot_advice TEXT,

    -- TREATMENT DURING HOSPITAL STAY --
    treatment_during_stay TEXT,
    patient_condition_at_discharge TEXT,

    -- RESIDENT AND REVIEW INFORMATION --
    resident_on_discharge VARCHAR(255),
    review_on_date DATE,
    review_notes TEXT,

    -- DIAGNOSIS (JSON for flexibility) --
    diagnosis_data JSONB,
    primary_diagnosis TEXT,
    secondary_diagnosis TEXT,

    -- INVESTIGATIONS (JSON) --
    lab_investigations JSONB,
    imaging_studies JSONB,

    -- PROCEDURES (JSON) --
    procedures_performed JSONB,
    operation_notes TEXT,

    -- MEDICATIONS (JSON) --
    admission_medications JSONB,
    discharge_medications JSONB,

    -- VITAL SIGNS --
    vital_signs JSONB,

    -- HISTORY --
    chief_complaints TEXT,
    history_present_illness TEXT,
    past_medical_history TEXT,
    family_history TEXT,
    personal_history TEXT,

    -- PHYSICAL EXAMINATION --
    general_examination TEXT,
    systemic_examination JSONB,

    -- HOSPITAL COURSE --
    hospital_course TEXT,
    daily_progress_notes JSONB,
    complications TEXT,

    -- CONDITION ON DISCHARGE --
    condition_on_discharge VARCHAR(100),
    functional_status TEXT,

    -- FOLLOW UP --
    follow_up_instructions TEXT,
    follow_up_date DATE,
    follow_up_consultant VARCHAR(255),

    -- DISCHARGE ADVICE --
    discharge_advice TEXT,
    diet_instructions TEXT,
    activity_restrictions TEXT,
    warning_signs TEXT,

    -- BILLING --
    billing_details JSONB,
    total_amount DECIMAL(12,2),
    amount_paid DECIMAL(10,2),
    amount_due DECIMAL(10,2),

    -- FORM SPECIFIC FIELDS --
    form_data JSONB, -- Store any additional form fields
    template_used VARCHAR(255),

    -- ADMINISTRATIVE --
    prepared_by VARCHAR(255),
    approved_by VARCHAR(255),
    summary_date DATE DEFAULT CURRENT_DATE,
    approval_date DATE,

    -- STATUS --
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Final', 'Approved', 'Cancelled')),
    is_printed BOOLEAN DEFAULT FALSE,
    print_count INTEGER DEFAULT 0,

    -- HOSPITAL INFO --
    ward_name VARCHAR(100),
    bed_number VARCHAR(20),

    -- TIMESTAMPS --
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- ERROR HANDLING --
    validation_errors JSONB,
    form_errors TEXT,

    -- ADDITIONAL DATA --
    additional_data JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_visit_id ON ipd_discharge_summary(visit_id);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_patient_id ON ipd_discharge_summary(patient_id);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_reg_id ON ipd_discharge_summary(reg_id);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_status ON ipd_discharge_summary(status);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_admission_date ON ipd_discharge_summary(admission_date);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_created_at ON ipd_discharge_summary(created_at);

-- GIN indexes for JSONB
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_diagnosis_gin ON ipd_discharge_summary USING GIN (diagnosis_data);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_procedures_gin ON ipd_discharge_summary USING GIN (procedures_performed);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_medications_gin ON ipd_discharge_summary USING GIN (discharge_medications);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_form_data_gin ON ipd_discharge_summary USING GIN (form_data);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_lab_investigations_gin ON ipd_discharge_summary USING GIN (lab_investigations);

-- Enable Row Level Security
ALTER TABLE ipd_discharge_summary ENABLE ROW LEVEL SECURITY;

-- Create policy for access control
CREATE POLICY "Allow all operations on ipd_discharge_summary" ON ipd_discharge_summary FOR ALL USING (true);

-- Update trigger
CREATE OR REPLACE FUNCTION update_ipd_discharge_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ipd_discharge_summary_updated_at
    BEFORE UPDATE ON ipd_discharge_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_ipd_discharge_summary_updated_at();

-- Validation function
CREATE OR REPLACE FUNCTION validate_discharge_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset validation errors
    NEW.validation_errors = '[]'::jsonb;
    NEW.form_errors = NULL;

    -- Check required fields
    IF NEW.patient_name IS NULL OR NEW.patient_name = '' THEN
        NEW.validation_errors = NEW.validation_errors || '["Patient name is required"]'::jsonb;
    END IF;

    IF NEW.admission_date IS NULL THEN
        NEW.validation_errors = NEW.validation_errors || '["Admission date is required"]'::jsonb;
    END IF;

    -- Check date logic
    IF NEW.date_of_discharge IS NOT NULL AND NEW.admission_date IS NOT NULL THEN
        IF NEW.date_of_discharge < NEW.admission_date THEN
            NEW.validation_errors = NEW.validation_errors || '["Discharge date cannot be before admission date"]'::jsonb;
        END IF;

        -- Calculate stay days
        NEW.total_stay_days = NEW.date_of_discharge - NEW.admission_date;
    END IF;

    -- Set form errors if any validation errors exist
    IF jsonb_array_length(NEW.validation_errors) > 0 THEN
        NEW.form_errors = 'Validation failed. Please check required fields.';
        NEW.status = 'Draft'; -- Force status to Draft if validation fails
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_discharge_summary_trigger
    BEFORE INSERT OR UPDATE ON ipd_discharge_summary
    FOR EACH ROW
    EXECUTE FUNCTION validate_discharge_summary();

-- Add comments to the table
COMMENT ON TABLE ipd_discharge_summary IS 'Stores comprehensive IPD discharge summary data with JSON fields for flexibility';
COMMENT ON COLUMN ipd_discharge_summary.diagnosis_data IS 'JSON field storing primary, secondary diagnoses and complications';
COMMENT ON COLUMN ipd_discharge_summary.discharge_medications IS 'JSON field storing all discharge medications with dosage and timing';
COMMENT ON COLUMN ipd_discharge_summary.form_data IS 'JSON field for storing additional form fields and debugging data';