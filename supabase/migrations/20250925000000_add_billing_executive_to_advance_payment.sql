-- Add billing_executive column to advance_payment table
-- Created: 2025-09-25
-- Purpose: Add billing executive selection to advance payment records

-- Add the billing_executive column
ALTER TABLE advance_payment 
ADD COLUMN IF NOT EXISTS billing_executive TEXT;

-- Add a comment to the column
COMMENT ON COLUMN advance_payment.billing_executive IS 'Name of the billing executive handling the payment (e.g., Dr.B.K.Murali, Ruby, Shrikant, etc.)';

-- Create index for better performance when filtering by billing executive
CREATE INDEX IF NOT EXISTS idx_advance_payment_billing_executive ON advance_payment(billing_executive);

-- Update the existing RLS policy (if needed) - keeping the same policy
-- The existing policy already allows all operations for authenticated users

-- Insert success message
SELECT 'billing_executive column added to advance_payment table successfully!' as status;