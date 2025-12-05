-- Create lab_results table for storing observed values from lab tests
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES lab(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    test_category VARCHAR(100),
    result_value TEXT,
    result_unit VARCHAR(50),
    reference_range VARCHAR(100),
    comments TEXT,
    is_abnormal BOOLEAN DEFAULT FALSE,
    result_status VARCHAR(20) DEFAULT 'Preliminary' CHECK (result_status IN ('Preliminary', 'Final')),
    technician_name VARCHAR(100),
    pathologist_name VARCHAR(100),
    authenticated_result BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_results_visit_id ON lab_results(visit_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_lab_id ON lab_results(lab_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_test_name ON lab_results(test_name);
CREATE INDEX IF NOT EXISTS idx_lab_results_created_at ON lab_results(created_at);

-- Add RLS (Row Level Security) policy
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (can be restricted later)
CREATE POLICY "Allow all operations on lab_results" ON lab_results FOR ALL USING (true);

-- Add trigger to update updated_at timestamp
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