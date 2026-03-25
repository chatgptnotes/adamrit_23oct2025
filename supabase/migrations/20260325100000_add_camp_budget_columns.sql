-- Make marketing_user_id nullable (camp can be added without assigning staff)
ALTER TABLE marketing_camps ALTER COLUMN marketing_user_id DROP NOT NULL;

-- Add new columns
ALTER TABLE marketing_camps ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);
ALTER TABLE marketing_camps ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,2);
ALTER TABLE marketing_camps ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE marketing_camps ADD COLUMN IF NOT EXISTS image_url TEXT;
