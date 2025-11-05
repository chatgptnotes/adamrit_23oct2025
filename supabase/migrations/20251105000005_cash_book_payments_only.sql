-- ============================================================================
-- CASH BOOK: Show ONLY Advance Payments and Final Payments
-- This migration creates a complete, working Cash Book with payments only
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure bank account columns exist on final_payments
-- ============================================================================

DO $$
BEGIN
  -- Add bank_account_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'final_payments' AND column_name = 'bank_account_id'
  ) THEN
    ALTER TABLE public.final_payments ADD COLUMN bank_account_id UUID REFERENCES chart_of_accounts(id);
    RAISE NOTICE '✅ Added bank_account_id column';
  ELSE
    RAISE NOTICE '✓ bank_account_id column exists';
  END IF;

  -- Add bank_account_name column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'final_payments' AND column_name = 'bank_account_name'
  ) THEN
    ALTER TABLE public.final_payments ADD COLUMN bank_account_name TEXT;
    RAISE NOTICE '✅ Added bank_account_name column';
  ELSE
    RAISE NOTICE '✓ bank_account_name column exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure UNIQUE constraint on visit_id
-- ============================================================================

DO $$
BEGIN
  -- Clean up duplicates first
  DELETE FROM final_payments
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY visit_id ORDER BY created_at DESC) as rn
      FROM final_payments
    ) ranked WHERE rn > 1
  );

  -- Add constraint if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'final_payments_visit_id_unique' AND conrelid = 'final_payments'::regclass
  ) THEN
    ALTER TABLE public.final_payments ADD CONSTRAINT final_payments_visit_id_unique UNIQUE (visit_id);
    RAISE NOTICE '✅ Added UNIQUE constraint';
  ELSE
    RAISE NOTICE '✓ UNIQUE constraint exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create trigger function WITH SECURITY DEFINER
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
  SELECT patient_id INTO v_patient_uuid FROM visits WHERE visit_id = NEW.visit_id;

  IF v_patient_uuid IS NULL THEN
    RAISE WARNING 'Patient not found for visit_id: %', NEW.visit_id;
    RETURN NEW;
  END IF;

  -- Build narration
  v_narration := COALESCE(NEW.payment_remark, 'Final bill payment - ' || NEW.reason_of_discharge);

  -- Map payment mode
  v_mapped_payment_mode := CASE UPPER(TRIM(NEW.mode_of_payment))
    WHEN 'CASH' THEN 'CASH' WHEN 'CARD' THEN 'CARD' WHEN 'UPI' THEN 'UPI'
    WHEN 'CHEQUE' THEN 'CHEQUE' WHEN 'DD' THEN 'DD' WHEN 'NEFT' THEN 'NEFT'
    WHEN 'RTGS' THEN 'RTGS' WHEN 'ONLINE' THEN 'ONLINE' WHEN 'PAYTM' THEN 'PAYTM'
    WHEN 'PHONEPE' THEN 'PHONEPE' WHEN 'BANK TRANSFER' THEN 'ONLINE'
    WHEN 'BANK_TRANSFER' THEN 'ONLINE' WHEN 'NET BANKING' THEN 'ONLINE'
    WHEN 'NETBANKING' THEN 'ONLINE' WHEN 'DEBIT CARD' THEN 'CARD'
    WHEN 'CREDIT CARD' THEN 'CARD' WHEN 'GOOGLE PAY' THEN 'UPI'
    WHEN 'GOOGLEPAY' THEN 'UPI' WHEN 'GPAY' THEN 'UPI'
    ELSE 'CASH'
  END;

  -- Insert into patient_payment_transactions
  INSERT INTO patient_payment_transactions (
    patient_id, visit_id, payment_source, source_table_name, source_reference_id,
    payment_date, payment_mode, amount, narration, bank_name, created_by, created_at
  ) VALUES (
    v_patient_uuid, NEW.visit_id, 'FINAL_BILL', 'final_payments', NEW.id::TEXT,
    CURRENT_DATE, v_mapped_payment_mode, NEW.amount, v_narration,
    NEW.bank_account_name, COALESCE(NEW.created_by, 'system'), NOW()
  ) RETURNING id INTO v_payment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_final_payment_to_transactions() IS 'Records final payments with SECURITY DEFINER to bypass RLS';
GRANT EXECUTE ON FUNCTION record_final_payment_to_transactions() TO authenticated;

-- ============================================================================
-- STEP 4: Create trigger on final_payments
-- ============================================================================

DROP TRIGGER IF EXISTS trg_final_payment_record_transaction ON final_payments;
CREATE TRIGGER trg_final_payment_record_transaction
  AFTER INSERT ON final_payments
  FOR EACH ROW
  EXECUTE FUNCTION record_final_payment_to_transactions();

-- ============================================================================
-- STEP 5: Create Cash Book function with ONLY Advance & Final Payments
-- ============================================================================

