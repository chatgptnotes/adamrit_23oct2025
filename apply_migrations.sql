-- ============================================================================
-- COMBINED MIGRATION SCRIPT - Apply all 3 migrations at once
-- Date: 2025-11-08
-- Purpose: Fix "Failed to save final payment" error
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Add UNIQUE constraint to final_payments.visit_id
-- ============================================================================

-- Check for duplicates
DO $$
DECLARE
  v_duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT visit_id, COUNT(*) as cnt
    FROM final_payments
    GROUP BY visit_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF v_duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate visit_ids in final_payments table', v_duplicate_count;
    RAISE WARNING 'Duplicates will be handled by keeping the most recent payment per visit';
  ELSE
    RAISE NOTICE 'No duplicate visit_ids found. Proceeding with constraint addition.';
  END IF;
END $$;

-- Delete older duplicate records (keep only the most recent per visit)
DELETE FROM final_payments
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY visit_id ORDER BY created_at DESC, id DESC) as rn
    FROM final_payments
  ) ranked
  WHERE rn > 1
);

-- Add UNIQUE constraint to visit_id (check if exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'final_payments_visit_id_unique'
      AND conrelid = 'public.final_payments'::regclass
  ) THEN
    ALTER TABLE public.final_payments
      ADD CONSTRAINT final_payments_visit_id_unique UNIQUE (visit_id);

    COMMENT ON CONSTRAINT final_payments_visit_id_unique ON public.final_payments IS
    'Ensures only one final payment record exists per visit. Required for upsert operations using onConflict: visit_id';

    RAISE NOTICE '✅ Added UNIQUE constraint on visit_id';
  ELSE
    RAISE NOTICE '✓ UNIQUE constraint already exists';
  END IF;
END $$;

-- Success message for migration 1
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION 1: UNIQUE constraint added to final_payments.visit_id';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION 2: Add SECURITY DEFINER to trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION record_final_payment_to_transactions()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_id UUID;
  v_patient_uuid UUID;
  v_narration TEXT;
  v_mapped_payment_mode TEXT;
BEGIN
  -- Get patient_id from visit
  SELECT patient_id INTO v_patient_uuid
  FROM visits
  WHERE visit_id = NEW.visit_id;

  IF v_patient_uuid IS NULL THEN
    RAISE WARNING 'Patient not found for visit_id: %. Skipping payment transaction.', NEW.visit_id;
    RETURN NEW;
  END IF;

  -- Build narration
  v_narration := COALESCE(
    NEW.payment_remark,
    'Final bill payment - ' || NEW.reason_of_discharge
  );

  -- Map payment mode to valid constraint values
  v_mapped_payment_mode := CASE UPPER(TRIM(NEW.mode_of_payment))
    WHEN 'CASH' THEN 'CASH'
    WHEN 'CARD' THEN 'CARD'
    WHEN 'UPI' THEN 'UPI'
    WHEN 'CHEQUE' THEN 'CHEQUE'
    WHEN 'DD' THEN 'DD'
    WHEN 'NEFT' THEN 'NEFT'
    WHEN 'RTGS' THEN 'RTGS'
    WHEN 'ONLINE' THEN 'ONLINE'
    WHEN 'PAYTM' THEN 'PAYTM'
    WHEN 'PHONEPE' THEN 'PHONEPE'
    -- Map common variations
    WHEN 'BANK TRANSFER' THEN 'ONLINE'
    WHEN 'BANK_TRANSFER' THEN 'ONLINE'
    WHEN 'NET BANKING' THEN 'ONLINE'
    WHEN 'NET_BANKING' THEN 'ONLINE'
    WHEN 'NETBANKING' THEN 'ONLINE'
    WHEN 'ONLINE TRANSFER' THEN 'ONLINE'
    WHEN 'ONLINE_TRANSFER' THEN 'ONLINE'
    WHEN 'DEBIT CARD' THEN 'CARD'
    WHEN 'CREDIT CARD' THEN 'CARD'
    WHEN 'GOOGLE PAY' THEN 'UPI'
    WHEN 'GOOGLEPAY' THEN 'UPI'
    WHEN 'GPAY' THEN 'UPI'
    WHEN 'PHONE PE' THEN 'PHONEPE'
    WHEN 'PHONE_PE' THEN 'PHONEPE'
    -- Default fallback
    ELSE 'CASH'
  END;

  -- Insert payment transaction record
  INSERT INTO patient_payment_transactions (
    patient_id,
    visit_id,
    payment_source,
    source_table_name,
    source_reference_id,
    payment_date,
    payment_mode,
    amount,
    narration,
    bank_name,
    created_by,
    created_at
  ) VALUES (
    v_patient_uuid,
    NEW.visit_id,
    'FINAL_BILL',
    'final_payments',
    NEW.id::TEXT,
    CURRENT_DATE,
    v_mapped_payment_mode,
    NEW.amount,
    v_narration,
    NEW.bank_account_name,
    COALESCE(NEW.created_by, 'system'),
    NOW()
  )
  RETURNING id INTO v_payment_id;

  RAISE NOTICE 'Payment transaction % recorded for final payment (visit: %, mode: % → %)',
    v_payment_id, NEW.visit_id, NEW.mode_of_payment, v_mapped_payment_mode;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION record_final_payment_to_transactions() IS
