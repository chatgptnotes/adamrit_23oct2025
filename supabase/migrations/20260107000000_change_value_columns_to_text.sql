-- Migration: Change min_value and max_value columns from DECIMAL to TEXT
-- Purpose: Allow storing numbers, words, and symbols in range fields
-- Date: 2026-01-07

-- Change min_value from DECIMAL to TEXT
ALTER TABLE public.lab_test_config
ALTER COLUMN min_value TYPE TEXT USING min_value::TEXT;

-- Change max_value from DECIMAL to TEXT
ALTER TABLE public.lab_test_config
ALTER COLUMN max_value TYPE TEXT USING max_value::TEXT;

-- Allow NULL values for flexibility
ALTER TABLE public.lab_test_config
ALTER COLUMN min_value DROP NOT NULL;

ALTER TABLE public.lab_test_config
ALTER COLUMN max_value DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.lab_test_config.min_value IS
'Minimum value for normal range. Can be number (10, 1.5), word (Positive), or symbol (<5)';

COMMENT ON COLUMN public.lab_test_config.max_value IS
'Maximum value for normal range. Can be number (10, 1.5), word (Negative), or symbol (>10)';
