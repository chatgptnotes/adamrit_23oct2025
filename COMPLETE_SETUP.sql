-- ============================================
-- COMPLETE PHYSIOTHERAPY BILL SETUP
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- ============================================

-- ====================
-- PART 1: Add columns to visits table
-- ====================

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_number TEXT;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_total NUMERIC(10, 2) DEFAULT 0;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_date_from DATE;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_date_to DATE;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_generated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_visits_physiotherapy_bill_number
ON public.visits(physiotherapy_bill_number)
WHERE physiotherapy_bill_number IS NOT NULL;

-- ====================
-- PART 2: Create physiotherapy_bill_items table
-- ====================

CREATE TABLE IF NOT EXISTS public.physiotherapy_bill_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id TEXT NOT NULL,
    item_name TEXT,
    cghs_code TEXT,
    cghs_rate NUMERIC(10, 2) DEFAULT 0,
    quantity INTEGER DEFAULT 1,
    amount NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_physiotherapy_bill_items_visit_id
ON public.physiotherapy_bill_items(visit_id);

-- ====================
-- PART 3: Enable RLS and add policies
-- ====================

ALTER TABLE public.physiotherapy_bill_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to select physiotherapy bill items" ON public.physiotherapy_bill_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert physiotherapy bill items" ON public.physiotherapy_bill_items;
DROP POLICY IF EXISTS "Allow authenticated users to update physiotherapy bill items" ON public.physiotherapy_bill_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete physiotherapy bill items" ON public.physiotherapy_bill_items;

-- Create policies
CREATE POLICY "Allow authenticated users to select physiotherapy bill items"
ON public.physiotherapy_bill_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert physiotherapy bill items"
ON public.physiotherapy_bill_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update physiotherapy bill items"
ON public.physiotherapy_bill_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete physiotherapy bill items"
ON public.physiotherapy_bill_items FOR DELETE
TO authenticated
USING (true);

-- ====================
-- VERIFICATION QUERIES
-- ====================

-- Check visits table columns
SELECT 'visits table physiotherapy columns' as check_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'visits'
  AND column_name LIKE 'physiotherapy%'
ORDER BY column_name;

-- Check physiotherapy_bill_items table structure
SELECT 'physiotherapy_bill_items structure' as check_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'physiotherapy_bill_items'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS policies' as check_name, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'physiotherapy_bill_items';

-- ============================================
-- DONE!
-- ============================================
-- All tables and policies are now set up.
-- Go back to your app and click "Save Bill"
-- It should work now!
-- ============================================
