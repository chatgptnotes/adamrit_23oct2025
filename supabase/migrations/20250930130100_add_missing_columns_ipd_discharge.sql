-- Add missing columns to ipd_discharge_summary table

-- Add form_data column
ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS form_data JSONB;

-- Add other missing JSON columns that might be needed
ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS diagnosis_data JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS discharge_medications JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS lab_investigations JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS procedures_performed JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS admission_medications JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS vital_signs JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS systemic_examination JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS daily_progress_notes JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS billing_details JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS validation_errors JSONB;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS additional_data JSONB;

-- Add other missing text columns
ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS ot_notes TEXT;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS patient_advice TEXT;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS medication_on_discharge TEXT;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS treatment_during_stay TEXT;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS resident_on_discharge VARCHAR(255);

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS review_on_date DATE;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS primary_diagnosis TEXT;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS prepared_by VARCHAR(255);

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS summary_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Draft';

ALTER TABLE ipd_discharge_summary
ADD COLUMN IF NOT EXISTS form_errors TEXT;

-- Add status constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ipd_discharge_summary_status_check'
    ) THEN
        ALTER TABLE ipd_discharge_summary
        ADD CONSTRAINT ipd_discharge_summary_status_check
        CHECK (status IN ('Draft', 'Final', 'Approved', 'Cancelled'));
    END IF;
END $$;

-- Add GIN indexes for JSONB columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_ipd_discharge_form_data_gin
ON ipd_discharge_summary USING GIN (form_data);

CREATE INDEX IF NOT EXISTS idx_ipd_discharge_diagnosis_gin
ON ipd_discharge_summary USING GIN (diagnosis_data);

CREATE INDEX IF NOT EXISTS idx_ipd_discharge_medications_gin
ON ipd_discharge_summary USING GIN (discharge_medications);

CREATE INDEX IF NOT EXISTS idx_ipd_discharge_lab_investigations_gin
ON ipd_discharge_summary USING GIN (lab_investigations);

CREATE INDEX IF NOT EXISTS idx_ipd_discharge_procedures_gin
ON ipd_discharge_summary USING GIN (procedures_performed);

-- Add comments
COMMENT ON COLUMN ipd_discharge_summary.form_data IS 'JSON field for storing additional form fields and debugging data';
COMMENT ON COLUMN ipd_discharge_summary.diagnosis_data IS 'JSON field storing primary, secondary diagnoses and complications';
COMMENT ON COLUMN ipd_discharge_summary.discharge_medications IS 'JSON field storing all discharge medications with dosage and timing';
COMMENT ON COLUMN ipd_discharge_summary.lab_investigations IS 'JSON field storing lab results and investigations';