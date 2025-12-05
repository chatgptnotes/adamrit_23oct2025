-- Add accommodation column to doctor_plan table
ALTER TABLE doctor_plan 
ADD COLUMN accommodation TEXT;

-- Add check constraint to ensure only valid accommodation types
ALTER TABLE doctor_plan 
ADD CONSTRAINT doctor_plan_accommodation_check 
CHECK (accommodation IN ('General Ward', 'ICU') OR accommodation IS NULL);