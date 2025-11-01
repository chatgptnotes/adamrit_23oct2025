-- ============================================================================
-- Rename Billing Executive: "Neesha" to "Nisha"
-- This migration updates existing database records to correct the spelling
-- ============================================================================

-- ============================================================================
-- Update advance_payment table
-- ============================================================================
-- Update exact match "Neesha" (capitalized)
UPDATE advance_payment
SET billing_executive = 'Nisha'
WHERE billing_executive = 'Neesha';

-- Update lowercase "neesha" (used in some forms)
UPDATE advance_payment
SET billing_executive = 'Nisha'
WHERE billing_executive = 'neesha';

-- Update case-insensitive matches (catch any other variations)
UPDATE advance_payment
SET billing_executive = 'Nisha'
WHERE LOWER(billing_executive) = 'neesha'
  AND billing_executive != 'Nisha';

-- ============================================================================
-- Update visits table (if it has billing_executive column)
-- ============================================================================
-- Check if the column exists and update if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'visits'
      AND column_name = 'billing_executive'
  ) THEN
    -- Update exact match "Neesha"
    UPDATE visits
    SET billing_executive = 'Nisha'
    WHERE billing_executive = 'Neesha';

    -- Update lowercase "neesha"
    UPDATE visits
    SET billing_executive = 'Nisha'
    WHERE billing_executive = 'neesha';

    -- Update case-insensitive matches
    UPDATE visits
    SET billing_executive = 'Nisha'
    WHERE LOWER(billing_executive) = 'neesha'
      AND billing_executive != 'Nisha';

    RAISE NOTICE 'Updated billing_executive in visits table';
  ELSE
    RAISE NOTICE 'visits table does not have billing_executive column, skipping';
  END IF;
END $$;

-- ============================================================================
-- Update any other tables that might have billing_executive column
-- ============================================================================
-- Update bills table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'bills'
      AND column_name = 'billing_executive'
  ) THEN
    UPDATE bills
    SET billing_executive = 'Nisha'
    WHERE LOWER(billing_executive) = 'neesha';

    RAISE NOTICE 'Updated billing_executive in bills table';
  END IF;
END $$;

-- Update final_payment table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'final_payment'
      AND column_name = 'billing_executive'
  ) THEN
    UPDATE final_payment
    SET billing_executive = 'Nisha'
    WHERE LOWER(billing_executive) = 'neesha';

    RAISE NOTICE 'Updated billing_executive in final_payment table';
  END IF;
END $$;

-- ============================================================================
-- Summary report
-- ============================================================================
DO $$
DECLARE
  advance_payment_count INTEGER;
  visits_count INTEGER;
BEGIN
  -- Count updated records in advance_payment
  SELECT COUNT(*) INTO advance_payment_count
  FROM advance_payment
  WHERE billing_executive = 'Nisha';

  -- Count updated records in visits (if column exists)
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'visits'
      AND column_name = 'billing_executive'
  ) THEN
    SELECT COUNT(*) INTO visits_count
    FROM visits
    WHERE billing_executive = 'Nisha';
  ELSE
    visits_count := 0;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Billing Executive Rename Complete!';
  RAISE NOTICE '"Neesha" → "Nisha"';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'advance_payment records with "Nisha": %', advance_payment_count;
  RAISE NOTICE 'visits records with "Nisha": %', visits_count;
  RAISE NOTICE '========================================';
END $$;
