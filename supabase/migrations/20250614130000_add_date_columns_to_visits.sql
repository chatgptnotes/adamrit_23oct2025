-- Add admission_date, surgery_date, and discharge_date columns to visits table
-- These are needed for the EditPatientDialog to save visit-specific dates

ALTER TABLE public.visits 
ADD COLUMN admission_date DATE,
ADD COLUMN surgery_date DATE,
ADD COLUMN discharge_date DATE;

-- Create indexes for better performance
CREATE INDEX idx_visits_admission_date ON public.visits(admission_date);
CREATE INDEX idx_visits_surgery_date ON public.visits(surgery_date);
CREATE INDEX idx_visits_discharge_date ON public.visits(discharge_date);