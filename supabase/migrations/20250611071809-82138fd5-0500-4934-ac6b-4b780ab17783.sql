
-- Add patients_id column to patients table to store custom patient IDs
ALTER TABLE patients ADD COLUMN patients_id text UNIQUE;
