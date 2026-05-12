-- Add intimation_date column to bill_preparation
ALTER TABLE public.bill_preparation
  ADD COLUMN IF NOT EXISTS intimation_date DATE;

COMMENT ON COLUMN public.bill_preparation.intimation_date IS
  'Date the hospital intimated the insurer/corporate about the bill; set per row from the Bill Submission table.';

CREATE INDEX IF NOT EXISTS idx_bill_preparation_intimation_date
  ON public.bill_preparation (intimation_date);
