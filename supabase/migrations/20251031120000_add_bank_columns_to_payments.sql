-- Migration: Add bank account columns to payment tables
-- Created: 2025-10-31
-- Purpose: Store selected bank account information for online transfers and bank transfer payments

-- Add bank account columns to advance_payment table
ALTER TABLE advance_payment
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- Add bank account columns to final_payments table
ALTER TABLE final_payments
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES chart_of_accounts(id),
ADD COLUMN IF NOT EXISTS bank_account_name TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_advance_payment_bank_account ON advance_payment(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_final_payments_bank_account ON final_payments(bank_account_id);

-- Add comments for documentation
COMMENT ON COLUMN advance_payment.bank_account_id IS 'Foreign key to chart_of_accounts for selected bank account (only for ONLINE payment mode)';
COMMENT ON COLUMN advance_payment.bank_account_name IS 'Denormalized bank account name for quick display without joins';

COMMENT ON COLUMN final_payments.bank_account_id IS 'Foreign key to chart_of_accounts for selected bank account (only for Bank Transfer payment mode)';
COMMENT ON COLUMN final_payments.bank_account_name IS 'Denormalized bank account name for quick display without joins';
