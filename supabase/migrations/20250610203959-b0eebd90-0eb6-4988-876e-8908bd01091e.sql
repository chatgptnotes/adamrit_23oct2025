
-- Create a table for visits
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_type TEXT NOT NULL,
  appointment_with TEXT NOT NULL,
  reason_for_visit TEXT NOT NULL,
  relation_with_employee TEXT,
  status TEXT,
  diagnosis TEXT NOT NULL,
  surgery TEXT,
  referring_doctor TEXT,
  claim_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create an index on visit_id for faster lookups
CREATE INDEX idx_visits_visit_id ON public.visits(visit_id);

-- Create an index on patient_id for faster joins
CREATE INDEX idx_visits_patient_id ON public.visits(patient_id);

-- Create an index on visit_date for filtering today's visits
CREATE INDEX idx_visits_visit_date ON public.visits(visit_date);

-- Add Row Level Security (RLS) - making it public for now as there's no auth system
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Create policy that allows all operations (since no auth is implemented yet)
CREATE POLICY "Allow all operations on visits" 
  ON public.visits 
  FOR ALL 
  USING (true)
  WITH CHECK (true);
