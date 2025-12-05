-- ============================================
-- CREATE PHYSIOTHERAPY BILL ITEMS TABLE
-- ============================================
--
-- COPY ALL THIS AND RUN IN SUPABASE SQL EDITOR
--
-- This table stores the line items for physiotherapy bills
-- (the individual treatments/services like jhjh, hgfghc, etc.)
--
-- ============================================

-- Step 1: Create the table
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

-- Step 2: Add foreign key constraint (if visits table uses visit_id)
-- Uncomment this if you want to enforce referential integrity:
-- ALTER TABLE public.physiotherapy_bill_items
-- ADD CONSTRAINT fk_physiotherapy_bill_items_visit
-- FOREIGN KEY (visit_id) REFERENCES public.visits(visit_id) ON DELETE CASCADE;

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_physiotherapy_bill_items_visit_id
ON public.physiotherapy_bill_items(visit_id);

-- Step 4: Enable Row Level Security
ALTER TABLE public.physiotherapy_bill_items ENABLE ROW LEVEL SECURITY;

-- Step 5: Add RLS policies to allow authenticated users to access data

-- Allow SELECT (read)
CREATE POLICY "Allow authenticated users to select physiotherapy bill items"
ON public.physiotherapy_bill_items FOR SELECT
TO authenticated
USING (true);

-- Allow INSERT (create)
CREATE POLICY "Allow authenticated users to insert physiotherapy bill items"
ON public.physiotherapy_bill_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow UPDATE (edit)
CREATE POLICY "Allow authenticated users to update physiotherapy bill items"
ON public.physiotherapy_bill_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow DELETE (remove)
CREATE POLICY "Allow authenticated users to delete physiotherapy bill items"
ON public.physiotherapy_bill_items FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this to verify the table was created:

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'physiotherapy_bill_items'
ORDER BY ordinal_position;

-- Should show these columns:
-- id, visit_id, item_name, cghs_code, cghs_rate, quantity, amount, created_at, updated_at

-- ============================================
-- DONE!
-- ============================================
-- After running this, go back to your app and click "Save Bill" again.
-- It should work now!
