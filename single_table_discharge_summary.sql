-- Single Table for IPD Discharge Summary
-- All data stored in one table with JSON fields for complex data

CREATE TABLE IF NOT EXISTS ipd_discharge_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Visit Information
    visit_id VARCHAR(50) UNIQUE NOT NULL,
    visit_uuid UUID,

    -- Patient Information
    patient_name VARCHAR(255),
    reg_id VARCHAR(50),
    address TEXT,
    age_sex VARCHAR(50),
    treating_consultant VARCHAR(255),
    doa DATE, -- Date of Admission
    other_consultants VARCHAR(255),
    date_of_discharge DATE,
    reason_of_discharge VARCHAR(255),
    corporate_type VARCHAR(255),

    -- Medical Information
    diagnosis TEXT,
    investigations TEXT,
    stay_notes TEXT,

    -- Treatment Information
    treatment_condition VARCHAR(100) DEFAULT 'Satisfactory',
    treatment_status VARCHAR(100) DEFAULT 'Stable',
    review_date DATE,
    resident_on_discharge VARCHAR(255),
    enable_sms_alert BOOLEAN DEFAULT false,
    other_consultants_text TEXT,

    -- Examination Data (JSON)
    examination_data JSONB DEFAULT '{}',ky 
    -- Example: {"temperature": "98.6°F", "pulse_rate": "76/min", "respiratory_rate": "18/min", "blood_pressure": "120/80 mmHg", "spo2": "98%", "examination_details": "CVS - S1S2 Normal"}

    -- Medications (JSON Array)
    medications JSONB DEFAULT '[]',
    -- Example: [{"name": "Paracetamol 500mg", "unit": "Tab", "route": "PO", "dose": "BD", "quantity": "10", "days": "5", "timing": {"morning": true, "evening": true}, "is_sos": false, "remark": "For pain relief"}]

    -- Surgery Details (JSON)
    surgery_details JSONB DEFAULT '{}',
    -- Example: {"surgery_date": "2025-09-26T10:30:00", "procedure_performed": "Minor procedure", "surgeon": "Dr. Surgeon", "anesthetist": "Dr. Anesthetist", "anesthesia_type": "Local", "implant": "", "description": "Procedure completed successfully"}

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_visit_id ON ipd_discharge_summary(visit_id);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_visit_uuid ON ipd_discharge_summary(visit_uuid);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_created_at ON ipd_discharge_summary(created_at);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_patient_name ON ipd_discharge_summary(patient_name);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_reg_id ON ipd_discharge_summary(reg_id);

-- JSONB indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_medications_gin ON ipd_discharge_summary USING GIN (medications);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_examination_gin ON ipd_discharge_summary USING GIN (examination_data);
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_surgery_gin ON ipd_discharge_summary USING GIN (surgery_details);

-- Enable Row Level Security
ALTER TABLE ipd_discharge_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all discharge summaries"
ON ipd_discharge_summary FOR SELECT
USING (true);

CREATE POLICY "Users can insert discharge summaries"
ON ipd_discharge_summary FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update discharge summaries"
ON ipd_discharge_summary FOR UPDATE
USING (true);

CREATE POLICY "Users can delete discharge summaries"
ON ipd_discharge_summary FOR DELETE
USING (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_ipd_discharge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_ipd_discharge_summary_updated_at
    BEFORE UPDATE ON ipd_discharge_summary
    FOR EACH ROW EXECUTE FUNCTION update_ipd_discharge_updated_at();

-- Add table comment
COMMENT ON TABLE ipd_discharge_summary IS 'Single table for storing complete IPD discharge summary information with JSON fields for complex data';

-- Sample Insert Query
/*
INSERT INTO ipd_discharge_summary (
    visit_id,
    patient_name,
    reg_id,
    address,
    age_sex,
    treating_consultant,
    doa,
    other_consultants,
    date_of_discharge,
    reason_of_discharge,
    corporate_type,
    diagnosis,
    investigations,
    stay_notes,
    treatment_condition,
    treatment_status,
    review_date,
    resident_on_discharge,
    enable_sms_alert,
    examination_data,
    medications,
    surgery_details
) VALUES (
    'IH25G10001',
    'akon',
    'UHAY25G10001',
    'Kamtee Road.',
    '25 Years / male',
    'Dr. Amod Chaurasia',
    '2025-06-25',
    'Other Consultants',
    '2025-09-27',
    'Recovered',
    'Corporate Type',
    'Abdominal Injury - Blunt',
    'Lab investigations completed',
    'Patient was comfortable during stay',
    'Satisfactory',
    'Stable',
    '2025-10-01',
    'Dr. Resident',
    true,
    '{"temperature": "98.6°F", "pulse_rate": "76/min", "respiratory_rate": "18/min", "blood_pressure": "120/80 mmHg", "spo2": "98%", "examination_details": "CVS - S1S2 Normal"}',
    '[{"name": "Paracetamol 500mg", "unit": "Tab", "route": "PO", "dose": "BD", "quantity": "10", "days": "5", "timing": {"morning": true, "evening": true}, "is_sos": false, "remark": "For pain relief"}]',
    '{"surgery_date": "2025-09-26T10:30:00", "procedure_performed": "Minor procedure", "surgeon": "Dr. Surgeon", "anesthetist": "Dr. Anesthetist", "anesthesia_type": "Local", "description": "Procedure completed successfully"}'
);
*/