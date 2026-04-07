-- Fix RLS policies for prescriptions and prescription_items tables
-- These tables need INSERT/SELECT/UPDATE policies for authenticated users

-- Prescriptions table
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access to prescriptions" ON public.prescriptions;
CREATE POLICY "Allow authenticated users full access to prescriptions"
  ON public.prescriptions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow anon access (for service role / API calls)
DROP POLICY IF EXISTS "Allow anon users full access to prescriptions" ON public.prescriptions;
CREATE POLICY "Allow anon users full access to prescriptions"
  ON public.prescriptions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Prescription items table
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users full access to prescription_items" ON public.prescription_items;
CREATE POLICY "Allow authenticated users full access to prescription_items"
  ON public.prescription_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon users full access to prescription_items" ON public.prescription_items;
CREATE POLICY "Allow anon users full access to prescription_items"
  ON public.prescription_items
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
