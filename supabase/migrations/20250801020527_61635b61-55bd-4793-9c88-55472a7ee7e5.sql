-- Add patient_signature field to discharge_checklist table
ALTER TABLE public.discharge_checklist 
ADD COLUMN IF NOT EXISTS patient_signature boolean DEFAULT false;