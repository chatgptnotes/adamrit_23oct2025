
-- Add foreign key columns for labs, radiology, and visits to patient_bill_details table
ALTER TABLE patient_bill_details 
ADD COLUMN lab_id uuid REFERENCES lab(id),
ADD COLUMN radiology_id uuid REFERENCES radiology(id),
ADD COLUMN visit_id uuid REFERENCES visits(id);

-- Add indexes for better performance on the new foreign keys
CREATE INDEX idx_patient_bill_details_lab_id ON patient_bill_details(lab_id);
CREATE INDEX idx_patient_bill_details_radiology_id ON patient_bill_details(radiology_id);
CREATE INDEX idx_patient_bill_details_visit_id ON patient_bill_details(visit_id);

-- Optional: Add custom text fields for labs and radiology (if you want both foreign key and custom text options)
ALTER TABLE patient_bill_details 
ADD COLUMN labs_custom text,
ADD COLUMN radiology_custom text;
