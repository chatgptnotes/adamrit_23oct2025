-- Add marketing_staff column to track which marketing person visited
ALTER TABLE corporate_area_meetings 
ADD COLUMN IF NOT EXISTS marketing_staff TEXT;

-- Add photos column if not exists (to store photo URLs)
ALTER TABLE corporate_area_meetings 
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Add contact_id column if not exists (to link to specific contact)
ALTER TABLE corporate_area_meetings 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES corporate_area_contacts(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_corporate_area_meetings_marketing_staff 
ON corporate_area_meetings(marketing_staff);

CREATE INDEX IF NOT EXISTS idx_corporate_area_meetings_area_id 
ON corporate_area_meetings(area_id);
