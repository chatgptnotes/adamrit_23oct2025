-- ============================================================================
-- Update Payment Voucher Trigger with Bank Routing
-- Purpose: Route patient payments to bank accounts based on remarks field
-- ============================================================================

-- ============================================================================
-- STEP 1: Replace function to add bank routing logic
-- ============================================================================
CREATE OR REPLACE FUNCTION create_receipt_voucher_for_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_voucher_type_id UUID;
  v_debit_account_id UUID;  -- Changed from v_cash_account_id to support bank routing
  v_revenue_account_id UUID;
  v_patient_id UUID;
  v_payment_amount DECIMAL(15,2);
  v_payment_mode TEXT;
  v_payment_date DATE;
  v_remarks TEXT;  -- NEW: Store remarks for parsing
  v_account_name TEXT;  -- NEW: Determine which account to debit
  v_narration TEXT;  -- NEW: Build narration dynamically
BEGIN
  -- ========================================================================
  -- Extract payment details based on which table triggered this
  -- ========================================================================
  IF TG_TABLE_NAME = 'final_payments' THEN
    v_payment_amount := NEW.amount;
    v_payment_mode := NEW.mode_of_payment;
    v_payment_date := CURRENT_DATE;
    v_remarks := NEW.payment_remark;  -- NEW: Get remarks from final_payments

    -- Get patient_id from visit
    SELECT patient_id INTO v_patient_id
    FROM visits
    WHERE visit_id = NEW.visit_id;

    v_narration := 'Cash payment received on final bill';

  ELSIF TG_TABLE_NAME = 'advance_payment' THEN
    v_payment_amount := NEW.advance_amount;
    v_payment_mode := NEW.payment_mode;
    v_payment_date := NEW.payment_date::DATE;
    v_patient_id := NEW.patient_id;
    v_remarks := NEW.remarks;  -- NEW: Get remarks from advance_payment

    v_narration := 'Advance cash payment received';

  END IF;

  -- Only process CASH payments
  IF v_payment_mode NOT IN ('CASH', 'Cash', 'cash') THEN
    RETURN NEW;
  END IF;

  -- ========================================================================
  -- NEW LOGIC: Determine account based on remarks field
  -- ========================================================================
  v_account_name := 'Cash in Hand';  -- Default account

  -- Parse remarks to identify bank account (case-insensitive)
  IF v_remarks IS NOT NULL AND v_remarks != '' THEN
    -- Check for STATE BANK OF INDIA (DRM)
    IF v_remarks ILIKE '%sbi%' OR
       v_remarks ILIKE '%state bank%' OR
       v_remarks ILIKE '%drm%' OR
       v_remarks ILIKE '%sbi(drm)%' THEN
      v_account_name := 'STATE BANK OF INDIA (DRM)';
      RAISE NOTICE 'Bank routing: Payment routed to STATE BANK OF INDIA (DRM) based on remarks: "%"', v_remarks;

    -- Check for SARASWAT BANK
    ELSIF v_remarks ILIKE '%saraswat%' THEN
      v_account_name := 'SARASWAT BANK';
      RAISE NOTICE 'Bank routing: Payment routed to SARASWAT BANK based on remarks: "%"', v_remarks;

    ELSE
      -- No bank keyword found, use default
      RAISE NOTICE 'Bank routing: No bank keyword found in remarks, using default Cash in Hand';
    END IF;
  ELSE
    -- Empty or NULL remarks, use default
    RAISE NOTICE 'Bank routing: Empty remarks, using default Cash in Hand';
  END IF;

  -- ========================================================================
  -- Get the appropriate debit account ID
  -- ========================================================================
  SELECT id INTO v_debit_account_id
  FROM chart_of_accounts
  WHERE account_name = v_account_name
    AND is_active = true;

  -- Fallback to Cash in Hand if specific bank account not found
  IF v_debit_account_id IS NULL THEN
    RAISE WARNING 'Bank routing: Account "%" not found or inactive, falling back to Cash in Hand', v_account_name;

    -- Get Cash in Hand as fallback
    SELECT id INTO v_debit_account_id
    FROM chart_of_accounts
    WHERE account_code = '1110' AND account_name = 'Cash in Hand';

    v_account_name := 'Cash in Hand';  -- Reset account name for logging
  END IF;

  -- Get Receipt voucher type ID
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_code = 'REC';

  -- Get Income account ID for revenue (using INCOME account code 4000)
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '4000' AND account_name = 'INCOME';

  -- If accounts don't exist, log error and skip
  IF v_debit_account_id IS NULL OR v_revenue_account_id IS NULL THEN
    RAISE WARNING 'Required accounts not found. Voucher not created.';
    RAISE WARNING 'Debit Account ID: %, Revenue Account ID: %', v_debit_account_id, v_revenue_account_id;
    RETURN NEW;
  END IF;

  -- ========================================================================
  -- Generate voucher number
  -- ========================================================================
  v_voucher_number := generate_voucher_number('REC');
  v_voucher_id := gen_random_uuid();

  -- ========================================================================
  -- Create voucher header
  -- ========================================================================
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
      ELSE NULL
    END,
    v_narration || ' - ' || v_account_name,  -- Include account name in narration
    v_payment_amount,
    v_patient_id,
    'AUTHORISED',  -- Auto-authorize cash receipts
    COALESCE(NEW.created_by, 'system'),
    NOW(),
    NOW()
  );

  -- ========================================================================
  -- Create voucher entry 1: DEBIT Bank/Cash Account
  -- ========================================================================
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
    v_debit_account_id,  -- NOW ROUTES TO CORRECT ACCOUNT!
    'Cash received from patient via ' || v_account_name,
    v_payment_amount,
    0,
    NOW()
  );

  -- ========================================================================
  -- Create voucher entry 2: CREDIT Revenue/Income
  -- ========================================================================
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
    'Patient payment received',
    0,
    v_payment_amount,
    NOW()
  );

  -- ========================================================================
  -- Success log with account information
  -- ========================================================================
  RAISE NOTICE 'SUCCESS: Receipt voucher % created for payment of Rs % to account "%"',
    v_voucher_number, v_payment_amount, v_account_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Update function comment
