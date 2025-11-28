-- ============================================================================
-- Add new columns to bill_preparation table
-- Includes: Bill Link/Referral Letter and NMI Tracking fields
-- ============================================================================

-- Step 1: Add Bill Link/Referral Letter columns
ALTER TABLE public.bill_preparation
ADD COLUMN IF NOT EXISTS bill_link_spreadsheet TEXT,
ADD COLUMN IF NOT EXISTS referral_letter TEXT,
ADD COLUMN IF NOT EXISTS bill_link_date DATE;

-- Add comments for Bill Link/Referral Letter columns
COMMENT ON COLUMN public.bill_preparation.bill_link_spreadsheet IS 'Link to billing spreadsheet';
COMMENT ON COLUMN public.bill_preparation.referral_letter IS 'Path or reference to referral letter document';
COMMENT ON COLUMN public.bill_preparation.bill_link_date IS 'Date when bill link was created';

-- Step 2: Add NMI Tracking columns
ALTER TABLE public.bill_preparation
ADD COLUMN IF NOT EXISTS nmi_date DATE,
ADD COLUMN IF NOT EXISTS nmi TEXT,
ADD COLUMN IF NOT EXISTS nmi_answered TEXT;

-- Add comments for NMI Tracking columns
COMMENT ON COLUMN public.bill_preparation.nmi_date IS 'Date for NMI tracking';
COMMENT ON COLUMN public.bill_preparation.nmi IS 'NMI identifier or details';
COMMENT ON COLUMN public.bill_preparation.nmi_answered IS 'Status of NMI answer (Yes/No/Pending)';

-- Create indexes for new columns for better performance
CREATE INDEX IF NOT EXISTS idx_bill_preparation_bill_link_date ON public.bill_preparation(bill_link_date);
CREATE INDEX IF NOT EXISTS idx_bill_preparation_nmi_date ON public.bill_preparation(nmi_date);
CREATE INDEX IF NOT EXISTS idx_bill_preparation_nmi_answered ON public.bill_preparation(nmi_answered);

-- ============================================================================
-- Example INSERT Queries
-- ============================================================================

-- Example 1: Insert a new record with all fields
INSERT INTO public.bill_preparation (
    visit_id,
    -- Bill Preparation fields
    date_of_bill_preparation,
    bill_amount,
    expected_amount,
    billing_executive,
    reason_for_delay,
    -- Bill Submission fields
    date_of_submission,
    executive_who_submitted,
    -- Received Amount fields
    received_date,
    received_amount,
    deduction_amount,
    reason_for_deduction,
    -- Bill Link/Referral Letter fields
    bill_link_spreadsheet,
    referral_letter,
    bill_link_date,
    -- NMI Tracking fields
    nmi_date,
    nmi,
    nmi_answered
) VALUES (
    'VISIT_ID_HERE',  -- Replace with actual visit_id
    -- Bill Preparation values
    CURRENT_DATE,  -- or TO_DATE('19-09-2025', 'DD-MM-YYYY') for specific date
    5000.00,  -- bill_amount
    5500.00,  -- expected_amount
    'John Doe',  -- billing_executive
    'Documentation pending',  -- reason_for_delay
    -- Bill Submission values
    NULL,  -- date_of_submission
    NULL,  -- executive_who_submitted
    -- Received Amount values
    NULL,  -- received_date
    NULL,  -- received_amount
    NULL,  -- deduction_amount
    NULL,  -- reason_for_deduction
    -- Bill Link/Referral Letter values
    'https://spreadsheet-link.com/bill123',  -- bill_link_spreadsheet
    '/documents/referral/ref_123.pdf',  -- referral_letter
    TO_DATE('19-09-2025', 'DD-MM-YYYY'),  -- bill_link_date
    -- NMI Tracking values
    TO_DATE('19-09-2025', 'DD-MM-YYYY'),  -- nmi_date
    'NMI123456',  -- nmi (without quotes or slashes)
    'Pending'  -- nmi_answered
);

-- Example 2: Insert only required fields and new columns
INSERT INTO public.bill_preparation (
    visit_id,
    bill_link_spreadsheet,
    bill_link_date,
    nmi_date,
    nmi,
    nmi_answered
) VALUES (
    'VISIT_ID_HERE',
    'spreadsheet_link_here',
    TO_DATE('19-09-2025', 'DD-MM-YYYY'),
    TO_DATE('19-09-2025', 'DD-MM-YYYY'),
    'NMI_VALUE_HERE',
    'Yes'
);

-- ============================================================================
-- Example UPDATE Queries
-- ============================================================================

-- Example 1: Update Bill Link/Referral Letter fields for existing record
UPDATE public.bill_preparation
SET
    bill_link_spreadsheet = 'https://spreadsheet-link.com/updated',
    referral_letter = '/documents/new_referral.pdf',
    bill_link_date = TO_DATE('19-09-2025', 'DD-MM-YYYY'),
    updated_at = NOW()
WHERE visit_id = 'VISIT_ID_HERE';

-- Example 2: Update NMI Tracking fields for existing record
UPDATE public.bill_preparation
SET
    nmi_date = TO_DATE('19-09-2025', 'DD-MM-YYYY'),
    nmi = 'NMI789012',
    nmi_answered = 'Yes',
    updated_at = NOW()
WHERE visit_id = 'VISIT_ID_HERE';

-- Example 3: Update all new fields at once
UPDATE public.bill_preparation
SET
    -- Bill Link/Referral Letter fields
    bill_link_spreadsheet = 'spreadsheet_link',
    referral_letter = 'referral_document_path',
    bill_link_date = CURRENT_DATE,
    -- NMI Tracking fields
    nmi_date = CURRENT_DATE,
    nmi = 'NMI_NUMBER',
    nmi_answered = 'No',
    -- Update timestamp
    updated_at = NOW()
WHERE visit_id = 'VISIT_ID_HERE';

-- ============================================================================
-- Verify the changes
-- ============================================================================

-- Query to check the table structure after changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bill_preparation'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Query to see sample data
SELECT
    visit_id,
    bill_link_spreadsheet,
    referral_letter,
    bill_link_date,
    nmi_date,
    nmi,
    nmi_answered,
    created_at,
    updated_at
FROM public.bill_preparation
LIMIT 10;