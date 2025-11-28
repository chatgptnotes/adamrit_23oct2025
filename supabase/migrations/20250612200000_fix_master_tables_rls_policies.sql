-- Fix RLS policies for master data tables to allow anonymous access
-- This is needed because the app doesn't use authentication yet

-- Drop existing RLS if any and recreate with proper policies
ALTER TABLE public.radiology DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complications DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with proper policies
ALTER TABLE public.radiology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complications ENABLE ROW LEVEL SECURITY;

-- Create policies for radiology table
CREATE POLICY "Allow all operations on radiology for anonymous users" 
ON public.radiology 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on radiology for authenticated users" 
ON public.radiology 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policies for lab table
CREATE POLICY "Allow all operations on lab for anonymous users" 
ON public.lab 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on lab for authenticated users" 
ON public.lab 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policies for medication table
CREATE POLICY "Allow all operations on medication for anonymous users" 
ON public.medication 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on medication for authenticated users" 
ON public.medication 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policies for complications table  
CREATE POLICY "Allow all operations on complications for anonymous users" 
ON public.complications 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on complications for authenticated users" 
ON public.complications 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);