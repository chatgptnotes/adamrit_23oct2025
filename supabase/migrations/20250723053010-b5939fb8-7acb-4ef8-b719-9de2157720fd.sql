-- Enable Row Level Security for patient_data table
ALTER TABLE patient_data ENABLE ROW LEVEL SECURITY;

-- Create policies for patient_data table
CREATE POLICY "Anyone can view patient data" 
ON patient_data 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert patient data" 
ON patient_data 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update patient data" 
ON patient_data 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete patient data" 
ON patient_data 
FOR DELETE 
USING (true);