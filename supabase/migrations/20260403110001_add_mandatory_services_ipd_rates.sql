-- Add IPD-specific rate columns to mandatory_services table
-- Existing rates will serve as OPD rates (default)
-- IPD rates override when patient_type is 'IPD'

ALTER TABLE mandatory_services ADD COLUMN IF NOT EXISTS tpa_rate_ipd NUMERIC;
ALTER TABLE mandatory_services ADD COLUMN IF NOT EXISTS private_rate_ipd NUMERIC;
ALTER TABLE mandatory_services ADD COLUMN IF NOT EXISTS nabh_rate_ipd NUMERIC;
ALTER TABLE mandatory_services ADD COLUMN IF NOT EXISTS non_nabh_rate_ipd NUMERIC;
ALTER TABLE mandatory_services ADD COLUMN IF NOT EXISTS nabh_bhopal_ipd NUMERIC;
ALTER TABLE mandatory_services ADD COLUMN IF NOT EXISTS non_nabh_bhopal_ipd NUMERIC;
