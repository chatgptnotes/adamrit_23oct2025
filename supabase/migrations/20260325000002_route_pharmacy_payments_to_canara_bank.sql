-- ============================================================================
-- Route Pharmacy Payments to Canara Bank HOPE PHARMACY
-- Date: 2026-03-25
-- Purpose:
--   Part A: Create trigger on pharmacy_credit_payments to auto-create vouchers
--           routing UPI/CARD/ONLINE to Canara Bank HOPE PHARMACY (1124)
--   Part B: Keep pharmacy routing in create_receipt_voucher_for_payment()
--           for patient_payment_transactions
--   Part C: Backfill existing pharmacy_credit_payments with voucher entries
-- ============================================================================

-- ============================================================================
-- PART A: New trigger function for pharmacy_credit_payments
-- ============================================================================
CREATE OR REPLACE FUNCTION create_voucher_for_pharmacy_credit_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_voucher_type_id UUID;
  v_voucher_type_code TEXT;
  v_debit_account_id UUID;
  v_revenue_account_id UUID;
  v_debit_account_name TEXT;
  v_narration TEXT;
BEGIN
  -- Skip CREDIT entries (credit extensions, not actual payments)
  IF NEW.payment_method = 'CREDIT' THEN
    RETURN NEW;
  END IF;

  -- Determine debit account based on payment method
  IF NEW.payment_method IN ('UPI', 'CARD', 'ONLINE', 'NEFT', 'RTGS') THEN
    -- Route to Canara Bank HOPE PHARMACY (1124)
    SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
    FROM chart_of_accounts
    WHERE account_code = '1124' AND is_active = true;
  ELSE
    -- CASH -> Cash in Hand (1110)
    SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
    FROM chart_of_accounts
    WHERE account_code = '1110' AND is_active = true;
  END IF;

  -- Get Receipt voucher type
  SELECT id, voucher_type_code INTO v_voucher_type_id, v_voucher_type_code
  FROM voucher_types
  WHERE voucher_type_code IN ('REC', 'RV')
    AND voucher_category = 'RECEIPT'
    AND is_active = true
  ORDER BY CASE WHEN voucher_type_code = 'REC' THEN 1 ELSE 2 END
  LIMIT 1;

  -- Get INCOME account (4000)
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '4000' AND account_name = 'INCOME';

  -- Abort if required accounts not found
  IF v_voucher_type_id IS NULL OR v_debit_account_id IS NULL OR v_revenue_account_id IS NULL THEN
    RAISE WARNING 'Pharmacy credit payment voucher: required accounts not found. VT=%, Debit=%, Rev=%',
      v_voucher_type_id, v_debit_account_id, v_revenue_account_id;
    RETURN NEW;
  END IF;

  -- Generate voucher number and ID
  v_voucher_number := generate_voucher_number(v_voucher_type_code);
  v_voucher_id := gen_random_uuid();

  v_narration := 'Pharmacy credit payment received via ' || NEW.payment_method || ' - ' || v_debit_account_name;

  -- Create voucher header
  INSERT INTO vouchers (
    id, voucher_number, voucher_type_id, voucher_date,
    reference_number, narration, total_amount, patient_id,
    status, created_by, created_at, updated_at
  ) VALUES (
    v_voucher_id,
    v_voucher_number,
    v_voucher_type_id,
    NEW.payment_date::DATE,
    NEW.id::TEXT,
    v_narration,
    NEW.amount,
    NEW.patient_uuid,
    'AUTHORISED',
    NULL,
    NOW(),
    NOW()
  );

  -- Voucher entry 1: DEBIT Bank/Cash
  INSERT INTO voucher_entries (
    id, voucher_id, account_id, narration,
    debit_amount, credit_amount, created_at
  ) VALUES (
    gen_random_uuid(),
    v_voucher_id,
    v_debit_account_id,
    'Pharmacy credit payment from ' || COALESCE(NEW.patient_name, 'patient') || ' via ' || NEW.payment_method || ' to ' || v_debit_account_name,
    NEW.amount,
    0,
    NOW()
  );

  -- Voucher entry 2: CREDIT INCOME
  INSERT INTO voucher_entries (
    id, voucher_id, account_id, narration,
    debit_amount, credit_amount, created_at
  ) VALUES (
    gen_random_uuid(),
    v_voucher_id,
    v_revenue_account_id,
    'Pharmacy credit payment received from ' || COALESCE(NEW.patient_name, 'patient'),
    0,
    NEW.amount,
    NOW()
  );

  RAISE NOTICE 'Pharmacy credit payment voucher % created: % Rs % to %',
    v_voucher_number, NEW.payment_method, NEW.amount, v_debit_account_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on pharmacy_credit_payments
