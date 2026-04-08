-- Add columns to persist OPD summary Panel 1, Panel 2, and Panel 3 content
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS extracted_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS fetched_data_text TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS opd_summary_text TEXT DEFAULT '';

COMMENT ON COLUMN public.visits.extracted_notes IS 'Panel 1: OCR-extracted handwritten notes for OPD summary';
COMMENT ON COLUMN public.visits.fetched_data_text IS 'Panel 2: Fetched database data text for OPD summary';
COMMENT ON COLUMN public.visits.opd_summary_text IS 'Panel 3: AI-generated OPD summary text';
