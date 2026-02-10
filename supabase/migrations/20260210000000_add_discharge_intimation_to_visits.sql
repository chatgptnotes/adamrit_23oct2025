ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS discharge_intimation_at TIMESTAMPTZ;

COMMENT ON COLUMN public.visits.discharge_intimation_at IS 'Timestamp when discharge intimation was marked. NULL = not done, non-NULL = done (with date/time).';
