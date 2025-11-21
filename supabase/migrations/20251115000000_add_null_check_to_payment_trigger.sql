-- Migration: Add NULL check for payment_mode in receipt voucher trigger
-- Created: 2025-11-15
-- Description: Improves error handling in create_receipt_voucher_for_payment trigger
--              to provide clearer error messages when payment_mode is NULL

CREATE OR REPLACE FUNCTION create_receipt_voucher_for_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_voucher_type_id UUID;
  v_payment_amount NUMERIC;
  v_payment_mode VARCHAR(50);
  v_payment_date DATE;
  v_patient_id UUID;
  v_bank_account_id UUID;
  v_bank_account_name TEXT;
  v_debit_account_id UUID;
  v_credit_account_id UUID;
  v_voucher_number TEXT;
  v_voucher_prefix TEXT;
  v_last_number INTEGER;
  v_narration TEXT;
BEGIN
  -- Extract payment details based on which table triggered this
  IF TG_TABLE_NAME = 'ipd_final_bill_payments' THEN
    v_payment_amount := NEW.payment_amount;
    v_payment_mode := NEW.payment_mode;
    v_payment_date := NEW.payment_date::DATE;
    v_bank_account_id := NEW.bank_account_id;

    -- Get patient_id from the related bill
    SELECT patient_id INTO v_patient_id
    FROM ipd_final_bills
    WHERE visit_id = NEW.visit_id;

  ELSIF TG_TABLE_NAME = 'advance_payment' THEN
    v_payment_amount := NEW.advance_amount;
    v_payment_mode := NEW.payment_mode;
    v_payment_date := NEW.payment_date::DATE;
    v_patient_id := NEW.patient_id;
    v_bank_account_id := NEW.bank_account_id;

  END IF;

  -- ✅ ADD NULL CHECK BEFORE NORMALIZING
  IF v_payment_mode IS NULL OR TRIM(v_payment_mode) = '' THEN
    RAISE EXCEPTION 'Payment mode is required. Please select a valid payment mode (CASH, ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, DD, CREDIT).';
  END IF;

  -- Normalize payment mode to uppercase for consistent comparison
  v_payment_mode := UPPER(TRIM(v_payment_mode));

  -- ============================================================================
  -- STEP 1: Determine debit account based on payment mode
  -- ============================================================================

  IF v_payment_mode = 'CASH' THEN
    -- For CASH: Use Cash in Hand account (account code 1110)
    SELECT id INTO v_debit_account_id
    FROM chart_of_accounts
    WHERE account_code = '1110' AND account_name = 'Cash in Hand';

    IF v_debit_account_id IS NULL THEN
      RAISE EXCEPTION 'Cash in Hand account (1110) not found in chart_of_accounts. Cannot create voucher. Please contact administrator.';
    END IF;

  ELSIF v_payment_mode IN ('ONLINE', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'DD') THEN
    -- For all digital/bank-based payments: Require bank account
    v_debit_account_id := v_bank_account_id;

    IF v_debit_account_id IS NULL THEN
      RAISE EXCEPTION 'Bank account must be specified for % payment mode. Please select a bank account before saving.', v_payment_mode;
    END IF;

    -- Verify the bank account exists in chart_of_accounts
    SELECT account_name INTO v_bank_account_name
    FROM chart_of_accounts
    WHERE id = v_debit_account_id;

    IF v_bank_account_name IS NULL THEN
      RAISE EXCEPTION 'Selected bank account (ID: %) does not exist in chart_of_accounts. Please select a valid bank account.', v_debit_account_id;
    END IF;

  ELSIF v_payment_mode = 'CREDIT' THEN
    -- CREDIT is not a real payment - skip voucher creation
    RAISE NOTICE 'CREDIT payment mode - No voucher created (this is not a real payment)';
    RETURN NEW;

  ELSE
    -- Unknown payment mode (this should rarely be reached now due to the NULL check above)
    RAISE EXCEPTION 'Unknown payment mode: %. Valid modes are: CASH, ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, DD, CREDIT', v_payment_mode;
  END IF;

  -- ============================================================================
  -- STEP 2: Get voucher type and revenue account
  -- ============================================================================

  -- Get Receipt voucher type ID
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type = 'Receipt';

  IF v_voucher_type_id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher type not found. Please contact administrator to create it in voucher_types table.';
  END IF;

  -- Get credit account (Advance Received account - account code 2130)
  SELECT id INTO v_credit_account_id
  FROM chart_of_accounts
  WHERE account_code = '2130' AND account_name = 'Advance Received';

  IF v_credit_account_id IS NULL THEN
    RAISE EXCEPTION 'Advance Received account (2130) not found in chart_of_accounts. Cannot create voucher. Please contact administrator.';
  END IF;

  -- ============================================================================
  -- STEP 3: Generate voucher number
  -- ============================================================================

  -- Get the voucher prefix for Receipt voucher type
  SELECT voucher_prefix INTO v_voucher_prefix
  FROM voucher_types
  WHERE id = v_voucher_type_id;

  IF v_voucher_prefix IS NULL THEN
    v_voucher_prefix := 'RV'; -- Default prefix
  END IF;

  -- Get the last voucher number for this type and date
  SELECT COALESCE(MAX(CAST(SUBSTRING(voucher_number FROM '[0-9]+$') AS INTEGER)), 0)
  INTO v_last_number
  FROM voucher
  WHERE voucher_type_id = v_voucher_type_id
    AND voucher_date = v_payment_date;

  -- Generate new voucher number: PREFIX-YYYYMMDD-NNNN
  v_voucher_number := v_voucher_prefix || '-' ||
                      TO_CHAR(v_payment_date, 'YYYYMMDD') || '-' ||
                      LPAD((v_last_number + 1)::TEXT, 4, '0');

  -- ============================================================================
  -- STEP 4: Prepare narration
  -- ============================================================================

  v_narration := 'Advance payment received';
  IF v_payment_mode != 'CASH' THEN
    v_narration := v_narration || ' via ' || v_payment_mode;
    IF v_bank_account_name IS NOT NULL THEN
      v_narration := v_narration || ' (' || v_bank_account_name || ')';
    END IF;
  END IF;

  -- ============================================================================
  -- STEP 5: Insert voucher
  -- ============================================================================

  INSERT INTO voucher (
    voucher_type_id,
    voucher_number,
    voucher_date,
    debit_account_id,
    credit_account_id,
    amount,
    narration,
    reference_type,
    reference_id,
    created_by
  ) VALUES (
    v_voucher_type_id,
    v_voucher_number,
    v_payment_date,
    v_debit_account_id,
    v_credit_account_id,
    v_payment_amount,
    v_narration,
    TG_TABLE_NAME,
    NEW.id,
    'system_trigger'
  );

  RAISE NOTICE 'Receipt voucher created: % for amount %', v_voucher_number, v_payment_amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure triggers are set up correctly
-- (Re-creating them ensures they use the updated function)

DROP TRIGGER IF EXISTS create_receipt_voucher_on_advance_payment ON advance_payment;
CREATE TRIGGER create_receipt_voucher_on_advance_payment
  AFTER INSERT ON advance_payment
  FOR EACH ROW
  EXECUTE FUNCTION create_receipt_voucher_for_payment();

DROP TRIGGER IF EXISTS create_receipt_voucher_on_final_bill_payment ON ipd_final_bill_payments;
CREATE TRIGGER create_receipt_voucher_on_final_bill_payment
  AFTER INSERT ON ipd_final_bill_payments
  FOR EACH ROW
  EXECUTE FUNCTION create_receipt_voucher_for_payment();

-- Add comment to document the change
COMMENT ON FUNCTION create_receipt_voucher_for_payment() IS
'Trigger function that creates receipt vouchers for payments.
Updated 2025-11-15: Added NULL check for payment_mode to provide clearer error messages.';
