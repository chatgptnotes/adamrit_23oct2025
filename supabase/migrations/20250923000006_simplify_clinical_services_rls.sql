-- Simplify RLS policies for clinical services to allow full access for authenticated users
-- This is a more permissive approach to ensure functionality works

-- Disable RLS temporarily to clear all policies
ALTER TABLE public.clinical_services DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view clinical services" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can insert clinical services" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can update clinical services" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can delete clinical services" ON public.clinical_services;

-- Re-enable RLS
ALTER TABLE public.clinical_services ENABLE ROW LEVEL SECURITY;

-- Create very simple policies that allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON public.clinical_services
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');