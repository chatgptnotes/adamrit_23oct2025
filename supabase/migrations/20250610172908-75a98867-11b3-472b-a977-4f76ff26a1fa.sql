
-- Add date columns to the patients table
ALTER TABLE patients 
ADD COLUMN admission_date date,
ADD COLUMN surgery_date date,
ADD COLUMN discharge_date date;
