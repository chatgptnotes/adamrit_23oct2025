-- Add OT charges column to visit_anesthetists table
-- OT charges are entered alongside anesthetist rates and auto-appear in the final bill
ALTER TABLE visit_anesthetists ADD COLUMN IF NOT EXISTS ot_charges NUMERIC DEFAULT 0;
