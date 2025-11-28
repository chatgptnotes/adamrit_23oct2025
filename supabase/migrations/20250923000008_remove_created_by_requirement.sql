-- Remove created_by requirement from clinical services RLS policies
-- This matches how mandatory services actually work

-- Disable RLS temporarily to clear all policies
ALTER TABLE public.clinical_services DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can view clinical services" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can insert clinical services" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can update clinical services" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can delete clinical services" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can update their own clinical services" ON public.clinical_services;
DROP POLICY IF EXISTS "Users can delete their own clinical services" ON public.clinical_services;

-- Re-enable RLS
ALTER TABLE public.clinical_services ENABLE ROW LEVEL SECURITY;

-- Create simple policies without created_by requirement (like mandatory services)
CREATE POLICY "Users can view clinical services" ON public.clinical_services
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert clinical services" ON public.clinical_services
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update clinical services" ON public.clinical_services
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete clinical services" ON public.clinical_services
    FOR DELETE USING (auth.role() = 'authenticated');