-- Add billing_sub_status column to visits table if it doesn't exist
ALTER TABLE visits ADD COLUMN IF NOT EXISTS billing_sub_status TEXT;