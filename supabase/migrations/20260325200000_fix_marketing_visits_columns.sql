-- Make marketingUser_id nullable (visit can be added without assigning staff)
ALTER TABLE marketing_visits ALTER COLUMN "marketingUser_id" DROP NOT NULL;

-- Add image_url column for visit photos
ALTER TABLE marketing_visits ADD COLUMN IF NOT EXISTS image_url TEXT;