DROP TRIGGER IF EXISTS trigger_pharmacy_credit_payment_voucher ON pharmacy_credit_payments;
CREATE TRIGGER trigger_pharmacy_credit_payment_voucher
  AFTER INSERT ON pharmacy_credit_payments
  FOR EACH ROW
  EXECUTE FUNCTION create_voucher_for_pharmacy_credit_payment();

-- ============================================================================
-- PART B: Update create_receipt_voucher_for_payment() with pharmacy routing
-- for patient_payment_transactions (unchanged from previous version)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_receipt_voucher_for_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_voucher_type_id UUID;
  v_voucher_type_code TEXT;
  v_debit_account_id UUID;
  v_revenue_account_id UUID;
  v_patient_id UUID;
  v_payment_amount DECIMAL(15,2);
  v_payment_mode TEXT;
  v_payment_date DATE;
  v_remarks TEXT;
  v_account_name TEXT;
  v_narration TEXT;
  v_bank_account_id UUID;
  v_bank_account_name TEXT;
BEGIN
  -- ========================================================================
  -- Extract payment details based on which table triggered this
  -- ========================================================================
  IF TG_TABLE_NAME = 'final_payments' THEN
    v_payment_amount := NEW.amount;
    v_payment_mode := NEW.mode_of_payment;
    v_payment_date := CURRENT_DATE;
    v_remarks := NEW.payment_remark;
    v_bank_account_id := NEW.bank_account_id;
    v_bank_account_name := NEW.bank_account_name;

    -- Get patient_id from visit
    SELECT patient_id INTO v_patient_id
    FROM visits
    WHERE visit_id = NEW.visit_id;

    v_narration := 'Payment received on final bill';

  ELSIF TG_TABLE_NAME = 'advance_payment' THEN
    v_payment_amount := NEW.advance_amount;
    v_payment_mode := NEW.payment_mode;
    v_payment_date := NEW.payment_date::DATE;
    v_patient_id := NEW.patient_id;
    v_remarks := NEW.remarks;
    v_bank_account_id := NEW.bank_account_id;
    v_bank_account_name := NEW.bank_account_name;

    v_narration := 'Advance payment received';

  ELSIF TG_TABLE_NAME = 'patient_payment_transactions' THEN
    v_payment_amount := NEW.amount;
    v_payment_mode := NEW.payment_mode;
    v_payment_date := NEW.payment_date;
    v_patient_id := NEW.patient_id;
    v_remarks := NEW.narration;
    v_bank_account_id := NULL; -- This table doesn't have bank_account_id yet
    v_bank_account_name := NULL;

    -- Use custom narration or build from payment source
    v_narration := COALESCE(
      NEW.narration,
      CASE NEW.payment_source
        WHEN 'OPD_SERVICE' THEN 'OPD service payment received'
        WHEN 'PHARMACY' THEN 'Pharmacy bill payment received'
        WHEN 'PHYSIOTHERAPY' THEN 'Physiotherapy payment received'
        WHEN 'DIRECT_SALE' THEN 'Direct pharmacy sale payment received'
        ELSE 'Payment received'
      END
    );
  END IF;

  -- ========================================================================
  -- Determine which account to debit based on payment mode and bank selection
  -- ========================================================================

  -- Default to Cash in Hand
  v_account_name := 'Cash in Hand';
  v_debit_account_id := NULL;

  -- Handle CASH payments
  IF v_payment_mode IN ('CASH', 'Cash', 'cash') THEN
    -- Check if remarks contains bank routing keywords (backward compatibility)
    IF v_remarks IS NOT NULL AND v_remarks != '' THEN
      IF v_remarks ILIKE '%sbi%' OR v_remarks ILIKE '%state bank%' OR v_remarks ILIKE '%drm%' THEN
        v_account_name := 'STATE BANK OF INDIA (DRM)';
      ELSIF v_remarks ILIKE '%saraswat%' THEN
        v_account_name := 'SARASWAT BANK';
      END IF;
    END IF;

  -- Handle ONLINE and Bank Transfer payments
  ELSIF v_payment_mode IN ('ONLINE', 'Online', 'online', 'Bank Transfer', 'BANK TRANSFER') THEN
    -- Use bank_account_id if provided (preferred method)
    IF v_bank_account_id IS NOT NULL THEN
      SELECT id, account_name INTO v_debit_account_id, v_account_name
      FROM chart_of_accounts
      WHERE id = v_bank_account_id
        AND is_active = true;

      RAISE NOTICE 'ONLINE payment: Using bank_account_id % (%)', v_bank_account_id, v_account_name;

    -- Fallback to bank_account_name if bank_account_id lookup failed
    ELSIF v_bank_account_name IS NOT NULL AND v_bank_account_name != '' THEN
      SELECT id, account_name INTO v_debit_account_id, v_account_name
      FROM chart_of_accounts
      WHERE account_name = v_bank_account_name
        AND is_active = true;

      RAISE NOTICE 'ONLINE payment: Using bank_account_name "%"', v_account_name;

    -- Final fallback: parse remarks for bank keywords
    ELSIF v_remarks IS NOT NULL AND v_remarks != '' THEN
      IF v_remarks ILIKE '%sbi%' OR v_remarks ILIKE '%state bank%' OR v_remarks ILIKE '%drm%' THEN
        v_account_name := 'STATE BANK OF INDIA (DRM)';
      ELSIF v_remarks ILIKE '%saraswat%' THEN
        v_account_name := 'SARASWAT BANK';
      ELSE
        RAISE WARNING 'ONLINE payment: No bank specified, defaulting to Cash in Hand';
      END IF;
    ELSE
      RAISE WARNING 'ONLINE payment: No bank information provided, defaulting to Cash in Hand';
    END IF;

  -- Handle other electronic payment modes (UPI, NEFT, RTGS, etc.)
  ELSIF v_payment_mode IN ('UPI', 'NEFT', 'RTGS', 'CARD', 'CHEQUE', 'DD') THEN
    -- Check if bank account is specified
    IF v_bank_account_id IS NOT NULL THEN
      SELECT id, account_name INTO v_debit_account_id, v_account_name
      FROM chart_of_accounts
      WHERE id = v_bank_account_id
        AND is_active = true;
    ELSIF v_bank_account_name IS NOT NULL AND v_bank_account_name != '' THEN
      SELECT id, account_name INTO v_debit_account_id, v_account_name
      FROM chart_of_accounts
      WHERE account_name = v_bank_account_name
        AND is_active = true;
    ELSIF v_remarks IS NOT NULL AND v_remarks != '' THEN
      -- Parse remarks for bank keywords
      IF v_remarks ILIKE '%sbi%' OR v_remarks ILIKE '%state bank%' OR v_remarks ILIKE '%drm%' THEN
        v_account_name := 'STATE BANK OF INDIA (DRM)';
      ELSIF v_remarks ILIKE '%saraswat%' THEN
        v_account_name := 'SARASWAT BANK';
      END IF;
    END IF;
  END IF;

  -- ========================================================================
  -- Route PHARMACY non-cash payments to Canara Bank HOPE PHARMACY
  -- When payment comes from pharmacy via patient_payment_transactions and
  -- no bank was explicitly set, route non-cash payments to account 1124
  -- ========================================================================
  IF v_debit_account_id IS NULL
     AND v_account_name = 'Cash in Hand'
     AND v_payment_mode NOT IN ('CASH', 'Cash', 'cash')
     AND TG_TABLE_NAME = 'patient_payment_transactions'
  THEN
    IF NEW.payment_source IN ('PHARMACY', 'DIRECT_SALE') THEN
      SELECT id, account_name INTO v_debit_account_id, v_account_name
      FROM chart_of_accounts
      WHERE account_code = '1124' AND is_active = true;

      IF v_debit_account_id IS NOT NULL THEN
        RAISE NOTICE 'PHARMACY payment: Routing % to Canara Bank HOPE PHARMACY', v_payment_mode;
      END IF;
    END IF;
  END IF;

  -- ========================================================================
  -- Get the debit account ID if not already set
  -- ========================================================================
  IF v_debit_account_id IS NULL THEN
    SELECT id INTO v_debit_account_id
    FROM chart_of_accounts
    WHERE account_name = v_account_name
      AND is_active = true;
  END IF;

  -- Fallback to Cash in Hand if specific account not found
  IF v_debit_account_id IS NULL THEN
    RAISE WARNING 'Account "%" not found or inactive, falling back to Cash in Hand', v_account_name;

    SELECT id INTO v_debit_account_id
    FROM chart_of_accounts
    WHERE account_code = '1110' AND account_name = 'Cash in Hand';

    v_account_name := 'Cash in Hand';
  END IF;

  -- ========================================================================
  -- Get other required account IDs
  -- ========================================================================

  -- Get Receipt voucher type ID - try 'REC' first, then 'RV'
  SELECT id, voucher_type_code INTO v_voucher_type_id, v_voucher_type_code
  FROM voucher_types
  WHERE voucher_type_code IN ('REC', 'RV')
    AND voucher_category = 'RECEIPT'
    AND is_active = true
  ORDER BY CASE WHEN voucher_type_code = 'REC' THEN 1 ELSE 2 END
  LIMIT 1;

  -- Get Income account ID for revenue
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '4000' AND account_name = 'INCOME';

  -- If required accounts don't exist, log error and skip
  IF v_voucher_type_id IS NULL OR v_debit_account_id IS NULL OR v_revenue_account_id IS NULL THEN
    RAISE WARNING 'Required accounts not found. Voucher not created.';
    RAISE WARNING 'Voucher Type ID: %, Debit Account ID: %, Revenue Account ID: %',
                  v_voucher_type_id, v_debit_account_id, v_revenue_account_id;
    RETURN NEW;
  END IF;

  -- ========================================================================
  -- Generate voucher number
  -- ========================================================================
  v_voucher_number := generate_voucher_number(v_voucher_type_code);
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
      WHEN TG_TABLE_NAME = 'patient_payment_transactions' THEN NEW.id::TEXT
      ELSE NULL
    END,
    v_narration || ' via ' || v_payment_mode || ' - ' || v_account_name,
    v_payment_amount,
    v_patient_id,
    'AUTHORISED',
    CASE WHEN TG_TABLE_NAME = 'patient_payment_transactions' THEN NEW.created_by ELSE NULL END,
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
    v_debit_account_id,
    'Payment received from patient via ' || v_payment_mode || ' to ' || v_account_name,
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
  RAISE NOTICE 'SUCCESS: Receipt voucher % created for % payment of Rs % to account "%"',
    v_voucher_number, v_payment_mode, v_payment_amount, v_account_name;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART C: Backfill existing pharmacy_credit_payments with voucher entries
