-- Add hospital_name column to bills, visit_discounts, and pharmacy_sales
-- so approvals can be identified by hospital

ALTER TABLE bills ADD COLUMN IF NOT EXISTS hospital_name TEXT;
ALTER TABLE visit_discounts ADD COLUMN IF NOT EXISTS hospital_name TEXT;
ALTER TABLE pharmacy_sales ADD COLUMN IF NOT EXISTS hospital_name TEXT;
