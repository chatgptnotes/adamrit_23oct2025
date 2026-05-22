-- Allow the app to read/insert/update/delete medicines on visit_medications.
--
-- The app connects to PostgREST without a Supabase Auth session (it uses its
-- own custom login), so requests run under broad roles. The pre-existing
-- policies were scoped TO authenticated only, so anonymous inserts were
-- rejected with 42501 (RLS violation) — doctors could not add any medicine.
--
-- This mirrors the working ipd_discharge_summary table, which has a single
-- "FOR ALL TO public" permissive policy. This only changes WHO may write — it
-- does not touch any existing rows.

CREATE POLICY "Allow all operations on visit medications"
  ON public.visit_medications
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.visit_medications TO anon, authenticated;

-- PostgREST caches grants/schema; refresh so the new permissions take effect.
NOTIFY pgrst, 'reload schema';
