-- Fix medication table UPDATE permissions for return sales
-- This allows authenticated users to update medication stock when processing returns

-- Add UPDATE policy for medication table
CREATE POLICY "Allow authenticated users to update medications" ON public.medication
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant UPDATE permission to authenticated role
GRANT UPDATE ON public.medication TO authenticated;

-- Also ensure SELECT permission exists (may already exist)
GRANT SELECT ON public.medication TO authenticated;