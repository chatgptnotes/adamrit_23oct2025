-- =============================================
-- FIX: direct_sale_bills RLS  (v2 — corrected)
-- =============================================
-- Symptom: Submit on the Direct Sales Bill page fails with
--          "new row violates row-level security policy for table direct_sale_bills".
--
-- Why v1 was wrong:
--   v1 added policies requiring auth.role() = 'authenticated'. But this app logs in
--   against a custom "User" table and does NOT create a Supabase Auth session for
--   username/password logins — every request reaches Postgres as the 'anon' role.
--   An 'authenticated'-only policy therefore rejects EVERY insert.
--
-- Fix: disable RLS on direct_sale_bills. This matches how the rest of this database
--   already works — medicine_batch_inventory has RLS off, and FIX_CREDIT_PAYMENTS_RLS.sql
--   uses the same disable-RLS approach. (The anon key is public in the frontend bundle,
--   so 'anon'-permitted RLS would give no real protection anyway; real protection here
--   is the app's custom auth layer.)
--
-- Run this ENTIRE script in the Supabase SQL Editor. Safe to re-run (idempotent).
-- =============================================

-- 1. Drop the incorrect policies added by v1 (and any others)
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

-- 2. Disable RLS so the app (anon role) can insert and read bills
ALTER TABLE public.direct_sale_bills DISABLE ROW LEVEL SECURITY;

-- 3. Ensure the roles the app uses have table privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_sale_bills TO anon, authenticated;

-- 4. Verify — rls_enabled should be FALSE, and no policies should remain
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname = 'direct_sale_bills';

SELECT COUNT(*) AS remaining_policies
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'direct_sale_bills';

SELECT 'RLS disabled on direct_sale_bills — Direct Sales Bill submit should work now' AS status;
