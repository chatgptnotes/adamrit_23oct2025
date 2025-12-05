-- Quick Diagnostic Script for Physiotherapy Bill Setup
-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if columns exist in visits table
SELECT
    'visits table columns' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'visits'
  AND column_name LIKE 'physiotherapy%'
ORDER BY column_name;

-- 2. Check if physiotherapy_bill_items table exists
SELECT
    'physiotherapy_bill_items table' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'physiotherapy_bill_items'
ORDER BY ordinal_position;

-- 3. Check RLS policies on visits table
SELECT
    'visits RLS policies' as check_type,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'visits';

-- 4. Check RLS policies on physiotherapy_bill_items table
SELECT
    'physiotherapy_bill_items RLS policies' as check_type,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'physiotherapy_bill_items';

-- 5. Sample query to check if data exists
-- Replace 'YOUR_VISIT_ID' with actual visit_id
SELECT
    'Sample visit data' as check_type,
    visit_id,
    physiotherapy_bill_number,
    physiotherapy_bill_total,
    physiotherapy_bill_date_from,
    physiotherapy_bill_date_to,
    physiotherapy_bill_generated_at
FROM visits
WHERE visit_id LIKE '%' -- Shows all visits with physiotherapy bills
  AND physiotherapy_bill_number IS NOT NULL
LIMIT 5;

-- 6. Check physiotherapy bill items
SELECT
    'Sample bill items' as check_type,
    pbi.visit_id,
    pbi.item_name,
    pbi.cghs_code,
    pbi.cghs_rate,
    pbi.quantity,
    pbi.amount,
    v.physiotherapy_bill_number
FROM physiotherapy_bill_items pbi
LEFT JOIN visits v ON pbi.visit_id = v.visit_id
ORDER BY pbi.created_at DESC
LIMIT 10;
