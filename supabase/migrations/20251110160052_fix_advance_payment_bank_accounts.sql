-- Fix advance_payment table to include bank account columns
-- Created: 2025-11-10
-- Purpose: Add missing bank_account_id and bank_account_name columns that the trigger expects

-- Add bank_account_id column (references chart_of_accounts)
ALTER TABLE advance_payment
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES chart_of_accounts(id);

-- Add bank_account_name column for display purposes
ALTER TABLE advance_payment
ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_advance_payment_bank_account ON advance_payment(bank_account_id);

-- Add comments
COMMENT ON COLUMN advance_payment.bank_account_id IS 'Bank account used for non-cash payments (ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, DD)';
COMMENT ON COLUMN advance_payment.bank_account_name IS 'Name of the bank account for display purposes';

-- Success message
SELECT 'bank_account_id and bank_account_name columns added to advance_payment table successfully!' as status;
