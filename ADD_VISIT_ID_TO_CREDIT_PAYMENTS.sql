-- Add visit_id column to pharmacy_credit_payments table
-- This allows tracking credit payments per visit instead of just per patient

-- 1. Add visit_id column
ALTER TABLE public.pharmacy_credit_payments
ADD COLUMN IF NOT EXISTS visit_id TEXT;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_credit_payments_visit
ON public.pharmacy_credit_payments(visit_id);

-- 3. Verification
SELECT 'visit_id column added to pharmacy_credit_payments successfully!' as status;
