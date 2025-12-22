-- =====================================================
-- FIX MEDICATION TABLE UPDATE PERMISSIONS
-- Allow authenticated users to update medication stock
-- =====================================================

-- Add UPDATE policy for medication table
CREATE POLICY "Allow authenticated users to update medications" ON public.medication
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant UPDATE permission to authenticated role
GRANT UPDATE ON public.medication TO authenticated;

-- Also ensure SELECT permission exists
GRANT SELECT ON public.medication TO authenticated;

-- Verify policies exist
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'medication'
AND cmd = 'UPDATE';

-- Test query to verify permissions
SELECT 'UPDATE permissions granted successfully for medication table' as status;