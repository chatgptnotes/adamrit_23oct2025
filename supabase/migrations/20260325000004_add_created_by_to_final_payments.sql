-- Fix: Add missing created_by column to final_payments
-- The column is defined in the CREATE TABLE migration (20251003000000)
-- but was never added to the live DB because the table pre-existed that migration.
-- The trigger function create_receipt_voucher_for_payment() references NEW.created_by
-- which crashes with "record new has no field created_by" without this column.

ALTER TABLE public.final_payments ADD COLUMN IF NOT EXISTS created_by TEXT;
