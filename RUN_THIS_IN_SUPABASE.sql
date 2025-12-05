-- ============================================
-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE
-- ============================================
--
-- Instructions:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy ALL text from this file
-- 6. Paste into the SQL Editor
-- 7. Click "Run" button (or press Ctrl+Enter)
-- 8. Wait for "Success" message
--
-- ============================================

-- Step 1: Add physiotherapy bill number column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_number TEXT;

-- Step 2: Add total bill amount column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_total NUMERIC(10, 2) DEFAULT 0;

-- Step 3: Add date from column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_date_from DATE;

-- Step 4: Add date to column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_date_to DATE;

-- Step 5: Add generated timestamp column
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS physiotherapy_bill_generated_at TIMESTAMP WITH TIME ZONE;

-- Step 6: Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_visits_physiotherapy_bill_number
ON public.visits(physiotherapy_bill_number)
WHERE physiotherapy_bill_number IS NOT NULL;

-- ============================================
-- VERIFICATION QUERY
-- Run this AFTER the above to verify it worked:
-- ============================================
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'visits'
  AND column_name LIKE 'physiotherapy%'
ORDER BY column_name;

-- ============================================
-- EXPECTED RESULT:
-- Should show 5 rows:
-- 1. physiotherapy_bill_date_from | date | YES
-- 2. physiotherapy_bill_date_to | date | YES
-- 3. physiotherapy_bill_generated_at | timestamp with time zone | YES
-- 4. physiotherapy_bill_number | text | YES
-- 5. physiotherapy_bill_total | numeric | YES
-- ============================================
