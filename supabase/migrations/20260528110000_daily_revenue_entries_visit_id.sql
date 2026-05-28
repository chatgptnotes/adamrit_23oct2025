-- Link daily_revenue_entries rows to the source visit so the Director
-- Dashboard auto-populates from visits and overlays saved overrides.
ALTER TABLE public.daily_revenue_entries
  ADD COLUMN IF NOT EXISTS visit_id uuid REFERENCES public.visits(id) ON DELETE SET NULL;

-- A given visit can have at most one override row.
CREATE UNIQUE INDEX IF NOT EXISTS daily_revenue_entries_visit_id_uidx
  ON public.daily_revenue_entries (visit_id)
  WHERE visit_id IS NOT NULL;
