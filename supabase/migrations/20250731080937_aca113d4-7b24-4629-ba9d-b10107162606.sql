-- Fix the doctor_plan accommodation check constraint to allow empty values
DROP CONSTRAINT IF EXISTS doctor_plan_accommodation_check ON doctor_plan;

-- Add a new constraint that allows empty strings and null values
ALTER TABLE doctor_plan 
ADD CONSTRAINT doctor_plan_accommodation_check 
CHECK (accommodation IS NULL OR accommodation = '' OR length(trim(accommodation)) > 0);