-- =====================================================
-- FIX: Row Level Security (RLS) Policies
-- Fixes the "new row violates row-level security policy" error
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.pharmacy_sales;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.pharmacy_sales;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.pharmacy_sales;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.pharmacy_sale_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.pharmacy_sale_items;

-- =====================================================
-- Create corrected policies for pharmacy_sales
-- =====================================================

-- Allow all authenticated users to SELECT
CREATE POLICY "Allow authenticated users to select pharmacy_sales"
ON public.pharmacy_sales
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to INSERT
CREATE POLICY "Allow authenticated users to insert pharmacy_sales"
ON public.pharmacy_sales
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to UPDATE
CREATE POLICY "Allow authenticated users to update pharmacy_sales"
ON public.pharmacy_sales
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow all authenticated users to DELETE
CREATE POLICY "Allow authenticated users to delete pharmacy_sales"
ON public.pharmacy_sales
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- Create corrected policies for pharmacy_sale_items
-- =====================================================

-- Allow all authenticated users to SELECT
CREATE POLICY "Allow authenticated users to select pharmacy_sale_items"
ON public.pharmacy_sale_items
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to INSERT
CREATE POLICY "Allow authenticated users to insert pharmacy_sale_items"
ON public.pharmacy_sale_items
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow all authenticated users to UPDATE
CREATE POLICY "Allow authenticated users to update pharmacy_sale_items"
ON public.pharmacy_sale_items
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow all authenticated users to DELETE
CREATE POLICY "Allow authenticated users to delete pharmacy_sale_items"
ON public.pharmacy_sale_items
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- Verify policies are created
-- =====================================================

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

-- Expected output: Should show 4 policies for each table

-- ✅ RLS policies fixed!
-- Now test your pharmacy billing form again
