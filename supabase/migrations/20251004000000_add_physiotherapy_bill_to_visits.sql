-- Add physiotherapy bill columns to visits table
-- This stores the summary of physiotherapy bills for each visit

-- Add bill number column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_number TEXT;

COMMENT ON COLUMN public.visits.physiotherapy_bill_number IS 'Physiotherapy bill number (e.g., OH2503001)';

-- Add total bill amount column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_total NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN public.visits.physiotherapy_bill_total IS 'Total amount of physiotherapy bill';

-- Add date range for physiotherapy treatment
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_date_from DATE;

COMMENT ON COLUMN public.visits.physiotherapy_bill_date_from IS 'Start date of physiotherapy treatment (DL from date)';

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_date_to DATE;

COMMENT ON COLUMN public.visits.physiotherapy_bill_date_to IS 'End date of physiotherapy treatment (DL to date)';

-- Add timestamp for when bill was generated
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_generated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.visits.physiotherapy_bill_generated_at IS 'Timestamp when physiotherapy bill was generated';

-- Create index for faster bill number lookups
CREATE INDEX IF NOT EXISTS idx_visits_physiotherapy_bill_number
ON public.visits(physiotherapy_bill_number)
WHERE physiotherapy_bill_number IS NOT NULL;
