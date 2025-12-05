-- ============================================================================
-- FIX: Complete voucher creation for ALL payment modes
-- Date: 2025-11-04
-- Problem:
--   1. Trigger only handles CASH and ONLINE, ignores other modes
--   2. Silent failures (RAISE WARNING) cause payments to save without vouchers
--   3. No voucher created for CHEQUE, CARD, UPI, NEFT, RTGS, DD
-- Solution:
--   1. Handle all payment modes with proper account mapping
--   2. Use RAISE EXCEPTION for critical errors (causes rollback)
--   3. Require bank_account_id for all non-CASH modes
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
    RAISE EXCEPTION 'Receipt voucher type (REC) not found in voucher_types table. Please contact administrator.';
  END IF;

  -- Get Income account ID for revenue (using INCOME account code 4000)
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '4000' AND account_name = 'INCOME';

  IF v_revenue_account_id IS NULL THEN
    RAISE EXCEPTION 'INCOME account (4000) not found in chart_of_accounts. Please contact administrator.';
  END IF;

  -- ============================================================================
  -- STEP 3: Create voucher and entries
  -- ============================================================================

  -- Generate voucher number
  v_voucher_number := generate_voucher_number('REC');
  v_voucher_id := gen_random_uuid();

  -- Create voucher header
  INSERT INTO vouchers (
    id,
    voucher_number,
    voucher_type_id,
    voucher_date,
    reference_number,
    narration,
    total_amount,
    patient_id,
    status,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    v_voucher_id,
    v_voucher_number,
    v_voucher_type_id,
    v_payment_date,
    CASE
      WHEN TG_TABLE_NAME = 'final_payments' THEN NEW.visit_id
      WHEN TG_TABLE_NAME = 'advance_payment' AND NEW.reference_number IS NOT NULL THEN NEW.reference_number
      ELSE NULL
    END,
    CASE
      WHEN TG_TABLE_NAME = 'final_payments' THEN
        'Payment received on final bill via ' || v_payment_mode
      WHEN TG_TABLE_NAME = 'advance_payment' THEN
        CASE
          WHEN v_payment_mode = 'CASH' THEN 'Advance cash payment received'
          ELSE 'Advance payment received via ' || v_payment_mode || ' - ' || COALESCE(v_bank_account_name, 'BANK')
        END
      ELSE 'Payment received'
    END,
    v_payment_amount,
    v_patient_id,
    'AUTHORISED',  -- Auto-authorize receipts
    COALESCE(NEW.created_by, 'system'),
    NOW(),
    NOW()
  );

  -- Create voucher entry 1: DEBIT Cash/Bank Account (Money IN)
  INSERT INTO voucher_entries (
    id,
    voucher_id,
    account_id,
    narration,
    debit_amount,
    credit_amount,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_voucher_id,
    v_debit_account_id,
    CASE
      WHEN v_payment_mode = 'CASH' THEN 'Cash received from patient'
      ELSE 'Payment received via ' || v_payment_mode || ' to ' || COALESCE(v_bank_account_name, 'bank account')
    END,
    v_payment_amount,
    0,
    NOW()
  );

  -- Create voucher entry 2: CREDIT Revenue/Income (Recognizing income)
  INSERT INTO voucher_entries (
    id,
    voucher_id,
    account_id,
    narration,
    debit_amount,
    credit_amount,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_voucher_id,
    v_revenue_account_id,
    'Patient payment received - ' ||
    CASE
      WHEN TG_TABLE_NAME = 'advance_payment' THEN 'Advance payment'
      ELSE 'Final payment'
    END,
    0,
    v_payment_amount,
    NOW()
  );

  RAISE NOTICE 'Receipt voucher % created for % payment of Rs. %', v_voucher_number, v_payment_mode, v_payment_amount;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE EXCEPTION 'Failed to create voucher for payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_receipt_voucher_for_payment() IS
'Automatically creates Receipt vouchers for ALL payment modes (CASH, ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, DD).
For CASH: debits Cash in Hand (1110).
For all others: debits specified bank account (bank_account_id must be provided).
Uses RAISE EXCEPTION for errors to prevent payments saving without vouchers.';

-- ============================================================================
-- Verification Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TRIGGER UPDATED - Now handles ALL payment modes!';
  RAISE NOTICE '';
  RAISE NOTICE 'Supported payment modes:';
  RAISE NOTICE '  ✓ CASH      → Debit Cash in Hand (1110)';
  RAISE NOTICE '  ✓ ONLINE    → Debit Bank Account (bank_account_id required)';
  RAISE NOTICE '  ✓ UPI       → Debit Bank Account (bank_account_id required)';
  RAISE NOTICE '  ✓ NEFT      → Debit Bank Account (bank_account_id required)';
  RAISE NOTICE '  ✓ RTGS      → Debit Bank Account (bank_account_id required)';
  RAISE NOTICE '  ✓ CHEQUE    → Debit Bank Account (bank_account_id required)';
  RAISE NOTICE '  ✓ CARD      → Debit Bank Account (bank_account_id required)';
  RAISE NOTICE '  ✓ DD        → Debit Bank Account (bank_account_id required)';
  RAISE NOTICE '  - CREDIT    → No voucher (not a real payment)';
  RAISE NOTICE '';
  RAISE NOTICE 'All modes → Credit Income (4000)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Uses RAISE EXCEPTION for errors';
  RAISE NOTICE '   → Payments will FAIL if bank account missing';
  RAISE NOTICE '   → This prevents silent data inconsistency';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run backfill script to fix existing records';
  RAISE NOTICE '  2. Update frontend validation';
  RAISE NOTICE '  3. Test with each payment mode';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
