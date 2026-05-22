-- Pharmacy dispense / substitution on the tablet treatment-sheet flow.
-- When a prescribed medicine is out of stock, pharmacy dispenses a different
-- available medicine; the medication round then shows what was actually
-- dispensed. These columns record that on the same visit_medications row.
--
-- Additive + idempotent: existing rows are untouched and just get the defaults.

ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS dispensed_medication_id UUID;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS dispensed_medication_name TEXT;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS is_substituted BOOLEAN DEFAULT false;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS substitute_reason TEXT;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS dispensed_at TIMESTAMPTZ;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS dispensed_by TEXT;
