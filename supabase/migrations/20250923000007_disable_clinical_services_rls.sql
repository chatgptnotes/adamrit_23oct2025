-- Temporarily disable RLS for clinical services to debug the issue
-- This will help us determine if the problem is RLS-related or something else

-- Disable RLS completely for debugging
ALTER TABLE public.clinical_services DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.clinical_services;