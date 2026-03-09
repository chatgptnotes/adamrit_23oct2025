-- Add created_by column to corporate_area_contacts for per-user data isolation
ALTER TABLE corporate_area_contacts ADD COLUMN IF NOT EXISTS created_by text;

-- Add created_by column to corporate_area_meetings for per-user data isolation
ALTER TABLE corporate_area_meetings ADD COLUMN IF NOT EXISTS created_by text;

-- Create indexes for fast filtering by created_by
CREATE INDEX IF NOT EXISTS idx_corporate_area_contacts_created_by ON corporate_area_contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_corporate_area_meetings_created_by ON corporate_area_meetings(created_by);
