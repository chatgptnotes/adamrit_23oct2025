-- Add file_status column to visits table
ALTER TABLE public.visits 
ADD COLUMN file_status TEXT DEFAULT 'available' CHECK (file_status IN ('available', 'missing'));