-- Add implant, anaesthetist_name, and anaesthesia_type fields to visit_surgeries table
ALTER TABLE public.visit_surgeries
ADD COLUMN IF NOT EXISTS implant TEXT,
ADD COLUMN IF NOT EXISTS anaesthetist_name TEXT,
ADD COLUMN IF NOT EXISTS anaesthesia_type TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.visit_surgeries.implant IS 'Implant details for the surgery';
COMMENT ON COLUMN public.visit_surgeries.anaesthetist_name IS 'Name of the anaesthetist for the surgery';
COMMENT ON COLUMN public.visit_surgeries.anaesthesia_type IS 'Type of anaesthesia service (General, Regional, Local, Sedation, etc.)';