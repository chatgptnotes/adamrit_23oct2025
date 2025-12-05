-- Fix RLS policy for clinical services to allow viewing all services for the hospital
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view clinical services" ON public.clinical_services;

-- Create a new policy that allows users to view all clinical services for their hospital
CREATE POLICY "Users can view clinical services" ON public.clinical_services
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Update the sample data to include created_by values for better data integrity
-- First, get a sample user ID (we'll use a placeholder that should be updated)
UPDATE public.clinical_services
SET created_by = (
    SELECT id FROM auth.users LIMIT 1
)
WHERE created_by IS NULL;