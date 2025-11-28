-- Convert discharge_date from DATE to TIMESTAMP WITH TIME ZONE
-- This allows storing exact discharge date and time when patient is discharged

-- First, check if the column exists and alter the column type
-- If it's already DATE, this will convert it to TIMESTAMP WITH TIME ZONE
-- If it's already TIMESTAMP WITH TIME ZONE, this will have no effect
ALTER TABLE public.visits
ALTER COLUMN discharge_date TYPE TIMESTAMP WITH TIME ZONE
USING CASE
    WHEN discharge_date IS NULL THEN NULL
    ELSE discharge_date::timestamp with time zone
END;

-- Update existing DATE-only values to include midnight time component
-- This ensures existing data is preserved with a default time of 00:00:00
UPDATE public.visits
SET discharge_date = discharge_date::date::timestamp with time zone
WHERE discharge_date IS NOT NULL
  AND EXTRACT(HOUR FROM discharge_date) = 0
  AND EXTRACT(MINUTE FROM discharge_date) = 0
  AND EXTRACT(SECOND FROM discharge_date) = 0;

-- Update comment to reflect the new behavior
COMMENT ON COLUMN public.visits.discharge_date IS 'Exact timestamp when patient was discharged from hospital (includes date and time). Set when final payment is completed and Invoice button is clicked.';

-- Log the change
DO $$
BEGIN
    RAISE NOTICE 'Successfully converted discharge_date column to TIMESTAMP WITH TIME ZONE';
END $$;
