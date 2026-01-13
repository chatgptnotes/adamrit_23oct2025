-- Add referee_amount column to visits table
-- This stores the referral doctor's payment amount
ALTER TABLE visits ADD COLUMN IF NOT EXISTS referee_amount DECIMAL(10,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN visits.referee_amount IS 'Payment amount for the referral doctor';