-- ============================================================================
DO $$
DECLARE
  rec RECORD;
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_voucher_type_id UUID;
  v_voucher_type_code TEXT;
  v_debit_account_id UUID;
  v_debit_account_name TEXT;
  v_revenue_account_id UUID;
  v_canara_id UUID;
  v_canara_name TEXT;
  v_cash_id UUID;
  v_cash_name TEXT;
  v_count INTEGER := 0;
BEGIN
  -- Pre-fetch account IDs
  SELECT id, account_name INTO v_canara_id, v_canara_name
  FROM chart_of_accounts WHERE account_code = '1124' AND is_active = true;

  SELECT id, account_name INTO v_cash_id, v_cash_name
  FROM chart_of_accounts WHERE account_code = '1110' AND is_active = true;

  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts WHERE account_code = '4000' AND account_name = 'INCOME';

  SELECT id, voucher_type_code INTO v_voucher_type_id, v_voucher_type_code
  FROM voucher_types
  WHERE voucher_type_code IN ('REC', 'RV')
    AND voucher_category = 'RECEIPT'
    AND is_active = true
  ORDER BY CASE WHEN voucher_type_code = 'REC' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_canara_id IS NULL OR v_cash_id IS NULL OR v_revenue_account_id IS NULL OR v_voucher_type_id IS NULL THEN
    RAISE WARNING 'Backfill: required accounts not found. Canara=%, Cash=%, Revenue=%, VT=%',
      v_canara_id, v_cash_id, v_revenue_account_id, v_voucher_type_id;
    RETURN;
  END IF;

  -- Loop through existing pharmacy_credit_payments that are actual payments (not CREDIT)
  -- and don't already have a voucher (check by reference_number = id::text)
  FOR rec IN
    SELECT pc.*
    FROM pharmacy_credit_payments pc
    WHERE pc.payment_method != 'CREDIT'
      AND NOT EXISTS (
        SELECT 1 FROM vouchers v
        WHERE v.reference_number = pc.id::TEXT
          AND v.status = 'AUTHORISED'
      )
    ORDER BY pc.payment_date
  LOOP
    -- Determine debit account
    IF rec.payment_method IN ('UPI', 'CARD', 'ONLINE', 'NEFT', 'RTGS') THEN
      v_debit_account_id := v_canara_id;
      v_debit_account_name := v_canara_name;
    ELSE
      v_debit_account_id := v_cash_id;
      v_debit_account_name := v_cash_name;
    END IF;

    v_voucher_number := generate_voucher_number(v_voucher_type_code);
    v_voucher_id := gen_random_uuid();

    -- Create voucher header
    INSERT INTO vouchers (
      id, voucher_number, voucher_type_id, voucher_date,
      reference_number, narration, total_amount, patient_id,
      status, created_by, created_at, updated_at
    ) VALUES (
      v_voucher_id,
      v_voucher_number,
      v_voucher_type_id,
      rec.payment_date::DATE,
      rec.id::TEXT,
      'Pharmacy credit payment received via ' || rec.payment_method || ' - ' || v_debit_account_name,
      rec.amount,
      rec.patient_uuid,
      'AUTHORISED',
      NULL,
      NOW(),
      NOW()
    );

    -- DEBIT bank/cash
    INSERT INTO voucher_entries (
      id, voucher_id, account_id, narration,
      debit_amount, credit_amount, created_at
    ) VALUES (
      gen_random_uuid(),
      v_voucher_id,
      v_debit_account_id,
      'Pharmacy credit payment from ' || COALESCE(rec.patient_name, 'patient') || ' via ' || rec.payment_method || ' to ' || v_debit_account_name,
      rec.amount,
      0,
      NOW()
    );

    -- CREDIT INCOME
    INSERT INTO voucher_entries (
      id, voucher_id, account_id, narration,
      debit_amount, credit_amount, created_at
    ) VALUES (
      gen_random_uuid(),
      v_voucher_id,
      v_revenue_account_id,
      'Pharmacy credit payment received from ' || COALESCE(rec.patient_name, 'patient'),
      0,
      rec.amount,
      NOW()
    );

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfill complete: % pharmacy credit payment vouchers created', v_count;
END $$;

