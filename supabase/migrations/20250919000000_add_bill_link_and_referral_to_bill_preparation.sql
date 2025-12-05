-- Add bill link spreadsheet and referral letter columns to bill_preparation table
-- Migration: 20250919000000_add_bill_link_and_referral_to_bill_preparation

-- Add bill_link_spreadsheet column to store the spreadsheet link
ALTER TABLE public.bill_preparation
ADD COLUMN IF NOT EXISTS bill_link_spreadsheet TEXT;

-- Add referral_letter column to store the referral letter file path/name
ALTER TABLE public.bill_preparation
ADD COLUMN IF NOT EXISTS referral_letter TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.bill_preparation.bill_link_spreadsheet IS 'Link to the bill spreadsheet';
COMMENT ON COLUMN public.bill_preparation.referral_letter IS 'Path or reference to the referral letter document';

-- Create indexes for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_bill_preparation_bill_link ON public.bill_preparation(bill_link_spreadsheet);
CREATE INDEX IF NOT EXISTS idx_bill_preparation_referral_letter ON public.bill_preparation(referral_letter);

-- Sample INSERT query (commented out - for reference only)
/*
INSERT INTO public.bill_preparation (
    visit_id,
    date_of_bill_preparation,
    bill_amount,
    expected_amount,
    billing_executive,
    bill_link_spreadsheet,
    referral_letter
) VALUES (
    'VISIT-2025-001',
    '2025-01-19',
    5000.00,
    5000.00,
    'John Doe',
    'https://spreadsheet-link-here.com',
    'path/to/referral_letter.pdf'
);
*/

-- Sample UPDATE query (commented out - for reference only)
/*
UPDATE public.bill_preparation
SET
    bill_link_spreadsheet = 'https://your-spreadsheet-link.com',
    referral_letter = 'path/to/referral_letter.pdf'
WHERE visit_id = 'VISIT-2025-001';
*/