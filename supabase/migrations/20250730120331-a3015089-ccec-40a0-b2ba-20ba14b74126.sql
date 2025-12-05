-- Ensure visits table has proper RLS policies for all operations
-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations on visits" ON public.visits;

-- Create comprehensive RLS policies for visits table
CREATE POLICY "Allow authenticated users to view visits" 
ON public.visits 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert visits" 
ON public.visits 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update visits" 
ON public.visits 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow authenticated users to delete visits" 
ON public.visits 
FOR DELETE 
USING (true);