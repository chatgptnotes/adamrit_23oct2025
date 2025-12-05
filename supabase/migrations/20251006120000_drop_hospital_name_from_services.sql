-- Drop hospital_name column from clinical_services table
ALTER TABLE public.clinical_services
DROP COLUMN IF EXISTS hospital_name;

-- Drop hospital_name column from mandatory_services table
ALTER TABLE public.mandatory_services
DROP COLUMN IF EXISTS hospital_name;

-- Drop indexes related to hospital_name if they exist
DROP INDEX IF EXISTS idx_clinical_services_hospital_name;
DROP INDEX IF EXISTS idx_mandatory_services_hospital_name;
