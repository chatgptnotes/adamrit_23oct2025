-- Add condonation_delay_claim column to visits table
ALTER TABLE public.visits 
ADD COLUMN condonation_delay_claim TEXT DEFAULT 'not_present' CHECK (condonation_delay_claim IN ('present', 'not_present'));