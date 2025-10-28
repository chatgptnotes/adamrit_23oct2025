-- Fix RLS policies for accounting tables to allow anonymous access
-- This is needed because the app doesn't use authentication yet
-- Fixes the "Cash account not found" error in Cash Book page

-- Drop existing RLS if any and recreate with proper policies
ALTER TABLE public.chart_of_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_ledgers DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with proper policies
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_ledgers ENABLE ROW LEVEL SECURITY;

-- Create policies for chart_of_accounts table
CREATE POLICY "Allow all operations on chart_of_accounts for anonymous users"
ON public.chart_of_accounts
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on chart_of_accounts for authenticated users"
ON public.chart_of_accounts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for voucher_types table
CREATE POLICY "Allow all operations on voucher_types for anonymous users"
ON public.voucher_types
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on voucher_types for authenticated users"
ON public.voucher_types
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for vouchers table
CREATE POLICY "Allow all operations on vouchers for anonymous users"
ON public.vouchers
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on vouchers for authenticated users"
ON public.vouchers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for voucher_entries table
CREATE POLICY "Allow all operations on voucher_entries for anonymous users"
ON public.voucher_entries
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on voucher_entries for authenticated users"
ON public.voucher_entries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policies for patient_ledgers table
CREATE POLICY "Allow all operations on patient_ledgers for anonymous users"
ON public.patient_ledgers
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on patient_ledgers for authenticated users"
ON public.patient_ledgers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
