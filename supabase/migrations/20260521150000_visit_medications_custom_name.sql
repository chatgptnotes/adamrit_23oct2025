-- Allow doctor-added, visit-only custom medicines on the Treatment Sheet.
-- These are prescribed by free-text name and are NOT added to the reusable
-- pharmacy catalogue (medicine_master), so medication_id must be nullable.
--
-- Additive + idempotent: existing rows keep their medication_id and simply
-- receive the new column defaults. Nothing is modified or deleted.

ALTER TABLE public.visit_medications ALTER COLUMN medication_id DROP NOT NULL;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS custom_medication_name TEXT;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE public.visit_medications ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
