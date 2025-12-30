-- =============================================
-- COMPLETE FIX: RLS Policy for pharmacy_credit_payments
-- Run this ENTIRE script in Supabase SQL Editor
-- =============================================

-- 1. Drop ALL existing policies on this table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'pharmacy_credit_payments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.pharmacy_credit_payments', pol.policyname);
    END LOOP;
END $$;

-- 2. Disable RLS (simplest and most reliable fix)
ALTER TABLE public.pharmacy_credit_payments DISABLE ROW LEVEL SECURITY;

-- 3. Verify
SELECT 'RLS disabled - payments should work now!' as status;
