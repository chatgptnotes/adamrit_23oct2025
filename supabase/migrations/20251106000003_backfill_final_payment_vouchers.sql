-- ============================================================================
-- Backfill Vouchers for Final Payments (ONLINE/Bank Payments)
-- Date: 2025-11-06
-- Purpose: Create missing vouchers for final payments that were ignored by old trigger
--
-- ISSUE: Old trigger (created June 17, 2025) only processed CASH payments
--        All ONLINE/UPI/NEFT/CARD final payments have NO vouchers
--        These payments don't appear in Ledger Statement
--
-- FIX: Retroactively create vouchers and voucher_entries for all orphaned final payments
-- ============================================================================

DO $$
DECLARE
  v_final_payment RECORD;
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_income_account_id UUID;
  v_voucher_type_id UUID;
  v_counter INT := 0;
  v_total_amount NUMERIC := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔄 Starting Backfill: Final Payment Vouchers';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Get Receipt voucher type ID
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_name = 'Receipt Voucher'
  LIMIT 1;

  IF v_voucher_type_id IS NULL THEN
    RAISE WARNING 'Receipt Voucher type not found. Creating it...';
    INSERT INTO voucher_types (voucher_type_name, voucher_category, description)
    VALUES ('Receipt Voucher', 'RECEIPT', 'Receipt voucher for payments received')
    RETURNING id INTO v_voucher_type_id;
  END IF;

  -- Get Income account ID (Patient Consultation / Revenue account)
  SELECT id INTO v_income_account_id
  FROM chart_of_accounts
  WHERE account_group = 'INCOME'
    OR account_name ILIKE '%revenue%'
    OR account_name ILIKE '%income%'
    OR account_name ILIKE '%consultation%'
  ORDER BY
    CASE
      WHEN account_name ILIKE '%patient%' THEN 1
      WHEN account_name ILIKE '%revenue%' THEN 2
      ELSE 3
    END
  LIMIT 1;

  IF v_income_account_id IS NULL THEN
    RAISE EXCEPTION 'No income account found in chart_of_accounts. Please create an income account first.';
  END IF;

  RAISE NOTICE '✓ Voucher Type ID: %', v_voucher_type_id;
  RAISE NOTICE '✓ Income Account ID: %', v_income_account_id;
  RAISE NOTICE '';

  -- Loop through all final payments that don't have vouchers
  FOR v_final_payment IN
    SELECT
      fp.id,
      fp.visit_id,
      fp.patient_id,
      fp.amount,
      fp.mode_of_payment,
      fp.payment_date,
      fp.payment_remark,
      fp.reason_of_discharge,
      fp.bank_account_id,
      fp.bank_account_name,
      fp.created_at,
      p.name as patient_name,
      p.patients_id as mrn
    FROM final_payments fp
    LEFT JOIN patients p ON fp.patient_id = p.id
    LEFT JOIN vouchers v ON (
      v.patient_id = fp.patient_id
      AND v.voucher_date = fp.payment_date
      AND v.narration ILIKE '%final%'
      AND ABS(EXTRACT(EPOCH FROM (v.created_at - fp.created_at))) < 60
    )
    WHERE
      -- No existing voucher found
      v.id IS NULL
      -- Only non-CASH payments (CASH payments were handled by old trigger)
      AND fp.mode_of_payment NOT IN ('CASH', 'Cash', 'cash')
      -- Has required fields
      AND fp.payment_date IS NOT NULL
      AND fp.patient_id IS NOT NULL
      AND fp.bank_account_id IS NOT NULL
      -- Payment date is after old trigger was created (June 17, 2025)
      AND fp.payment_date >= '2025-06-17'
    ORDER BY fp.payment_date, fp.created_at
  LOOP
    -- Generate unique voucher number
    v_voucher_number := 'FP-' || TO_CHAR(v_final_payment.payment_date, 'YYYYMMDD') || '-' ||
                        LPAD(v_final_payment.id::TEXT, 8, '0');

    -- Create voucher (created_by is NULL since it's a backfill)
    INSERT INTO vouchers (
      voucher_date,
      voucher_number,
      voucher_type_id,
      patient_id,
      reference_number,
      narration,
      created_at
    ) VALUES (
      v_final_payment.payment_date,
      v_voucher_number,
      v_voucher_type_id,
      v_final_payment.patient_id,
      v_final_payment.visit_id,
      COALESCE(
        v_final_payment.payment_remark,
        'Final bill payment - ' || v_final_payment.reason_of_discharge,
        'Final bill payment'
      ),
      v_final_payment.created_at -- Use original creation time
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
      v_final_payment.bank_account_id,
      v_final_payment.amount,
      0,
      'Final payment received via ' || v_final_payment.mode_of_payment ||
      ' from ' || COALESCE(v_final_payment.patient_name, 'Patient'),
      v_final_payment.created_at
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
      v_final_payment.amount,
      'Final bill revenue - ' || COALESCE(v_final_payment.patient_name, 'Patient') ||
      ' (MRN: ' || COALESCE(v_final_payment.mrn, 'N/A') || ')',
      v_final_payment.created_at
    );

    v_counter := v_counter + 1;
    v_total_amount := v_total_amount + v_final_payment.amount;

    RAISE NOTICE '✓ Created voucher for: % (%) - Rs % - Date: %',
      COALESCE(v_final_payment.patient_name, 'Unknown'),
      v_final_payment.mode_of_payment,
      v_final_payment.amount,
      v_final_payment.payment_date;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Backfill Complete!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • Vouchers Created: %', v_counter;
  RAISE NOTICE '  • Total Amount: Rs %', v_total_amount;
  RAISE NOTICE '';

  IF v_counter = 0 THEN
    RAISE NOTICE '✓ No orphaned final payments found - all payments have vouchers!';
  ELSE
    RAISE NOTICE '✓ All orphaned final payments now have vouchers';
    RAISE NOTICE '✓ These payments will now appear in Ledger Statement';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Open Ledger Statement';
  RAISE NOTICE '  3. Select bank account and date range';
  RAISE NOTICE '  4. Final payments should now be visible! 🎉';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
