-- Add claim_amount column to corporate_bulk_payments header table
ALTER TABLE corporate_bulk_payments
    ADD COLUMN claim_amount DECIMAL(15,2) DEFAULT 0;
