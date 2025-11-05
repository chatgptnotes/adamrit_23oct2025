-- ============================================================================
-- COMPLETE SCHEMA FIX: Final Payments Table
-- This migration adds ALL missing columns and constraints
-- IDEMPOTENT: Safe to run multiple times
-- ============================================================================

-- ============================================================================
-- STEP 1: Add bank account columns (if they don't exist)
-- ============================================================================

DO $$
BEGIN
  -- Add bank_account_id column
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'final_payments'
      AND column_name = 'bank_account_id'
  ) THEN
    ALTER TABLE public.final_payments
      ADD COLUMN bank_account_id UUID REFERENCES chart_of_accounts(id);

    RAISE NOTICE '✅ Added bank_account_id column';
  ELSE
    RAISE NOTICE '✓ bank_account_id column already exists';
  END IF;

  -- Add bank_account_name column
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

-- ============================================================================
-- STEP 2: Add index on bank_account_id (if doesn't exist)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'final_payments'
      AND indexname = 'idx_final_payments_bank_account'
  ) THEN
    CREATE INDEX idx_final_payments_bank_account
      ON public.final_payments(bank_account_id);

    RAISE NOTICE '✅ Created index on bank_account_id';
  ELSE
    RAISE NOTICE '✓ Index on bank_account_id already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Add comments on new columns
-- ============================================================================

COMMENT ON COLUMN final_payments.bank_account_id IS
'Foreign key to chart_of_accounts for selected bank account (only for Bank Transfer payment mode)';

COMMENT ON COLUMN final_payments.bank_account_name IS
'Denormalized bank account name for quick display without joins';

-- ============================================================================
-- STEP 4: Add UNIQUE constraint on visit_id (if doesn't exist)
-- ============================================================================

DO $$
BEGIN
  -- First, clean up any duplicate records
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

  -- Add constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'final_payments_visit_id_unique'
      AND conrelid = 'final_payments'::regclass
  ) THEN
    ALTER TABLE public.final_payments
      ADD CONSTRAINT final_payments_visit_id_unique UNIQUE (visit_id);

    RAISE NOTICE '✅ Added UNIQUE constraint on visit_id';
  ELSE
    RAISE NOTICE '✓ UNIQUE constraint already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Create/Replace trigger function WITH SECURITY DEFINER
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

  RAISE NOTICE 'Payment transaction % recorded for final payment (visit: %)', v_payment_id, NEW.visit_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_final_payment_to_transactions() IS
'Records final payment into patient_payment_transactions table. Uses SECURITY DEFINER to bypass RLS policies.';

GRANT EXECUTE ON FUNCTION record_final_payment_to_transactions() TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger function created with SECURITY DEFINER';
END $$;

-- ============================================================================
-- STEP 6: Create/Replace trigger on final_payments
-- ============================================================================

DROP TRIGGER IF EXISTS trg_final_payment_record_transaction ON final_payments;

CREATE TRIGGER trg_final_payment_record_transaction
  AFTER INSERT ON final_payments
  FOR EACH ROW
  EXECUTE FUNCTION record_final_payment_to_transactions();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger created on final_payments table';
END $$;

-- ============================================================================
-- FINAL: Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅✅✅ COMPLETE SCHEMA FIX APPLIED ✅✅✅';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'All components verified/added:';
  RAISE NOTICE '  1. ✓ bank_account_id column';
  RAISE NOTICE '  2. ✓ bank_account_name column';
  RAISE NOTICE '  3. ✓ Index on bank_account_id';
  RAISE NOTICE '  4. ✓ UNIQUE constraint on visit_id';
  RAISE NOTICE '  5. ✓ Trigger function with SECURITY DEFINER';
  RAISE NOTICE '  6. ✓ Active trigger';
  RAISE NOTICE '';
  RAISE NOTICE 'The final_payments table is now complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Hard refresh app (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Try saving final payment';
  RAISE NOTICE '  3. Should work now!';
  RAISE NOTICE '========================================';
END $$;
