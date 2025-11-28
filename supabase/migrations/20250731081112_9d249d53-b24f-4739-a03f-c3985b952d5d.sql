-- Enable RLS for the doctor_plan table
ALTER TABLE doctor_plan ENABLE ROW LEVEL SECURITY;

-- Create policies for doctor_plan
CREATE POLICY "Allow authenticated users to view doctor plans" ON doctor_plan
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert doctor plans" ON doctor_plan
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update doctor plans" ON doctor_plan
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete doctor plans" ON doctor_plan
    FOR DELETE USING (auth.role() = 'authenticated');