-- =====================================================
-- QUICK FIX: Temporarily disable RLS for testing
-- Use this to test if everything works, then enable proper policies later
-- =====================================================

-- Option 1: Completely disable RLS (for testing only)
ALTER TABLE public.pharmacy_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_sale_items DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('pharmacy_sales', 'pharmacy_sale_items');

-- Expected output:
-- pharmacy_sales | false
-- pharmacy_sale_items | false

-- ✅ RLS disabled! Now test your pharmacy billing form
-- ⚠️ WARNING: This is for testing only. In production, you should use proper RLS policies
