-- Add bunch_no column to visits table if it doesn't exist
ALTER TABLE visits ADD COLUMN IF NOT EXISTS bunch_no TEXT;