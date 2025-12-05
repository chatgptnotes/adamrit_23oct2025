-- =====================================================
-- PROPER FIX: Enable RLS with correct policies
-- Run this after testing with disabled RLS
-- =====================================================

-- =====================================================
-- STEP 1: Enable RLS on both tables
-- =====================================================

ALTER TABLE public.pharmacy_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sale_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop all existing policies (clean slate)
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies for pharmacy_sales
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'pharmacy_sales' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.pharmacy_sales', r.policyname);
    END LOOP;

    -- Drop all policies for pharmacy_sale_items
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'pharmacy_sale_items' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.pharmacy_sale_items', r.policyname);
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: Create new policies for pharmacy_sales
-- =====================================================

-- Allow SELECT for authenticated users
CREATE POLICY "pharmacy_sales_select_policy"
ON public.pharmacy_sales
FOR SELECT
TO authenticated
USING (true);

-- Allow INSERT for authenticated users
CREATE POLICY "pharmacy_sales_insert_policy"
ON public.pharmacy_sales
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow UPDATE for authenticated users
CREATE POLICY "pharmacy_sales_update_policy"
ON public.pharmacy_sales
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow DELETE for authenticated users
CREATE POLICY "pharmacy_sales_delete_policy"
ON public.pharmacy_sales
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- STEP 4: Create new policies for pharmacy_sale_items
-- =====================================================

-- Allow SELECT for authenticated users
CREATE POLICY "pharmacy_sale_items_select_policy"
ON public.pharmacy_sale_items
FOR SELECT
TO authenticated
USING (true);

-- Allow INSERT for authenticated users
CREATE POLICY "pharmacy_sale_items_insert_policy"
ON public.pharmacy_sale_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow UPDATE for authenticated users
CREATE POLICY "pharmacy_sale_items_update_policy"
ON public.pharmacy_sale_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow DELETE for authenticated users
CREATE POLICY "pharmacy_sale_items_delete_policy"
ON public.pharmacy_sale_items
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- STEP 5: Verify policies
-- =====================================================

-- Check RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('pharmacy_sales', 'pharmacy_sale_items');

-- Expected: both should be 'true'

-- Check policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('pharmacy_sales', 'pharmacy_sale_items')
ORDER BY tablename, cmd;

-- Expected: 4 policies for each table (SELECT, INSERT, UPDATE, DELETE)

-- ✅ RLS enabled with proper policies!
-- Now test your pharmacy billing form
