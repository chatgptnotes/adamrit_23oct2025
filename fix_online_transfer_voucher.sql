-- ============================================================================
-- FIX: Map "ONLINE TRANSFER" to "ONLINE" in voucher creation function
-- Date: 2025-11-08
-- Purpose: Fix "Unknown payment mode: ONLINE TRANSFER" error
-- ============================================================================

-- ============================================================================
-- PROBLEM:
-- The frontend sends "Online Transfer" as payment mode
-- After UPPER() it becomes "ONLINE TRANSFER"
-- But the function only accepts: ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, DD
-- Result: Error "Unknown payment mode: ONLINE TRANSFER"
-- ============================================================================

-- ============================================================================
-- SOLUTION:
-- Add payment mode mapping AFTER normalization to uppercase
-- Map "ONLINE TRANSFER" → "ONLINE" before validation
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

  -- Normalize payment mode to uppercase for consistent comparison
  v_payment_mode := UPPER(TRIM(v_payment_mode));

  -- ============================================================================
  -- NEW: Map alternative payment mode names to standard names
  -- ============================================================================
  IF v_payment_mode IN ('ONLINE TRANSFER', 'ONLINE_TRANSFER', 'NET BANKING', 'NET_BANKING', 'NETBANKING', 'BANK TRANSFER', 'BANK_TRANSFER') THEN
    v_payment_mode := 'ONLINE';
  ELSIF v_payment_mode IN ('DEBIT CARD', 'CREDIT CARD') THEN
    v_payment_mode := 'CARD';
  ELSIF v_payment_mode IN ('GOOGLE PAY', 'GOOGLEPAY', 'GPAY', 'PHONE PE', 'PHONEPE', 'PHONE_PE', 'PAYTM') THEN
    v_payment_mode := 'UPI';
  END IF;

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
    RAISE EXCEPTION 'Unknown payment mode: %. Valid modes are: CASH, ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, DD, CREDIT', v_payment_mode;
  END IF;

  -- ============================================================================
  -- STEP 2: Get voucher type and revenue account
  -- ============================================================================

  -- Get Receipt voucher type ID
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_code = 'REC';

  IF v_voucher_type_id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher type (REC) not found in voucher_types table. Cannot create voucher. Please contact administrator.';
  END IF;

  -- Get revenue account (Patient Services Revenue - code 4001)
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '4001' AND account_name = 'Patient Services Revenue';

  IF v_revenue_account_id IS NULL THEN
    RAISE EXCEPTION 'Patient Services Revenue account (4001) not found in chart_of_accounts. Cannot create voucher. Please contact administrator.';
  END IF;

  -- ============================================================================
  -- STEP 3: Generate voucher number
  -- ============================================================================

  v_voucher_number := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('voucher_number_seq')::TEXT, 6, '0');

  -- ============================================================================
  -- STEP 4: Create voucher
  -- ============================================================================

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
  -- STEP 5: Create voucher entries (double-entry bookkeeping)
  -- ============================================================================

  -- Debit Entry: Cash/Bank account
  INSERT INTO voucher_entries (
    voucher_id,
    account_id,
    entry_type,
    amount,
    created_at,
    updated_at
  ) VALUES (
    v_voucher_id,
    v_debit_account_id,
    'DEBIT',
    v_payment_amount,
    NOW(),
    NOW()
  );

  -- Credit Entry: Revenue account
  INSERT INTO voucher_entries (
    voucher_id,
    account_id,
    entry_type,
    amount,
    created_at,
    updated_at
  ) VALUES (
    v_voucher_id,
    v_revenue_account_id,
    'CREDIT',
    v_payment_amount,
    NOW(),
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

-- Add comment
COMMENT ON FUNCTION create_receipt_voucher_for_payment() IS
'Automatically creates receipt vouchers for advance and final payments. Uses SECURITY DEFINER to bypass RLS policies. Now includes payment mode mapping to handle variations like "ONLINE TRANSFER" → "ONLINE".';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_receipt_voucher_for_payment() TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VOUCHER FUNCTION UPDATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. ✓ Added payment mode mapping';
  RAISE NOTICE '  2. ✓ ONLINE TRANSFER → ONLINE';
  RAISE NOTICE '  3. ✓ BANK TRANSFER → ONLINE';
  RAISE NOTICE '  4. ✓ NET BANKING → ONLINE';
  RAISE NOTICE '  5. ✓ DEBIT/CREDIT CARD → CARD';
  RAISE NOTICE '  6. ✓ GOOGLE PAY/PHONEPE/PAYTM → UPI';
  RAISE NOTICE '';
  RAISE NOTICE 'Result:';
  RAISE NOTICE '  → "Online Transfer" payments will now work!';
  RAISE NOTICE '  → Vouchers will be created automatically';
  RAISE NOTICE '========================================';
END $$;
