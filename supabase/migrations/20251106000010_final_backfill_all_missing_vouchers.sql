-- ============================================================================
-- FINAL BACKFILL: Create vouchers for ALL advance payments without vouchers
-- Date: 2025-11-06
-- Purpose: One-time cleanup after SECURITY DEFINER fix
--
-- WHAT THIS DOES:
--   - Finds ALL advance payments that don't have vouchers
--   - Creates vouchers and voucher_entries for each payment
--   - Handles CASH, ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, DD modes
--   - Skips payments that already have vouchers (idempotent)
--
-- RUN THIS AFTER: Migration 20251106000009_add_security_definer_to_advance_trigger.sql
-- ============================================================================

DO $$
DECLARE
  v_payment RECORD;
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_income_account_id UUID;
  v_voucher_type_id UUID;
  v_total_payments INT := 0;
  v_total_created INT := 0;
  v_total_skipped INT := 0;
  v_total_errors INT := 0;
  v_cash_account_id UUID;
  v_debit_account_id UUID;
  v_voucher_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔄 FINAL BACKFILL: Creating Missing Vouchers for ALL Patients';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Get Receipt voucher type ID
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_name = 'Receipt Voucher'
    OR voucher_type_code = 'REC'
  LIMIT 1;

  IF v_voucher_type_id IS NULL THEN
    RAISE EXCEPTION 'Receipt Voucher type not found';
  END IF;

  -- Get Income account ID
  SELECT id INTO v_income_account_id
  FROM chart_of_accounts
  WHERE account_code = '4000' AND account_name = 'INCOME'
  LIMIT 1;

  IF v_income_account_id IS NULL THEN
    -- Fallback to any INCOME account
    SELECT id INTO v_income_account_id
    FROM chart_of_accounts
    WHERE account_group = 'INCOME'
      OR account_name ILIKE '%revenue%'
      OR account_name ILIKE '%income%'
    ORDER BY
      CASE WHEN account_name ILIKE '%patient%' THEN 1 ELSE 2 END
    LIMIT 1;
  END IF;

  IF v_income_account_id IS NULL THEN
    RAISE EXCEPTION 'No income account found';
  END IF;

  -- Get Cash in Hand account ID
  SELECT id INTO v_cash_account_id
  FROM chart_of_accounts
  WHERE account_code = '1110'
  LIMIT 1;

  IF v_cash_account_id IS NULL THEN
    RAISE EXCEPTION 'Cash in Hand account not found';
  END IF;

  RAISE NOTICE '✓ Voucher Type ID: %', v_voucher_type_id;
  RAISE NOTICE '✓ Income Account ID: %', v_income_account_id;
  RAISE NOTICE '✓ Cash Account ID: %', v_cash_account_id;
  RAISE NOTICE '';

  -- Loop through ALL advance payments that don't have vouchers
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
      p.patients_id as mrn_number,
      p.hospital_name
    FROM advance_payment ap
    INNER JOIN patients p ON ap.patient_id = p.id
    WHERE ap.status = 'ACTIVE'
      AND ap.bank_account_id IS NOT NULL  -- Only process if bank account is set
      AND ap.advance_amount > 0
    ORDER BY ap.payment_date, ap.created_at
  LOOP
    v_total_payments := v_total_payments + 1;

    -- Generate voucher number
    v_voucher_number := 'AP-' || TO_CHAR(v_payment.payment_date, 'YYYYMMDD') || '-' ||
                        SUBSTRING(v_payment.payment_id::TEXT FROM 1 FOR 8);

    -- Check if voucher already exists
    SELECT EXISTS(
      SELECT 1 FROM vouchers WHERE voucher_number = v_voucher_number
    ) INTO v_voucher_exists;

    IF v_voucher_exists THEN
      v_total_skipped := v_total_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      -- Determine debit account based on payment mode
      IF UPPER(v_payment.payment_mode) = 'CASH' THEN
        v_debit_account_id := v_cash_account_id;
      ELSE
        v_debit_account_id := v_payment.bank_account_id;
      END IF;

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
          COALESCE(v_payment.bank_account_name, 'payment') || ' from ' ||
          v_payment.patient_name || ' against R. No.: ' || v_payment.mrn_number
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
        v_debit_account_id,
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

      v_total_created := v_total_created + 1;

      RAISE NOTICE '✓ Created voucher % for % (%) - Rs %',
        v_voucher_number,
        v_payment.patient_name,
        v_payment.mrn_number,
        v_payment.advance_amount;

    EXCEPTION
      WHEN OTHERS THEN
        v_total_errors := v_total_errors + 1;
        RAISE WARNING '✗ Failed to create voucher for payment % (Patient: %): %',
          v_payment.payment_id,
          v_payment.patient_name,
          SQLERRM;
    END;
  END LOOP;

  -- ========================================================================
  -- Summary
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FINAL BACKFILL COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • Total Payments Processed: %', v_total_payments;
  RAISE NOTICE '  • Vouchers Created: %', v_total_created;
  RAISE NOTICE '  • Already Existed (Skipped): %', v_total_skipped;
  RAISE NOTICE '  • Errors: %', v_total_errors;
  RAISE NOTICE '';
  IF v_total_created > 0 THEN
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Hard refresh browser (Ctrl+Shift+R)';
    RAISE NOTICE '  2. Navigate to Ledger Statement';
    RAISE NOTICE '  3. All payments should now appear in ledger!';
    RAISE NOTICE '';
  END IF;
  RAISE NOTICE '🎉 All future payments will now automatically create vouchers!';
  RAISE NOTICE '🎉 No more manual backfill queries needed!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
