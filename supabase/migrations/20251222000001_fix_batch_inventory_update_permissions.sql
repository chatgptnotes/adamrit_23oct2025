-- Fix medicine_batch_inventory table UPDATE permissions for return sales
-- This allows authenticated users to update batch inventory stock when processing returns

-- Add UPDATE policy for medicine_batch_inventory table
CREATE POLICY "Allow authenticated users to update batch inventory" ON public.medicine_batch_inventory
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant UPDATE permission to authenticated role
GRANT UPDATE ON public.medicine_batch_inventory TO authenticated;

-- Also ensure SELECT permission exists (may already exist)
GRANT SELECT ON public.medicine_batch_inventory TO authenticated;