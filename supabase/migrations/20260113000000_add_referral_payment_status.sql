-- Add referral_payment_status column to visits table
-- Options: 'Paid', 'Unpaid', 'Direct'
ALTER TABLE visits ADD COLUMN IF NOT EXISTS referral_payment_status TEXT DEFAULT NULL;
