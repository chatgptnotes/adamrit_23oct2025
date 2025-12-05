-- Add additional approval fields to doctor_plan table
ALTER TABLE doctor_plan 
ADD COLUMN additional_approval_surgery TEXT,
ADD COLUMN additional_approval_surgery_date DATE,
ADD COLUMN additional_approval_investigation TEXT,
ADD COLUMN additional_approval_investigation_date DATE,
ADD COLUMN extension_stay_approval TEXT,
ADD COLUMN extension_stay_approval_date DATE;