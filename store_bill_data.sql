-- SQL queries to store Bill Link and Referral Letter data
-- Data from form: Bill Link: https://www.adamrit.com/, Date: 18-09-2025, Referral Letter: Gemini_Generated_Image_8elo(m)8elo(m)8elo.png

-- Option 1: INSERT new record into bill_preparation table
INSERT INTO public.bill_preparation (
    visit_id,
    date_of_bill_preparation,
    bill_link_spreadsheet,
    referral_letter,
    created_at,
    updated_at
) VALUES (
    'YOUR_VISIT_ID_HERE',  -- Replace with actual visit_id
    '2025-09-18',
    'https://www.adamrit.com/',
    'Gemini_Generated_Image_8elo(m)8elo(m)8elo.png',
    NOW(),
    NOW()
);

-- Option 2: UPDATE existing record (replace the ID with your actual record ID)
UPDATE public.bill_preparation
SET
    bill_link_spreadsheet = 'https://www.adamrit.com/',
    referral_letter = 'Gemini_Generated_Image_8elo(m)8elo(m)8elo.png',
    date_of_bill_preparation = '2025-09-18',
    updated_at = NOW()
WHERE id = 'cee50a67-c472-49e1-9224-c6ad6d8f80eb';

-- Option 3: UPDATE based on visit_id (if you know the visit_id)
-- UPDATE public.bill_preparation
-- SET
--     bill_link_spreadsheet = 'https://www.adamrit.com/',
--     referral_letter = 'Gemini_Generated_Image_8elo(m)8elo(m)8elo.png',
--     date_of_bill_preparation = '2025-09-18',
--     updated_at = NOW()
-- WHERE visit_id = 'YOUR_VISIT_ID_HERE';

-- Verification query to check if data was stored successfully
SELECT
    id,
    visit_id,
    date_of_bill_preparation,
    bill_link_spreadsheet,
    referral_letter,
    created_at,
    updated_at
FROM public.bill_preparation
WHERE bill_link_spreadsheet = 'https://www.adamrit.com/'
   OR referral_letter = 'Gemini_Generated_Image_8elo(m)8elo(m)8elo.png';