-- =====================================================
-- Check current RLS status and completely disable it
-- =====================================================

-- STEP 1: Check current RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('pharmacy_sales', 'pharmacy_sale_items')
AND schemaname = 'public';

-- STEP 2: Check existing policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('pharmacy_sales', 'pharmacy_sale_items')
ORDER BY tablename, policyname;

-- STEP 3: Drop ALL policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE tablename IN ('pharmacy_sales', 'pharmacy_sale_items')
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy: % on %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- STEP 4: Disable RLS completely
ALTER TABLE public.pharmacy_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sale_items DISABLE ROW LEVEL SECURITY;

-- STEP 5: Grant all permissions to authenticated users
GRANT ALL ON public.pharmacy_sales TO authenticated;
GRANT ALL ON public.pharmacy_sale_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE pharmacy_sales_sale_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE pharmacy_sale_items_sale_item_id_seq TO authenticated;

-- STEP 6: Verify RLS is OFF and no policies exist
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('pharmacy_sales', 'pharmacy_sale_items')
AND schemaname = 'public';

-- Expected: rls_enabled should be FALSE for both tables

SELECT
    COUNT(*) as policy_count,
    'Should be 0' as expected
FROM pg_policies
WHERE tablename IN ('pharmacy_sales', 'pharmacy_sale_items');

-- Expected: 0 policies

-- ✅ RLS completely disabled with no policies!
-- Now test your pharmacy billing form
