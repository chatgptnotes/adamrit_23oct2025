-- Add generic_name and brand_name columns to prescription_items
-- for displaying molecule name (CAPS) + brand name (small) in prescriptions
ALTER TABLE public.prescription_items
  ADD COLUMN IF NOT EXISTS generic_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS brand_name TEXT DEFAULT '';
