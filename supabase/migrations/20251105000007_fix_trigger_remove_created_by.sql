-- ============================================================================
-- FIX: Remove created_by from trigger function
-- Issue: Frontend no longer sends created_by field
-- Solution: Remove created_by reference from trigger function
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

  -- Insert payment transaction record (WITHOUT created_by field)
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
    NOW()
  )
  RETURNING id INTO v_payment_id;

  RAISE NOTICE 'Payment transaction % recorded for final payment (visit: %)', v_payment_id, NEW.visit_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_final_payment_to_transactions() IS
'Automatically records final payment into patient_payment_transactions table.
Triggered on INSERT to final_payments table.
Maps payment details and creates transaction record for reporting.';
