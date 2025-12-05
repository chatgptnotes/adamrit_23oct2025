-- Create the patient_data table
CREATE TABLE IF NOT EXISTS patient_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT,
    sst_or_secondary_treatment TEXT,
    mrn TEXT,
    patient_id TEXT,
    age TEXT,
    referral_original BOOLEAN DEFAULT false,
    e_pahachan_card BOOLEAN DEFAULT false,
    entitlement_benefits BOOLEAN DEFAULT false,
    adhar_card BOOLEAN DEFAULT false,
    sex TEXT,
    patient_type TEXT,
    reff_dr_name TEXT,
    date_of_admission TIMESTAMP WITH TIME ZONE,
    date_of_discharge TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_data_updated_at
    BEFORE UPDATE ON patient_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data
INSERT INTO patient_data (
    patient_name,
    sst_or_secondary_treatment,
    mrn,
    patient_id,
    age,
    referral_original,
    e_pahachan_card,
    entitlement_benefits,
    adhar_card,
    sex,
    patient_type,
    reff_dr_name,
    date_of_admission,
    date_of_discharge
) VALUES 
('Rahul Kumar', 'SST', 'MRN001', 'P001', '45', true, true, true, true, 'Male', 'Regular', 'Dr. Sharma', NOW() - INTERVAL '5 days', NOW()),
('Priya Singh', 'Secondary', 'MRN002', 'P002', '32', false, true, true, true, 'Female', 'Emergency', 'Dr. Patel', NOW() - INTERVAL '4 days', NOW() + INTERVAL '2 days'),
('Amit Verma', 'SST', 'MRN003', 'P003', '58', true, false, true, true, 'Male', 'Regular', 'Dr. Gupta', NOW() - INTERVAL '3 days', NOW() + INTERVAL '5 days'),
('Sneha Reddy', 'Secondary', 'MRN004', 'P004', '29', true, true, false, true, 'Female', 'Regular', 'Dr. Kumar', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days'),
('Rajesh Khanna', 'SST', 'MRN005', 'P005', '52', false, true, true, false, 'Male', 'Emergency', 'Dr. Singh', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days'); 