-- ============================================================================
-- Also backfill existing patient_payment_transactions pharmacy vouchers
-- that were incorrectly routed to Cash in Hand
-- ============================================================================
DO $$
DECLARE
  v_canara_id UUID;
  v_cash_id UUID;
  v_updated INTEGER;
BEGIN
  SELECT id INTO v_canara_id FROM chart_of_accounts WHERE account_code = '1124';
  SELECT id INTO v_cash_id FROM chart_of_accounts WHERE account_code = '1110';

  IF v_canara_id IS NULL OR v_cash_id IS NULL THEN
    RAISE WARNING 'Skipping patient_payment_transactions backfill: accounts not found.';
    RETURN;
  END IF;

  -- Update debit entries for pharmacy vouchers incorrectly routed to Cash in Hand
  UPDATE voucher_entries
  SET account_id = v_canara_id
  WHERE account_id = v_cash_id
    AND debit_amount > 0
    AND voucher_id IN (
      SELECT v.id FROM vouchers v
      WHERE v.narration ILIKE '%pharmacy%'
        AND v.status = 'AUTHORISED'
        AND v.narration NOT ILIKE '%via CASH%'
        AND v.narration NOT ILIKE '%via Cash%'
        AND v.narration NOT ILIKE '%via cash%'
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Backfill: % patient_payment_transactions pharmacy entries re-routed to Canara Bank', v_updated;
END $$;

-- Update narrations to match
UPDATE vouchers
SET narration = REPLACE(narration, 'Cash in Hand', (
  SELECT account_name FROM chart_of_accounts WHERE account_code = '1124'
))
WHERE narration ILIKE '%pharmacy%'
  AND narration LIKE '%Cash in Hand%'
  AND narration NOT ILIKE '%via CASH%'
  AND narration NOT ILIKE '%via Cash%'
  AND narration NOT ILIKE '%via cash%'
  AND status = 'AUTHORISED';

-- ============================================================================
-- Summary
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Pharmacy payment routing complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  1. NEW trigger on pharmacy_credit_payments creates vouchers automatically';
  RAISE NOTICE '     - UPI/CARD/ONLINE/NEFT/RTGS -> Canara Bank HOPE PHARMACY (1124)';
  RAISE NOTICE '     - CASH -> Cash in Hand (1110)';
  RAISE NOTICE '     - CREDIT -> skipped (not a payment)';
  RAISE NOTICE '  2. Existing pharmacy_credit_payments backfilled with vouchers';
  RAISE NOTICE '  3. patient_payment_transactions pharmacy routing preserved';
  RAISE NOTICE '========================================';
END $$;
