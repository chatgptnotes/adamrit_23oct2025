-- Add a new column specifically for referral letter status
-- Run this SQL script directly in your Supabase SQL Editor

-- Step 1: Add new column for referral letter status
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS referral_letter_status TEXT DEFAULT 'not_sanction';

-- Step 2: Update existing records
UPDATE public.visits 
SET referral_letter_status = CASE 
    WHEN file_status = 'available' THEN 'sanctioned'
    WHEN file_status = 'missing' THEN 'not_sanction'
    ELSE 'not_sanction'
END;

-- Step 3: Test the new column
UPDATE public.visits 
SET referral_letter_status = 'sanctioned' 
WHERE id = (SELECT id FROM public.visits LIMIT 1);

UPDATE public.visits 
SET referral_letter_status = 'not_sanction' 
WHERE id = (SELECT id FROM public.visits LIMIT 1);

UPDATE public.visits 
SET referral_letter_status = 'initiated_sanction' 
WHERE id = (SELECT id FROM public.visits LIMIT 1);

-- Step 4: Show current value
SELECT referral_letter_status 
FROM public.visits 
WHERE id = (SELECT id FROM public.visits LIMIT 1);

SELECT 'NEW REFERRAL LETTER COLUMN CREATED!' as result;
