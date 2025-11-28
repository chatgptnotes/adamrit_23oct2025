-- ============================================================================
-- Fix poonam's Missing Bank Account IDs and Create Vouchers
-- Date: 2025-11-06
-- Purpose: Update 3 advance payments missing bank_account_id and create vouchers
--
-- ISSUE: poonam has 5 advance payments in Payment History
--        Only 2 appear in SARASWAT BANK ledger
--        3 payments have NULL bank_account_id (no vouchers created)
--
-- FIX: 1. Update missing bank_account_id values
--      2. Manually create vouchers for these 3 payments (if they don't exist)
--
-- IDEMPOTENT: Can be run multiple times safely
-- ============================================================================

DO $$
DECLARE
  v_poonam_patient_id UUID;
  v_saraswat_bank_id UUID;
  v_sbi_drm_id UUID;
  v_cash_account_id UUID;
  v_payment RECORD;
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_income_account_id UUID;
  v_voucher_type_id UUID;
  v_fixed_count INT := 0;
  v_voucher_created_count INT := 0;
  v_voucher_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔧 Fixing poonam Missing Bank Account IDs and Vouchers';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Get poonam's patient ID
  SELECT id INTO v_poonam_patient_id
  FROM patients
  WHERE name ILIKE '%poonam%'
  LIMIT 1;

  IF v_poonam_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient poonam not found';
  END IF;

  RAISE NOTICE '✓ Found poonam - Patient ID: %', v_poonam_patient_id;

  -- Get bank account IDs
  SELECT id INTO v_saraswat_bank_id
  FROM chart_of_accounts
  WHERE account_name = 'SARASWAT BANK'
    AND account_code = '1122'
  LIMIT 1;

  SELECT id INTO v_sbi_drm_id
  FROM chart_of_accounts
  WHERE account_name = 'STATE BANK OF INDIA (DRM)'
    AND account_code = '1121'
  LIMIT 1;

  SELECT id INTO v_cash_account_id
  FROM chart_of_accounts
  WHERE account_code = '1110'  -- Cash in Hand
  LIMIT 1;

  IF v_saraswat_bank_id IS NULL OR v_sbi_drm_id IS NULL OR v_cash_account_id IS NULL THEN
    RAISE EXCEPTION 'Required bank accounts not found';
  END IF;

  RAISE NOTICE '✓ Bank Accounts Found:';
  RAISE NOTICE '  - SARASWAT BANK: %', v_saraswat_bank_id;
  RAISE NOTICE '  - STATE BANK OF INDIA (DRM): %', v_sbi_drm_id;
  RAISE NOTICE '  - Cash in Hand: %', v_cash_account_id;
  RAISE NOTICE '';

  -- Get voucher type and income account
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_name = 'Receipt Voucher'
  LIMIT 1;

  SELECT id INTO v_income_account_id
  FROM chart_of_accounts
  WHERE account_group = 'INCOME'
    OR account_name ILIKE '%revenue%'
    OR account_name ILIKE '%income%'
  ORDER BY
    CASE WHEN account_name ILIKE '%patient%' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_voucher_type_id IS NULL OR v_income_account_id IS NULL THEN
    RAISE EXCEPTION 'Voucher type or income account not found';
  END IF;

  RAISE NOTICE '✓ Voucher Setup:';
  RAISE NOTICE '  - Voucher Type ID: %', v_voucher_type_id;
  RAISE NOTICE '  - Income Account ID: %', v_income_account_id;
  RAISE NOTICE '';

  -- ========================================================================
  -- STEP 1: Update missing bank_account_id values
  -- ========================================================================

  RAISE NOTICE '📝 STEP 1: Updating missing bank_account_id values...';
  RAISE NOTICE '';

  -- Check SARASWAT BANK narration or default to SARASWAT for ONLINE payments
  UPDATE advance_payment
  SET
    bank_account_id = CASE
      WHEN payment_mode = 'CASH' THEN v_cash_account_id
      WHEN remarks ILIKE '%SARASWAT%' OR remarks ILIKE '%saraswat%' THEN v_saraswat_bank_id
      WHEN remarks ILIKE '%STATE BANK%' OR remarks ILIKE '%SBI%' THEN v_sbi_drm_id
      -- Default to SARASWAT BANK for ONLINE payments without specific bank mention
      ELSE v_saraswat_bank_id
    END,
    bank_account_name = CASE
      WHEN payment_mode = 'CASH' THEN 'Cash in Hand'
      WHEN remarks ILIKE '%SARASWAT%' OR remarks ILIKE '%saraswat%' THEN 'SARASWAT BANK'
      WHEN remarks ILIKE '%STATE BANK%' OR remarks ILIKE '%SBI%' THEN 'STATE BANK OF INDIA (DRM)'
      ELSE 'SARASWAT BANK'
    END
  WHERE patient_id = v_poonam_patient_id
    AND payment_date::DATE = '2025-11-06'
    AND bank_account_id IS NULL
    AND status = 'ACTIVE';

  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;

  RAISE NOTICE '✅ Updated % advance payment records with bank_account_id', v_fixed_count;
  RAISE NOTICE '';

  -- ========================================================================
  -- STEP 2: Create vouchers for payments that don't have them yet
  -- ========================================================================

  RAISE NOTICE '📝 STEP 2: Creating vouchers for payments without vouchers...';
  RAISE NOTICE '';

  FOR v_payment IN
    SELECT
      ap.id as payment_id,
      ap.patient_id,
      ap.advance_amount,
      ap.payment_date,
      ap.payment_mode,
      ap.bank_account_id,
      ap.bank_account_name,
      ap.remarks,
      p.name as patient_name,
      p.patients_id as mrn_number
    FROM advance_payment ap
    INNER JOIN patients p ON ap.patient_id = p.id
    WHERE ap.patient_id = v_poonam_patient_id
      AND ap.payment_date::DATE = '2025-11-06'
      AND ap.bank_account_id IS NOT NULL
      AND ap.status = 'ACTIVE'
    ORDER BY ap.created_at
  LOOP
    -- Generate voucher number
    v_voucher_number := 'AP-' || TO_CHAR(v_payment.payment_date, 'YYYYMMDD') || '-' ||
                        SUBSTRING(v_payment.payment_id::TEXT FROM 1 FOR 8);

    -- Check if voucher already exists with this voucher_number
    SELECT EXISTS(
      SELECT 1 FROM vouchers WHERE voucher_number = v_voucher_number
    ) INTO v_voucher_exists;

    IF v_voucher_exists THEN
      RAISE NOTICE '  ⏭️  Skipping (voucher already exists): %', v_voucher_number;
      RAISE NOTICE '    - Patient: % (MRN: %)', v_payment.patient_name, v_payment.mrn_number;
      RAISE NOTICE '    - Amount: ₹%', v_payment.advance_amount;
      RAISE NOTICE '';
      CONTINUE;
    END IF;

    RAISE NOTICE '  Creating voucher for:';
    RAISE NOTICE '    - Patient: % (MRN: %)', v_payment.patient_name, v_payment.mrn_number;
    RAISE NOTICE '    - Amount: ₹%', v_payment.advance_amount;
    RAISE NOTICE '    - Mode: %', v_payment.payment_mode;
    RAISE NOTICE '    - Bank: %', v_payment.bank_account_name;

    -- Create voucher
    INSERT INTO vouchers (
      voucher_type_id,
      voucher_number,
      voucher_date,
      total_amount,
      narration,
      patient_id,
      reference_number,
      created_at,
      updated_at
    ) VALUES (
      v_voucher_type_id,
      v_voucher_number,
      v_payment.payment_date::DATE,
      v_payment.advance_amount,
      COALESCE(
        v_payment.remarks,
        'Being ' || LOWER(v_payment.payment_mode) || ' received towards ' ||
        v_payment.bank_account_name || ' from ' || v_payment.patient_name ||
        ' against R. No.: ' || v_payment.mrn_number
      ),
      v_payment.patient_id,
      v_payment.mrn_number,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_voucher_id;

    -- Create voucher entry 1: DEBIT Bank/Cash Account (Money IN)
    INSERT INTO voucher_entries (
      voucher_id,
      account_id,
      debit_amount,
      credit_amount,
      narration,
      created_at,
      updated_at
    ) VALUES (
      v_voucher_id,
      v_payment.bank_account_id,
      v_payment.advance_amount,
      0,
      'Receipt from ' || v_payment.patient_name,
      NOW(),
      NOW()
    );

    -- Create voucher entry 2: CREDIT Income Account (Revenue)
    INSERT INTO voucher_entries (
      voucher_id,
      account_id,
      debit_amount,
      credit_amount,
      narration,
      created_at,
      updated_at
    ) VALUES (
      v_voucher_id,
      v_income_account_id,
      0,
      v_payment.advance_amount,
      'Advance payment from ' || v_payment.patient_name,
      NOW(),
      NOW()
    );

    v_voucher_created_count := v_voucher_created_count + 1;
    RAISE NOTICE '    ✅ Voucher created: %', v_voucher_number;
    RAISE NOTICE '';
  END LOOP;

  -- ========================================================================
  -- Summary
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FIX COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Payments fixed (bank_account_id updated): %', v_fixed_count;
  RAISE NOTICE '  - New vouchers created: %', v_voucher_created_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Navigate to Ledger Statement';
  RAISE NOTICE '  3. Select SARASWAT BANK account';
  RAISE NOTICE '  4. All 5 poonam payments should now appear! 🎉';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
