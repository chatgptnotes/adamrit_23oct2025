-- Fix RLS insert policy for clinical services to allow authenticated users to create records

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert clinical services" ON public.clinical_services;

-- Create a new insert policy that allows authenticated users to insert records
CREATE POLICY "Users can insert clinical services" ON public.clinical_services
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Also update the update and delete policies to be less restrictive
DROP POLICY IF EXISTS "Users can update their own clinical services" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can delete their own clinical services" ON public.clinical_services;

CREATE POLICY "Users can update clinical services" ON public.clinical_services
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete clinical services" ON public.clinical_services
    FOR DELETE USING (
        auth.role() = 'authenticated'
    );