-- ============================================================================
COMMENT ON FUNCTION create_receipt_voucher_for_payment() IS
'Automatically creates Receipt vouchers in the accounting system when CASH payments are received. Routes payments to appropriate bank accounts based on remarks field keywords (sbi/drm → STATE BANK OF INDIA (DRM), saraswat → SARASWAT BANK, others → Cash in Hand). This ensures ledgers are automatically updated with correct account entries.';

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Payment voucher trigger updated successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Bank Routing Logic:';
  RAISE NOTICE '  • Remarks containing "sbi", "drm", or "sbi(drm)"';
  RAISE NOTICE '    → Routes to: STATE BANK OF INDIA (DRM)';
  RAISE NOTICE '';
  RAISE NOTICE '  • Remarks containing "saraswat"';
  RAISE NOTICE '    → Routes to: SARASWAT BANK';
  RAISE NOTICE '';
  RAISE NOTICE '  • All other remarks';
  RAISE NOTICE '    → Routes to: Cash in Hand (default)';
  RAISE NOTICE '';
  RAISE NOTICE 'Pattern matching is case-insensitive.';
  RAISE NOTICE '';
  RAISE NOTICE 'Examples:';
  RAISE NOTICE '  ✓ "Being cash received towards sbi(drm)" → SBI DRM';
  RAISE NOTICE '  ✓ "Payment via SARASWAT bank" → SARASWAT BANK';
  RAISE NOTICE '  ✓ "Cash payment received" → Cash in Hand';
  RAISE NOTICE '========================================';
END $$;
