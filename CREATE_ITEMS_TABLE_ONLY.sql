-- ================================================
-- CREATE PHYSIOTHERAPY BILL ITEMS TABLE ONLY
-- ================================================
--
-- Your visits table already has all columns.
-- This ONLY creates the items table.
--
-- COPY THIS AND RUN IN SUPABASE SQL EDITOR
-- ================================================

-- Create the table
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_physiotherapy_bill_items_visit_id
ON public.physiotherapy_bill_items(visit_id);

-- Enable RLS
ALTER TABLE public.physiotherapy_bill_items ENABLE ROW LEVEL SECURITY;

-- Add policy (one policy for all operations)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.physiotherapy_bill_items;

CREATE POLICY "Allow all operations for authenticated users"
ON public.physiotherapy_bill_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- VERIFICATION
-- ================================================

SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'physiotherapy_bill_items'
ORDER BY ordinal_position;

-- Should show 9 columns:
-- id, visit_id, item_name, cghs_code, cghs_rate,
-- quantity, amount, created_at, updated_at

-- ================================================
-- DONE!
-- ================================================
