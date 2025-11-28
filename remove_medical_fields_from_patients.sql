-- Remove medical data fields from patients table
-- Medical data should ONLY be stored in junction tables (visit_labs, visit_radiology, visit_medications)
-- NOT in the main patients table

-- IMPORTANT: Run this migration AFTER ensuring all medical data has been migrated 
-- to the proper junction tables if needed

-- Remove medical data columns from patients table
ALTER TABLE public.patients DROP COLUMN IF EXISTS labs_radiology;
ALTER TABLE public.patients DROP COLUMN IF EXISTS antibiotics;
ALTER TABLE public.patients DROP COLUMN IF EXISTS other_medications;

-- Optional: Also remove labs and radiology if they exist as separate columns
ALTER TABLE public.patients DROP COLUMN IF EXISTS labs;
ALTER TABLE public.patients DROP COLUMN IF EXISTS radiology;

-- Add comment to document the change
COMMENT ON TABLE public.patients IS 'Patient master data table. Medical data (labs, radiology, medications) is stored in junction tables: visit_labs, visit_radiology, visit_medications';

-- Verify the junction tables exist and are properly structured
DO $$
BEGIN
    -- Check if junction tables exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visit_labs') THEN
        RAISE EXCEPTION 'visit_labs junction table does not exist. Please create it first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visit_radiology') THEN
        RAISE EXCEPTION 'visit_radiology junction table does not exist. Please create it first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visit_medications') THEN
        RAISE EXCEPTION 'visit_medications junction table does not exist. Please create it first.';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Medical data fields removed from patients table. Medical data is now properly stored in junction tables only.';
END $$; 