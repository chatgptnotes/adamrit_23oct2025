-- Add condonation_delay_submission column to visits table
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS condonation_delay_submission TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.visits.condonation_delay_submission IS 'Condonation Delay Submission status: taken, not_taken, not_required';

-- Update the column to have a default value
UPDATE public.visits 
SET condonation_delay_submission = 'not_taken' 
WHERE condonation_delay_submission IS NULL;
