
-- Create patient_bill_details table to store comprehensive patient billing information
CREATE TABLE patient_bill_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  diagnosis_id uuid NOT NULL REFERENCES diagnoses(id),
  primary_diagnosis text,
  complications text DEFAULT 'None',
  surgery_id uuid REFERENCES cghs_surgery(id),
  surgery_custom text, -- For custom surgery entries
  labs text,
  radiology text,
  labs_radiology text,
  antibiotic_id uuid REFERENCES medication(id),
  antibiotics_custom text, -- For custom antibiotic entries
  other_medications text,
  esic_surgeon_id uuid REFERENCES esic_surgeons(id),
  consultant_id uuid REFERENCES referees(id),
  hope_surgeon_id uuid REFERENCES hope_surgeons(id),
  hope_consultant_id uuid REFERENCES hope_consultants(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by text,
  status text DEFAULT 'DRAFT'
);

-- Add indexes for better performance
CREATE INDEX idx_patient_bill_details_patient_id ON patient_bill_details(patient_id);
CREATE INDEX idx_patient_bill_details_diagnosis_id ON patient_bill_details(diagnosis_id);
CREATE INDEX idx_patient_bill_details_status ON patient_bill_details(status);
CREATE INDEX idx_patient_bill_details_created_at ON patient_bill_details(created_at);

-- Add RLS policies (if needed)
ALTER TABLE patient_bill_details ENABLE ROW LEVEL SECURITY;

-- Create policy for basic access (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on patient_bill_details" 
ON patient_bill_details 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_bill_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_bill_details_updated_at
  BEFORE UPDATE ON patient_bill_details
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_bill_details_updated_at();
