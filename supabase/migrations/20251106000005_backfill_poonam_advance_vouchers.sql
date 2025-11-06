-- ============================================================================
-- Backfill Vouchers for poonam's Advance Payments
-- Date: 2025-11-06
-- Purpose: Create missing vouchers for poonam's 5 advance payments
--
-- ISSUE: poonam has 5 advance payments but NO vouchers created
--        Trigger didn't fire when payments were saved
--        Result: Payments don't appear in ledger statement
--
-- FIX: Manually create vouchers and voucher_entries for poonam
-- ============================================================================

DO $$
DECLARE
  v_advance_payment RECORD;
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_income_account_id UUID;
  v_voucher_type_id UUID;
  v_counter INT := 0;
  v_total_amount NUMERIC := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔄 Backfilling: poonam Advance Payment Vouchers';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Get Receipt voucher type ID
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_name = 'Receipt Voucher'
  LIMIT 1;

  IF v_voucher_type_id IS NULL THEN
    RAISE EXCEPTION 'Receipt Voucher type not found';
  END IF;

  -- Get Income account ID
  SELECT id INTO v_income_account_id
  FROM chart_of_accounts
  WHERE account_group = 'INCOME'
    OR account_name ILIKE '%revenue%'
    OR account_name ILIKE '%income%'
  ORDER BY
    CASE WHEN account_name ILIKE '%patient%' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_income_account_id IS NULL THEN
    RAISE EXCEPTION 'No income account found';
  END IF;

  RAISE NOTICE '✓ Voucher Type ID: %', v_voucher_type_id;
  RAISE NOTICE '✓ Income Account ID: %', v_income_account_id;
  RAISE NOTICE '';

  -- Loop through poonam's advance payments that don't have vouchers
  FOR v_advance_payment IN
    SELECT
      ap.id,
      ap.patient_id,
      ap.patient_name,
      ap.advance_amount,
      ap.payment_date,
      ap.payment_mode,
      ap.bank_account_id,
      ap.bank_account_name,
      ap.remarks,
      ap.created_at,
      p.patients_id as mrn
    FROM advance_payment ap
    INNER JOIN patients p ON ap.patient_id = p.id
    LEFT JOIN vouchers v ON (
      v.patient_id = ap.patient_id
      AND v.voucher_date = DATE(ap.payment_date)
      AND v.narration ILIKE '%advance%'
      AND ABS(EXTRACT(EPOCH FROM (v.created_at - ap.created_at))) < 60
    )
    WHERE
      p.name ILIKE '%poonam%'
      AND v.id IS NULL  -- No voucher exists
      AND ap.bank_account_id IS NOT NULL
      AND ap.status = 'ACTIVE'
    ORDER BY ap.payment_date, ap.created_at
  LOOP
    -- Generate unique voucher number
    v_voucher_number := 'AP-' || TO_CHAR(v_advance_payment.payment_date, 'YYYYMMDD') || '-' ||
                        SUBSTRING(v_advance_payment.id::TEXT, 1, 8);

    -- Create voucher
    INSERT INTO vouchers (
      voucher_date,
      voucher_number,
      voucher_type_id,
      patient_id,
      narration,
      created_at
    ) VALUES (
      DATE(v_advance_payment.payment_date),
      v_voucher_number,
      v_voucher_type_id,
      v_advance_payment.patient_id,
      COALESCE(
        v_advance_payment.remarks,
        'Advance payment received via ' || v_advance_payment.payment_mode
      ),
      v_advance_payment.created_at
    )
    RETURNING id INTO v_voucher_id;

    -- Create DEBIT entry (Bank Account)
    INSERT INTO voucher_entries (
      voucher_id,
      account_id,
      debit_amount,
      credit_amount,
      narration,
      created_at
    ) VALUES (
      v_voucher_id,
      v_advance_payment.bank_account_id,
      v_advance_payment.advance_amount,
      0,
      'Advance payment received via ' || v_advance_payment.payment_mode ||
      ' from ' || v_advance_payment.patient_name,
      v_advance_payment.created_at
    );

    -- Create CREDIT entry (Income Account)
    INSERT INTO voucher_entries (
      voucher_id,
      account_id,
      debit_amount,
      credit_amount,
      narration,
      created_at
    ) VALUES (
      v_voucher_id,
      v_income_account_id,
      0,
      v_advance_payment.advance_amount,
      'Advance payment revenue - ' || v_advance_payment.patient_name ||
      ' (MRN: ' || COALESCE(v_advance_payment.mrn, 'N/A') || ')',
      v_advance_payment.created_at
    );

    v_counter := v_counter + 1;
    v_total_amount := v_total_amount + v_advance_payment.advance_amount;

    RAISE NOTICE '✓ Created voucher % for: % - Rs % (Date: %)',
      v_voucher_number,
      v_advance_payment.patient_name,
      v_advance_payment.advance_amount,
      v_advance_payment.payment_date;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ poonam Backfill Complete!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • Vouchers Created: %', v_counter;
  RAISE NOTICE '  • Total Amount: Rs %', v_total_amount;
  RAISE NOTICE '';

  IF v_counter = 0 THEN
    RAISE NOTICE '✓ No missing vouchers - all poonam payments already have vouchers!';
  ELSE
    RAISE NOTICE '✓ poonam advance payments now have vouchers';
    RAISE NOTICE '✓ These payments will now appear in Ledger Statement! 🎉';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Open Ledger Statement';
  RAISE NOTICE '  3. Select bank account and date: 06-11-2025';
  RAISE NOTICE '  4. poonam payments should now be visible!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
