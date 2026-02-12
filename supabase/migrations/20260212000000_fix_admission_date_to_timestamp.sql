-- Convert admission_date from DATE to TIMESTAMP WITH TIME ZONE
-- This allows storing exact admission date and time when patient is admitted

ALTER TABLE public.visits
ALTER COLUMN admission_date TYPE TIMESTAMP WITH TIME ZONE
USING CASE
    WHEN admission_date IS NULL THEN NULL
    ELSE admission_date::timestamp with time zone
END;

-- Backfill existing records with time from created_at
-- This gives existing records an approximate admission time based on when the visit was created
UPDATE public.visits
SET admission_date = (admission_date::date + created_at::time)::timestamp with time zone
WHERE admission_date IS NOT NULL
  AND created_at IS NOT NULL;

COMMENT ON COLUMN public.visits.admission_date IS 'Exact timestamp when patient was admitted to hospital (includes date and time).';

DO $$
BEGIN
    RAISE NOTICE 'Successfully converted admission_date column to TIMESTAMP WITH TIME ZONE and backfilled times from created_at';
END $$;
