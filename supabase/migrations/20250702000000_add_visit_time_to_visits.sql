-- Add visit_time field to visits table for appointment scheduling
ALTER TABLE public.visits 
ADD COLUMN visit_time TIME;

-- Create index for better performance
CREATE INDEX idx_visits_visit_time ON public.visits(visit_time);
