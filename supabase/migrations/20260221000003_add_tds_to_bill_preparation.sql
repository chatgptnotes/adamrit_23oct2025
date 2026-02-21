-- Add tds_amount column to bill_preparation table
ALTER TABLE bill_preparation ADD COLUMN tds_amount DECIMAL(15,2) DEFAULT 0;
