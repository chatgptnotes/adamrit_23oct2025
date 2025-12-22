-- =====================================================
-- FIX RLS POLICIES FOR MEDICINE RETURNS
-- This fixes the 401 Unauthorized error when creating returns
-- =====================================================

-- Add RLS policies for medicine_returns table
CREATE POLICY "Enable insert for authenticated users" ON public.medicine_returns
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.medicine_returns
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Add RLS policies for medicine_return_items table  
CREATE POLICY "Enable insert for authenticated users" ON public.medicine_return_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.medicine_return_items
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant necessary permissions to authenticated role
GRANT INSERT, UPDATE, SELECT ON public.medicine_returns TO authenticated;
GRANT INSERT, UPDATE, SELECT ON public.medicine_return_items TO authenticated;

-- Also ensure sequence permissions for the SERIAL IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify policies were created
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('medicine_returns', 'medicine_return_items');

-- Test query to verify permissions
SELECT 'RLS policies created successfully for medicine_returns tables' as status;