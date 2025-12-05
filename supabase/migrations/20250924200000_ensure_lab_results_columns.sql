-- Ensure all required columns exist in lab_results table without foreign key constraints

-- Drop existing table if needed and recreate with proper schema
DROP TABLE IF EXISTS lab_results CASCADE;

-- Create lab_results table with all required fields
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Test identification
    main_test_name VARCHAR(255),
    test_name VARCHAR(255) NOT NULL,
    test_category VARCHAR(100) DEFAULT 'GENERAL',

    -- Result data
    result_value TEXT,
    result_unit VARCHAR(50),
    reference_range VARCHAR(100),
    comments TEXT,
    is_abnormal BOOLEAN DEFAULT FALSE,
    result_status VARCHAR(20) DEFAULT 'Preliminary' CHECK (result_status IN ('Preliminary', 'Final')),

    -- Staff information
    technician_name VARCHAR(100),
    pathologist_name VARCHAR(100),
    authenticated_result BOOLEAN DEFAULT FALSE,

    -- Patient information (denormalized for simplicity)
    patient_name VARCHAR(255),
    patient_age INTEGER,
    patient_gender VARCHAR(20),

    -- Optional foreign keys (can be null)
    visit_id UUID,
    lab_id UUID,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lab_results_test_name ON lab_results(test_name);
CREATE INDEX IF NOT EXISTS idx_lab_results_main_test_name ON lab_results(main_test_name);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient_name ON lab_results(patient_name);
CREATE INDEX IF NOT EXISTS idx_lab_results_created_at ON lab_results(created_at);

-- Enable Row Level Security
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on lab_results" ON lab_results FOR ALL USING (true);

-- Add trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lab_results_updated_at
    BEFORE UPDATE ON lab_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();