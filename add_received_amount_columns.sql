-- SQL script to add Received Amount columns to existing bill_preparation table
-- Run this if you already have the bill_preparation table and need to add the new fields

-- Add the new columns for Received Amount functionality
ALTER TABLE public.bill_preparation ADD COLUMN IF NOT EXISTS received_date DATE;
ALTER TABLE public.bill_preparation ADD COLUMN IF NOT EXISTS received_amount DECIMAL(15,2);
ALTER TABLE public.bill_preparation ADD COLUMN IF NOT EXISTS deduction_amount DECIMAL(15,2);
ALTER TABLE public.bill_preparation ADD COLUMN IF NOT EXISTS reason_for_deduction TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN public.bill_preparation.received_date IS 'Date when payment was received';
COMMENT ON COLUMN public.bill_preparation.received_amount IS 'Amount that was actually received';
COMMENT ON COLUMN public.bill_preparation.deduction_amount IS 'Amount that was deducted from payment';
COMMENT ON COLUMN public.bill_preparation.reason_for_deduction IS 'Reason for any deductions made';

-- Add index for received_date for better performance
CREATE INDEX IF NOT EXISTS idx_bill_preparation_received_date ON public.bill_preparation(received_date);

-- Grant permissions to authenticated users
GRANT ALL ON public.bill_preparation TO authenticated;