-- ============================================================================
-- FIX: Update Voucher Function to Use Correct Column Names
-- Date: 2025-11-08
-- Purpose: Fix 'column "entry_type" does not exist' error
--
-- ROOT CAUSE:
--   Function uses entry_type column which doesn't exist
--   Table actually uses debit_amount and credit_amount columns
--
-- SOLUTION:
--   Update function to use debit_amount/credit_amount instead of entry_type
-- ============================================================================

CREATE OR REPLACE FUNCTION create_receipt_voucher_for_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_voucher_type_id UUID;
  v_debit_account_id UUID;
  v_revenue_account_id UUID;
  v_patient_id UUID;
  v_payment_amount DECIMAL(15,2);
  v_payment_mode TEXT;
  v_payment_date DATE;
  v_bank_account_id UUID;
  v_bank_account_name TEXT;
BEGIN
  -- Determine source table and extract values
  IF TG_TABLE_NAME = 'advance_payments' THEN
    v_payment_mode := NEW.mode_of_payment;
    v_payment_amount := NEW.amount;
    v_payment_date := NEW.payment_date::DATE;
    v_patient_id := NEW.patient_id;
    v_bank_account_id := NEW.bank_account_id;

  ELSIF TG_TABLE_NAME = 'final_payments' THEN
    v_payment_mode := NEW.mode_of_payment;
    v_payment_amount := NEW.amount;
    v_payment_date := NEW.payment_date::DATE;
    v_patient_id := NEW.patient_id;
    v_bank_account_id := NEW.bank_account_id;

  END IF;

  -- Normalize payment mode to uppercase
  v_payment_mode := UPPER(TRIM(v_payment_mode));

  -- Map alternative payment mode names to standard names
  IF v_payment_mode IN ('ONLINE TRANSFER', 'ONLINE_TRANSFER', 'NET BANKING', 'NET_BANKING', 'NETBANKING', 'BANK TRANSFER', 'BANK_TRANSFER') THEN
    v_payment_mode := 'ONLINE';
  ELSIF v_payment_mode IN ('DEBIT CARD', 'CREDIT CARD') THEN
    v_payment_mode := 'CARD';
  ELSIF v_payment_mode IN ('GOOGLE PAY', 'GOOGLEPAY', 'GPAY', 'PHONE PE', 'PHONEPE', 'PHONE_PE', 'PAYTM') THEN
    v_payment_mode := 'UPI';
  END IF;

  -- Determine debit account based on payment mode
  IF v_payment_mode = 'CASH' THEN
    SELECT id INTO v_debit_account_id
    FROM chart_of_accounts
    WHERE account_code = '1110' AND account_name = 'Cash in Hand';

    IF v_debit_account_id IS NULL THEN
      RAISE EXCEPTION 'Cash in Hand account (1110) not found in chart_of_accounts';
    END IF;

  ELSIF v_payment_mode IN ('ONLINE', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'DD') THEN
    v_debit_account_id := v_bank_account_id;

    IF v_debit_account_id IS NULL THEN
      RAISE EXCEPTION 'Bank account must be specified for % payment mode', v_payment_mode;
    END IF;

    SELECT account_name INTO v_bank_account_name
    FROM chart_of_accounts
    WHERE id = v_debit_account_id;

    IF v_bank_account_name IS NULL THEN
      RAISE EXCEPTION 'Selected bank account does not exist in chart_of_accounts';
    END IF;

  ELSIF v_payment_mode = 'CREDIT' THEN
    RAISE NOTICE 'CREDIT payment mode - No voucher created';
    RETURN NEW;

  ELSE
    RAISE EXCEPTION 'Unknown payment mode: %', v_payment_mode;
  END IF;

  -- Get Receipt voucher type ID
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_code = 'REC';

  IF v_voucher_type_id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher type (REC) not found';
  END IF;

  -- Get INCOME account (4000)
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '4000' AND account_name = 'INCOME';

  IF v_revenue_account_id IS NULL THEN
    RAISE EXCEPTION 'INCOME account (4000) not found';
  END IF;

  -- Generate voucher number
  v_voucher_number := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('voucher_number_seq')::TEXT, 6, '0');

  -- Create voucher
  INSERT INTO vouchers (
    voucher_number,
    voucher_date,
    voucher_type_id,
    patient_id,
    narration,
    total_amount,
    created_at,
    updated_at
  ) VALUES (
    v_voucher_number,
    v_payment_date,
    v_voucher_type_id,
    v_patient_id,
    CASE
      WHEN TG_TABLE_NAME = 'advance_payments' THEN 'Advance payment received from patient'
      WHEN TG_TABLE_NAME = 'final_payments' THEN 'Final bill payment received from patient'
      ELSE 'Payment received from patient'
    END,
    v_payment_amount,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_voucher_id;

  -- ============================================================================
  -- FIXED: Create voucher entries using debit_amount/credit_amount
  -- Instead of entry_type column which doesn't exist
  -- ============================================================================

  -- Debit Entry: Cash/Bank account (debit_amount = amount, credit_amount = 0)
  INSERT INTO voucher_entries (
    voucher_id,
    account_id,
    debit_amount,
    credit_amount,
    entry_order,
    created_at
  ) VALUES (
    v_voucher_id,
    v_debit_account_id,
    v_payment_amount,  -- DEBIT
    0.00,              -- CREDIT
    1,
    NOW()
  );

  -- Credit Entry: Revenue account (debit_amount = 0, credit_amount = amount)
  INSERT INTO voucher_entries (
    voucher_id,
    account_id,
    debit_amount,
    credit_amount,
    entry_order,
    created_at
  ) VALUES (
    v_voucher_id,
    v_revenue_account_id,
    0.00,              -- DEBIT
    v_payment_amount,  -- CREDIT
    2,
    NOW()
  );

  RAISE NOTICE 'Voucher % created successfully for % payment (Amount: ₹%, Mode: %)',
    v_voucher_number,
    CASE WHEN TG_TABLE_NAME = 'advance_payments' THEN 'advance' ELSE 'final' END,
    v_payment_amount,
    v_payment_mode;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_receipt_voucher_for_payment() IS
'Creates receipt vouchers for payments using correct debit_amount/credit_amount columns';

GRANT EXECUTE ON FUNCTION create_receipt_voucher_for_payment() TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VOUCHER FUNCTION FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. ✓ Using debit_amount/credit_amount';
  RAISE NOTICE '  2. ✓ Removed entry_type column';
  RAISE NOTICE '  3. ✓ Added entry_order for proper sequencing';
  RAISE NOTICE '';
  RAISE NOTICE 'Result:';
  RAISE NOTICE '  → Voucher entries will save correctly!';
  RAISE NOTICE '  → Final payments should now work!';
  RAISE NOTICE '========================================';
END $$;
