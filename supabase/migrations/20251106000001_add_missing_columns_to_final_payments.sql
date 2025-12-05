-- ============================================================================
-- Add Missing Columns to final_payments Table
-- Date: 2025-11-06
-- Purpose: Add payment_date and patient_id columns to enable ledger integration
--
-- ISSUE: Ledger Statement cannot show final payments because:
--   1. final_payments table lacks payment_date column (only has created_at)
--   2. final_payments table lacks patient_id column (only has visit_id)
--   3. Ledger function tries to JOIN on these non-existent columns
--
-- FIX: Add these columns and backfill with data from related tables
-- ============================================================================

-- ============================================================================
-- STEP 1: Add payment_date column
-- ============================================================================

DO $$
BEGIN
  -- Add payment_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'final_payments'
      AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE public.final_payments
      ADD COLUMN payment_date DATE DEFAULT CURRENT_DATE;

    RAISE NOTICE '✅ Added payment_date column';
  ELSE
    RAISE NOTICE '✓ payment_date column already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Add patient_id column
-- ============================================================================

DO $$
BEGIN
  -- Add patient_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'final_payments'
      AND column_name = 'patient_id'
  ) THEN
    ALTER TABLE public.final_payments
      ADD COLUMN patient_id UUID REFERENCES patients(id);

    RAISE NOTICE '✅ Added patient_id column';
  ELSE
    RAISE NOTICE '✓ patient_id column already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Backfill payment_date column with created_at date
-- ============================================================================

DO $$
BEGIN
  UPDATE public.final_payments
  SET payment_date = DATE(created_at)
  WHERE payment_date IS NULL;

  RAISE NOTICE '✅ Backfilled payment_date from created_at';
END $$;

-- ============================================================================
-- STEP 4: Backfill patient_id column from visits table
-- ============================================================================

DO $$
BEGIN
  UPDATE public.final_payments fp
  SET patient_id = v.patient_id
  FROM visits v
  WHERE fp.visit_id = v.visit_id
    AND fp.patient_id IS NULL;

  RAISE NOTICE '✅ Backfilled patient_id from visits table';
END $$;

-- ============================================================================
-- STEP 5: Create indexes for better query performance
-- ============================================================================

DO $$
BEGIN
  -- Index on payment_date
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'final_payments'
      AND indexname = 'idx_final_payments_payment_date'
  ) THEN
    CREATE INDEX idx_final_payments_payment_date
      ON public.final_payments(payment_date);

    RAISE NOTICE '✅ Created index on payment_date';
  ELSE
    RAISE NOTICE '✓ Index on payment_date already exists';
  END IF;

  -- Index on patient_id
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'final_payments'
      AND indexname = 'idx_final_payments_patient_id'
  ) THEN
    CREATE INDEX idx_final_payments_patient_id
      ON public.final_payments(patient_id);

    RAISE NOTICE '✅ Created index on patient_id';
  ELSE
    RAISE NOTICE '✓ Index on patient_id already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Add comments on new columns
-- ============================================================================

COMMENT ON COLUMN final_payments.payment_date IS
'Date when the final payment was made (extracted from created_at for existing records)';

COMMENT ON COLUMN final_payments.patient_id IS
'Foreign key to patients table - enables direct patient lookup without joining through visits';

-- ============================================================================
-- FINAL: Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅✅✅ FINAL PAYMENTS COLUMNS ADDED SUCCESSFULLY ✅✅✅';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  1. ✓ payment_date column added';
  RAISE NOTICE '  2. ✓ patient_id column added';
  RAISE NOTICE '  3. ✓ Existing records backfilled';
  RAISE NOTICE '  4. ✓ Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step:';
  RAISE NOTICE '  → Fix ledger function to use correct table name and columns';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