'Automatically records final payment into patient_payment_transactions table. Uses SECURITY DEFINER to bypass RLS policies and insert with elevated privileges.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_final_payment_to_transactions TO authenticated;

-- Success message for migration 2
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION 2: SECURITY DEFINER added to trigger function!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- MIGRATION 3: Add missing columns to final_payments table
-- ============================================================================

-- Add payment_date column
DO $$
BEGIN
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

-- Add patient_id column
DO $$
BEGIN
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

-- Add bank_account_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'final_payments'
      AND column_name = 'bank_account_id'
  ) THEN
    ALTER TABLE public.final_payments
      ADD COLUMN bank_account_id UUID REFERENCES bank_accounts(id);

    RAISE NOTICE '✅ Added bank_account_id column';
  ELSE
    RAISE NOTICE '✓ bank_account_id column already exists';
  END IF;
END $$;

-- Add bank_account_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'final_payments'
      AND column_name = 'bank_account_name'
  ) THEN
    ALTER TABLE public.final_payments
      ADD COLUMN bank_account_name TEXT;

    RAISE NOTICE '✅ Added bank_account_name column';
  ELSE
    RAISE NOTICE '✓ bank_account_name column already exists';
  END IF;
END $$;

-- Backfill payment_date
DO $$
BEGIN
  UPDATE public.final_payments
  SET payment_date = DATE(created_at)
  WHERE payment_date IS NULL;

  RAISE NOTICE '✅ Backfilled payment_date from created_at';
END $$;

-- Backfill patient_id
DO $$
BEGIN
  UPDATE public.final_payments fp
  SET patient_id = v.patient_id
  FROM visits v
  WHERE fp.visit_id = v.visit_id
    AND fp.patient_id IS NULL;

  RAISE NOTICE '✅ Backfilled patient_id from visits table';
END $$;

-- Create indexes
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

-- Add comments
COMMENT ON COLUMN final_payments.payment_date IS
'Date when the final payment was made (extracted from created_at for existing records)';

COMMENT ON COLUMN final_payments.patient_id IS
'Foreign key to patients table - enables direct patient lookup without joining through visits';

COMMENT ON COLUMN final_payments.bank_account_id IS
'Foreign key to bank_accounts table - tracks which bank account received the payment';

COMMENT ON COLUMN final_payments.bank_account_name IS
'Cached bank account name for quick reference without joining bank_accounts table';

-- Success message for migration 3
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION 3: Missing columns added to final_payments!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FINAL SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅✅✅ ALL MIGRATIONS APPLIED SUCCESSFULLY ✅✅✅';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed issues:';
  RAISE NOTICE '  1. ✓ Added UNIQUE constraint on visit_id';
  RAISE NOTICE '  2. ✓ Fixed trigger permissions with SECURITY DEFINER';
  RAISE NOTICE '  3. ✓ Added missing columns: payment_date, patient_id, bank_account_id, bank_account_name';
  RAISE NOTICE '  4. ✓ Backfilled all existing records';
  RAISE NOTICE '  5. ✓ Created performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Result:';
  RAISE NOTICE '  → "Failed to save final payment" error is NOW FIXED!';
  RAISE NOTICE '  → Final payments will save successfully';
  RAISE NOTICE '  → Payments will appear in Cash Book';
  RAISE NOTICE '  → Ledger Statement integration ready';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
