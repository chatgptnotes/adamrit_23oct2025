-- =============================================
-- FIX: RLS policies for direct_sale_bills
-- =============================================
-- Symptom: Submit on the "Direct Sales Bill" page fails with
--          "new row violates row-level security policy for table direct_sale_bills".
-- Cause:   RLS is enabled on the table but no INSERT policy exists, so
--          authenticated users cannot save a bill.
-- Fix:     Add permissive policies for authenticated users (SELECT/INSERT/UPDATE/DELETE).
--
-- Run this ENTIRE script in the Supabase SQL Editor.
-- Safe to re-run (idempotent).
-- =============================================

-- 1. Drop any existing policies on the table (clean slate for re-runs)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'public' AND tablename = 'direct_sale_bills'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.direct_sale_bills', pol.policyname);
    END LOOP;
END $$;

-- 2. Keep RLS enabled, but allow logged-in users full access
ALTER TABLE public.direct_sale_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "direct_sale_bills_select_authenticated" ON public.direct_sale_bills
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "direct_sale_bills_insert_authenticated" ON public.direct_sale_bills
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "direct_sale_bills_update_authenticated" ON public.direct_sale_bills
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "direct_sale_bills_delete_authenticated" ON public.direct_sale_bills
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Table-level grants for the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_sale_bills TO authenticated;

-- 4. Verify
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'direct_sale_bills'
ORDER BY cmd;

SELECT 'RLS policies created - Direct Sales Bill submit should work now' AS status;
