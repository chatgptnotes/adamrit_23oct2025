-- =====================================================
-- STEP 1: Drop ALL existing pharmacy objects
-- Run this FIRST, then run the main migration
-- =====================================================

-- Find all create_pharmacy_sale functions
SELECT
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    'DROP FUNCTION IF EXISTS ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') CASCADE;' as drop_statement
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_pharmacy_sale';

-- Drop ALL versions of create_pharmacy_sale function
-- This will show you all versions first
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'create_pharmacy_sale'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.func_signature;
    END LOOP;
END $$;

-- Drop views
DROP VIEW IF EXISTS public.v_pharmacy_sales_complete CASCADE;
DROP VIEW IF EXISTS public.v_pharmacy_today_sales CASCADE;
DROP VIEW IF EXISTS public.v_pharmacy_low_stock_alert CASCADE;

-- Drop tables (this will also drop dependent objects)
DROP TABLE IF EXISTS public.pharmacy_sale_items CASCADE;
DROP TABLE IF EXISTS public.pharmacy_sales CASCADE;

-- Verify everything is dropped
SELECT 'Functions:' as object_type, COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_pharmacy_sale'

UNION ALL

SELECT 'Views:', COUNT(*)
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'v_pharmacy%'

UNION ALL

SELECT 'Tables:', COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('pharmacy_sales', 'pharmacy_sale_items');

-- Expected output: all counts should be 0
-- Functions: 0
-- Views: 0
-- Tables: 0

-- ✅ All pharmacy objects dropped!
-- Now run: 2_CREATE_PHARMACY_TABLES.sql
