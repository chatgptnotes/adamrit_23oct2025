-- Add condonation_delay_submission column to visits table
-- Run this SQL script directly in your Supabase SQL Editor

ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS condonation_delay_submission TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.visits.condonation_delay_submission IS 'Condonation Delay Submission status: taken, not_taken, not_required';

-- Update existing records to have a default value
UPDATE public.visits 
SET condonation_delay_submission = 'not_taken' 
WHERE condonation_delay_submission IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'visits' 
AND column_name = 'condonation_delay_submission';
