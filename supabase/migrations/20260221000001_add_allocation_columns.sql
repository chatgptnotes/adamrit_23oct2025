-- Add bill_amount, deduction_amount, tds_amount, patients_id columns to allocation table
ALTER TABLE corporate_bulk_payment_allocations
    ADD COLUMN bill_amount DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN deduction_amount DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN tds_amount DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN patients_id TEXT;
