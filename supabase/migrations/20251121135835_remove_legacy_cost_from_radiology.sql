-- Remove legacy cost column from radiology table
-- This column was a TEXT field that stored values like '₹500'
-- It has been replaced by proper DECIMAL rate columns:
-- - private (for private patients)
-- - NABH_NABL_Rate (for NABH accredited patients)
-- - Non_NABH_NABL_Rate (for CGHS/ECHS/ESIC patients)
-- - bhopal_nabh (for MP Police/Ordnance Factory patients)
-- - bhopal_non_nabh (for Bhopal non-NABH patients)

-- Remove the legacy cost column
ALTER TABLE public.radiology
DROP COLUMN IF EXISTS cost;

-- Add comment to table
COMMENT ON TABLE public.radiology IS 'Radiology master table - uses rate columns (private, NABH_NABL_Rate, Non_NABH_NABL_Rate, bhopal_nabh, bhopal_non_nabh) for patient-type-specific pricing';
