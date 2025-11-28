-- Drop the existing constraint first
ALTER TABLE doctor_plan DROP CONSTRAINT IF EXISTS doctor_plan_accommodation_check;

-- Add a new constraint that allows empty strings and null values
ALTER TABLE doctor_plan 
ADD CONSTRAINT doctor_plan_accommodation_check 
CHECK (accommodation IS NULL OR accommodation = '' OR length(trim(accommodation)) > 0);