-- Add NULL checking to advance payment trigger
-- Created: 2025-11-10
-- Purpose: Fix "Unknown payment mode: NULL" error by adding defensive NULL checks

-- Drop and recreate the function with NULL validation
CREATE OR REPLACE FUNCTION create_receipt_voucher_for_payment()
RETURNS TRIGGER
SECURITY DEFINER  -- Important: Bypass RLS policies
AS $$
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
  -- Skip voucher creation for patient_payment_transactions
  -- These are unified payment records from pharmacy/OPD that don't need additional vouchers
  IF TG_TABLE_NAME = 'patient_payment_transactions' THEN
    RETURN NEW;
  END IF;

  -- Extract payment details based on which table triggered this
  IF TG_TABLE_NAME = 'final_payments' THEN
    v_payment_amount := NEW.amount;
    v_payment_mode := NEW.mode_of_payment;
    v_payment_date := CURRENT_DATE;
    v_bank_account_id := NEW.bank_account_id;

    -- Get patient_id from visit
    SELECT patient_id INTO v_patient_id
    FROM visits
    WHERE visit_id = NEW.visit_id;

  ELSIF TG_TABLE_NAME = 'advance_payment' THEN
    v_payment_amount := NEW.advance_amount;
    v_payment_mode := NEW.payment_mode;
    v_payment_date := NEW.payment_date::DATE;
    v_patient_id := NEW.patient_id;
    v_bank_account_id := NEW.bank_account_id;

  END IF;

  -- ============================================================================
  -- CRITICAL: Check for NULL or empty payment mode
  -- ============================================================================
  IF v_payment_mode IS NULL OR TRIM(v_payment_mode) = '' THEN
    RAISE EXCEPTION 'Payment mode cannot be NULL or empty. Table: %, Original value: "%" (type: %), Please select a valid payment mode.',
      TG_TABLE_NAME,
      COALESCE(v_payment_mode, '<NULL>'),
      pg_typeof(v_payment_mode);
  END IF;

  -- Normalize payment mode to uppercase for consistent comparison
  v_payment_mode := UPPER(TRIM(v_payment_mode));

  -- Log for debugging
  RAISE NOTICE 'Processing % payment: mode=%, amount=%, date=%', TG_TABLE_NAME, v_payment_mode, v_payment_amount, v_payment_date;

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
    -- Unknown payment mode
    RAISE EXCEPTION 'Unknown payment mode: "%". Valid modes are: CASH, ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, DD, CREDIT', v_payment_mode;
  END IF;

  -- ============================================================================
  -- STEP 2: Get voucher type and revenue account
  -- ============================================================================

  -- Get Receipt voucher type ID
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_code = 'REC';

  IF v_voucher_type_id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher type (REC) not found. Cannot create voucher. Please contact administrator.';
  END IF;

  -- Get Patient Advance Account (Revenue side - account code 2110)
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '2110' AND account_name = 'Patient Advance';

  IF v_revenue_account_id IS NULL THEN
    RAISE EXCEPTION 'Patient Advance account (2110) not found in chart_of_accounts. Cannot create voucher. Please contact administrator.';
  END IF;

  -- ============================================================================
  -- STEP 3: Generate voucher number
  -- ============================================================================

  SELECT COALESCE(MAX(CAST(SUBSTRING(voucher_number FROM '[0-9]+') AS INTEGER)), 0) + 1
  INTO v_voucher_number
  FROM vouchers
  WHERE voucher_type_id = v_voucher_type_id;

  v_voucher_number := 'RV' || LPAD(v_voucher_number::TEXT, 6, '0');

  -- ============================================================================
  -- STEP 4: Create voucher
  -- ============================================================================

  INSERT INTO vouchers (
    voucher_type_id,
    voucher_number,
    voucher_date,
    total_amount,
    patient_id,
    narration,
    created_by
  ) VALUES (
    v_voucher_type_id,
    v_voucher_number,
    v_payment_date,
    v_payment_amount,
    v_patient_id,
    'Receipt voucher for ' || TG_TABLE_NAME || ' (Mode: ' || v_payment_mode || ')',
    NULL
  ) RETURNING id INTO v_voucher_id;

  -- ============================================================================
  -- STEP 5: Create voucher entries (Debit and Credit)
  -- ============================================================================

  -- DEBIT entry (Bank/Cash increases)
  INSERT INTO voucher_entries (
    voucher_id,
    account_id,
    debit_amount,
    credit_amount,
    narration
  ) VALUES (
    v_voucher_id,
    v_debit_account_id,
    v_payment_amount,
    0,
    'Receipt via ' || v_payment_mode || COALESCE(' - ' || v_bank_account_name, '')
  );

  -- CREDIT entry (Advance liability increases)
  INSERT INTO voucher_entries (
    voucher_id,
    account_id,
    debit_amount,
    credit_amount,
    narration
  ) VALUES (
    v_voucher_id,
    v_revenue_account_id,
    0,
    v_payment_amount,
    'Advance received from patient'
  );

  RAISE NOTICE '✅ Voucher % created successfully for % (Amount: %, Mode: %)',
    v_voucher_number, TG_TABLE_NAME, v_payment_amount, v_payment_mode;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Trigger function updated with NULL checking!' as status;
