-- Run this in Supabase SQL Editor to add marketing_staff column
-- This allows tracking which marketing person visited

ALTER TABLE corporate_area_meetings 
ADD COLUMN IF NOT EXISTS marketing_staff TEXT;

ALTER TABLE corporate_area_meetings 
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

ALTER TABLE corporate_area_meetings 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES corporate_area_contacts(id);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'corporate_area_meetings'
ORDER BY ordinal_position;
