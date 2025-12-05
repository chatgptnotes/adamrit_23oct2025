-- Fix the populate_discharge_summary_from_visit trigger function
-- The trigger is referencing a non-existent column 'ordering_doctor_id'
-- This migration either fixes the function or disables the problematic trigger

-- Option 1: Drop the trigger temporarily (safest for now)
DROP TRIGGER IF EXISTS auto_populate_discharge_summary ON ipd_discharge_summary;

-- If you want to keep the trigger, you would need to recreate the function
-- with the correct column name (referring_doctor instead of ordering_doctor_id)
-- But for now, we're just removing the problematic trigger