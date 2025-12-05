-- Create table for storing doctor's plan treatment log data
CREATE TABLE IF NOT EXISTS doctor_plan (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date_of_stay TEXT,
    medication TEXT,
    lab_and_radiology TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique day number per visit
    UNIQUE(visit_id, day_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_doctor_plan_visit_id ON doctor_plan(visit_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE doctor_plan ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view all doctor plans
CREATE POLICY "Allow authenticated users to view doctor plans" ON doctor_plan
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert doctor plans
CREATE POLICY "Allow authenticated users to insert doctor plans" ON doctor_plan
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update doctor plans
CREATE POLICY "Allow authenticated users to update doctor plans" ON doctor_plan
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to delete doctor plans
CREATE POLICY "Allow authenticated users to delete doctor plans" ON doctor_plan
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_doctor_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctor_plan_updated_at
    BEFORE UPDATE ON doctor_plan
    FOR EACH ROW
    EXECUTE FUNCTION update_doctor_plan_updated_at();
