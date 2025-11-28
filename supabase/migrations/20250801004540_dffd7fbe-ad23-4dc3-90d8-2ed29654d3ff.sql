-- Add condonation_delay_intimation column to visits table
ALTER TABLE public.visits 
ADD COLUMN condonation_delay_intimation TEXT DEFAULT 'not_present' CHECK (condonation_delay_intimation IN ('present', 'not_present'));