
-- Add new columns to the patients table for Hope surgeon and Hope consultants
ALTER TABLE public.patients 
ADD COLUMN hope_surgeon text,
ADD COLUMN hope_consultants text;
