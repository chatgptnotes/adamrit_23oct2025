-- Fix: Change vouchers.created_by from UUID to TEXT
-- Same fix that was applied to final_payments in migration 20251105000006
-- The trigger function inserts text values ('system_trigger', 'system')
-- into this column, causing UUID type mismatch errors

ALTER TABLE public.vouchers
ALTER COLUMN created_by TYPE TEXT USING created_by::text;
