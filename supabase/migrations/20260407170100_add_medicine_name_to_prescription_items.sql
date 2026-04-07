-- Add medicine_name column to prescription_items for storing medicine names
-- when medicine_id is null (e.g., from treatment sheet OCR extraction)
ALTER TABLE public.prescription_items
  ADD COLUMN IF NOT EXISTS medicine_name TEXT;

COMMENT ON COLUMN public.prescription_items.medicine_name IS 'Medicine name from OCR extraction or manual entry; used when medicine_id is null';
