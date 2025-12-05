-- Update RLS policies for patient_documents table to allow all operations

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow users to view patient documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Allow users to insert patient documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Allow users to update patient documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Allow users to delete patient documents" ON public.patient_documents;

-- Create new policies that allow all operations
CREATE POLICY "Enable all operations for patient_documents" 
ON public.patient_documents 
FOR ALL 
USING (true) 
WITH CHECK (true);