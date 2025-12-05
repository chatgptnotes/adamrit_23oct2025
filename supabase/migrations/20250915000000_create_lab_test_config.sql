-- Create lab_test_config table
CREATE TABLE IF NOT EXISTS lab_test_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_name TEXT NOT NULL,
    sub_test_name TEXT NOT NULL,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Both')),
    min_value DECIMAL NOT NULL,
    max_value DECIMAL NOT NULL,
    normal_unit TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(test_name, sub_test_name, min_age, max_age, gender)
);

-- Enable Row Level Security
ALTER TABLE lab_test_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON lab_test_config
    FOR ALL USING (true);

-- Create policy to allow read access for anonymous users
CREATE POLICY "Allow read access for anonymous users" ON lab_test_config
    FOR SELECT USING (true);

-- Insert initial test data
INSERT INTO lab_test_config (test_name, sub_test_name, min_age, max_age, gender, min_value, max_value, normal_unit)
VALUES
    -- Kidney Function Test
    ('Kidney Function Test (Kidney Function Test1)', 'Blood Urea', 60, 100, 'Both', 8.0, 26.0, 'mg/dL'),
    ('Kidney Function Test (Kidney Function Test1)', 'Creatinine', 60, 100, 'Both', 0.8, 1.4, 'mg/dL'),
    ('Kidney Function Test (Kidney Function Test1)', 'Sr. Sodium', 18, 100, 'Both', 136.0, 146.0, 'mmol/L'),
    ('Kidney Function Test (Kidney Function Test1)', 'Sr. Potassium', 18, 100, 'Both', 3.5, 5.1, 'mmol/L'),
    ('Kidney Function Test (Kidney Function Test1)', 'Ionized calcium', 18, 100, 'Both', 1.25, 2.5, 'mm'),

    -- yyy Test with sub-tests
    ('yyy', 'RR', 60, 100, 'Female', 16.8, 20.0, 'g/dl'),
    ('yyy', 'RRR', 16, 100, 'Both', 16.0, 20.0, 'g/dl')
ON CONFLICT (test_name, sub_test_name, min_age, max_age, gender) DO UPDATE SET
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    normal_unit = EXCLUDED.normal_unit,
    updated_at = NOW();