DROP FUNCTION IF EXISTS get_cash_book_transactions_direct(DATE, DATE, TEXT, UUID);
DROP FUNCTION IF EXISTS get_cash_book_transactions_direct(DATE, DATE, TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION get_cash_book_transactions_direct(
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL,
  p_transaction_type TEXT DEFAULT NULL,
  p_patient_id UUID DEFAULT NULL,
  p_hospital_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  transaction_id TEXT,
  transaction_type TEXT,
  visit_id TEXT,
  patient_id UUID,
  patient_name TEXT,
  transaction_date DATE,
  transaction_time TIMESTAMP WITH TIME ZONE,
  description TEXT,
  amount NUMERIC,
  quantity INTEGER,
  unit_rate NUMERIC,
  rate_type TEXT,
  payment_mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY

  -- 1. Advance Payments
  SELECT
    ap.id::TEXT as transaction_id,
    'ADVANCE_PAYMENT'::TEXT as transaction_type,
    ap.visit_id::TEXT as visit_id,
    ap.patient_id,
    COALESCE(ap.patient_name, p.name, 'Unknown Patient')::TEXT as patient_name,
    ap.payment_date::DATE as transaction_date,
    ap.created_at::TIMESTAMP WITH TIME ZONE as transaction_time,
    CASE
      WHEN ap.is_refund THEN ('Advance Payment Refund: ' || COALESCE(ap.refund_reason, 'No reason'))::TEXT
      ELSE ('Advance Payment' || CASE WHEN ap.remarks IS NOT NULL AND ap.remarks != '' THEN (' - ' || ap.remarks) ELSE '' END)::TEXT
    END as description,
    CASE
      WHEN ap.is_refund THEN (ap.advance_amount * -1)::NUMERIC
      ELSE ap.advance_amount::NUMERIC
    END as amount,
    1::INTEGER as quantity,
    ap.advance_amount::NUMERIC as unit_rate,
    'advance'::TEXT as rate_type,
    UPPER(ap.payment_mode)::TEXT as payment_mode,
    ap.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    ap.updated_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM advance_payment ap
  LEFT JOIN patients p ON ap.patient_id = p.id
  WHERE ap.status = 'ACTIVE'
    AND ap.advance_amount > 0
    AND (p_from_date IS NULL OR ap.payment_date::DATE >= p_from_date)
    AND (p_to_date IS NULL OR ap.payment_date::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'ADVANCE_PAYMENT' = p_transaction_type)
    AND (p_patient_id IS NULL OR ap.patient_id = p_patient_id)
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name)

  UNION ALL

  -- 2. Final Payments
  SELECT
    fp.id::TEXT as transaction_id,
    'FINAL_BILL'::TEXT as transaction_type,
    fp.visit_id::TEXT as visit_id,
    v.patient_id,
    p.name::TEXT as patient_name,
    fp.created_at::DATE as transaction_date,
    fp.created_at::TIMESTAMP WITH TIME ZONE as transaction_time,
    ('Final Bill Payment - ' || fp.reason_of_discharge ||
     CASE WHEN fp.payment_remark IS NOT NULL AND fp.payment_remark != ''
          THEN ' (' || fp.payment_remark || ')'
          ELSE ''
     END)::TEXT as description,
    fp.amount::NUMERIC as amount,
    1::INTEGER as quantity,
    fp.amount::NUMERIC as unit_rate,
    'final'::TEXT as rate_type,
    UPPER(fp.mode_of_payment)::TEXT as payment_mode,
    fp.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    fp.created_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM final_payments fp
  LEFT JOIN visits v ON fp.visit_id = v.visit_id
  LEFT JOIN patients p ON v.patient_id = p.id
  WHERE fp.amount > 0
    AND (p_from_date IS NULL OR fp.created_at::DATE >= p_from_date)
    AND (p_to_date IS NULL OR fp.created_at::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'FINAL_BILL' = p_transaction_type)
    AND (p_patient_id IS NULL OR v.patient_id = p_patient_id)
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name)

  ORDER BY transaction_date DESC, transaction_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_cash_book_transactions_direct IS 'Cash Book showing ONLY Advance Payments and Final Payments';
GRANT EXECUTE ON FUNCTION get_cash_book_transactions_direct TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅✅✅ CASH BOOK FIX COMPLETE ✅✅✅';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Cash Book now shows ONLY:';
  RAISE NOTICE '  1. ✓ Advance Payments';
  RAISE NOTICE '  2. ✓ Final Payments';
  RAISE NOTICE '';
  RAISE NOTICE 'All fixes applied:';
  RAISE NOTICE '  ✓ bank_account columns on final_payments';
  RAISE NOTICE '  ✓ UNIQUE constraint on visit_id';
  RAISE NOTICE '  ✓ Trigger function with SECURITY DEFINER';
  RAISE NOTICE '  ✓ Active trigger on final_payments';
  RAISE NOTICE '  ✓ Cash Book updated (payments only)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Hard refresh app and test!';
  RAISE NOTICE '========================================';
END $$;
