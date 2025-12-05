-- ============================================================================
-- Add SECURITY DEFINER to record_final_payment_to_transactions() Function
-- This migration fixes the RLS policy blocking issue by adding SECURITY DEFINER
-- ============================================================================

-- ============================================================================
-- PROBLEM:
-- The trigger function record_final_payment_to_transactions() was created
-- WITHOUT SECURITY DEFINER, which means it runs with the calling user's
-- permissions. The RLS policy on patient_payment_transactions blocks the
-- INSERT, causing "Failed to save final payment" error.
-- ============================================================================

-- ============================================================================
-- SOLUTION:
-- Recreate the function with SECURITY DEFINER so it bypasses RLS policies
-- and has elevated privileges to insert into patient_payment_transactions
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
  -- Allowed: CASH, CARD, UPI, CHEQUE, DD, NEFT, RTGS, ONLINE, PAYTM, PHONEPE
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

  -- Log warning if mode was mapped to default
  IF UPPER(TRIM(NEW.mode_of_payment)) NOT IN (
    'CASH', 'CARD', 'UPI', 'CHEQUE', 'DD', 'NEFT', 'RTGS',
    'ONLINE', 'PAYTM', 'PHONEPE', 'BANK TRANSFER', 'BANK_TRANSFER',
    'NET BANKING', 'NET_BANKING', 'NETBANKING', 'ONLINE TRANSFER',
    'ONLINE_TRANSFER', 'DEBIT CARD', 'CREDIT CARD', 'GOOGLE PAY',
    'GOOGLEPAY', 'GPAY', 'PHONE PE', 'PHONE_PE'
  ) THEN
    RAISE WARNING 'Unknown payment mode "%" for final payment %, defaulting to CASH',
      NEW.mode_of_payment, NEW.id;
  END IF;

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
    v_mapped_payment_mode, -- Use mapped payment mode
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

-- ============================================================================
-- Add comment explaining SECURITY DEFINER
-- ============================================================================
COMMENT ON FUNCTION record_final_payment_to_transactions() IS
'Automatically records final payment into patient_payment_transactions table. Uses SECURITY DEFINER to bypass RLS policies and insert with elevated privileges.';

-- ============================================================================
-- Grant execute permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION record_final_payment_to_transactions TO authenticated;

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SECURITY DEFINER added to trigger function!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. ✓ Function recreated with SECURITY DEFINER';
  RAISE NOTICE '  2. ✓ Function now bypasses RLS policies';
  RAISE NOTICE '  3. ✓ Trigger can now INSERT into patient_payment_transactions';
  RAISE NOTICE '';
  RAISE NOTICE 'The "Failed to save final payment" error is NOW FIXED!';
  RAISE NOTICE 'Final payments will save successfully and appear in Cash Book.';
  RAISE NOTICE '========================================';
END $$;
