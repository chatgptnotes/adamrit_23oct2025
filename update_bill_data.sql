-- Update Bill Link and Referral Letter data in existing bill_preparation table
-- Form Data: Bill Link: https://www.adamrit.com/, Date: 02-09-2025, Referral Letter: indian-male-model_928503-1125.jpg

-- Option 1: Update first row (cee50a67-c472-49e1-9224-c6ad6d8f80eb)
UPDATE public.bill_preparation
SET
    bill_link_spreadsheet = 'https://www.adamrit.com/',
    referral_letter = 'indian-male-model_928503-1125.jpg',
    date_of_bill_preparation = '2025-09-02',
    updated_at = NOW()
WHERE id = 'cee50a67-c472-49e1-9224-c6ad6d8f80eb'::uuid;

-- Option 2: Update second row (d1f41c36-dcab-46b6-93eb-7696044ad600)
UPDATE public.bill_preparation
SET
    bill_link_spreadsheet = 'https://www.adamrit.com/',
    referral_letter = 'indian-male-model_928503-1125.jpg',
    start_date = '2025-09-02',
    updated_at = NOW()
WHERE id = 'd1f41c36-dcab-46b6-93eb-7696044ad600'::uuid;

-- Verification query to check updated data
SELECT
    id,
    bill_link_spreadsheet,
    referral_letter,
    date_of_bill_preparation,
    start_date,
    updated_at
FROM public.bill_preparation
WHERE bill_link_spreadsheet = 'https://www.adamrit.com/';