-- Add missing columns to lab_results table
ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS main_test_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS test_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS test_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS result_value TEXT,
ADD COLUMN IF NOT EXISTS result_unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS reference_range VARCHAR(100),
ADD COLUMN IF NOT EXISTS comments TEXT,
ADD COLUMN IF NOT EXISTS is_abnormal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS result_status VARCHAR(20) DEFAULT 'Preliminary',
ADD COLUMN IF NOT EXISTS technician_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS pathologist_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS authenticated_result BOOLEAN DEFAULT FALSE;

-- Add missing timestamps if they don't exist
ALTER TABLE lab_results
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_results_main_test_name ON lab_results(main_test_name);
CREATE INDEX IF NOT EXISTS idx_lab_results_test_name ON lab_results(test_name);
CREATE INDEX IF NOT EXISTS idx_lab_results_result_status ON lab_results(result_status);