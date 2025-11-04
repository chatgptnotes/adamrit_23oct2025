-- ============================================================================
-- Backfill Voucher Entries for ALL Existing Advance Payments
-- Date: 2025-11-04
-- Purpose: Create voucher entries for advance payments that were saved
--          before the trigger was fully functional
--
-- Handles: CASH, ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, DD
-- Skips: CREDIT (not a real payment), payments already with vouchers
-- ============================================================================

-- ============================================================================
-- STEP 1: Create comprehensive backfill function
-- ============================================================================
CREATE OR REPLACE FUNCTION backfill_all_advance_payment_vouchers()
RETURNS TABLE (
  payment_id UUID,
  payment_date DATE,
  payment_mode TEXT,
  amount DECIMAL,
  debit_account TEXT,
  voucher_number TEXT,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_payment RECORD;
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_voucher_type_id UUID;
  v_voucher_type_code TEXT;
  v_debit_account_id UUID;
  v_revenue_account_id UUID;
  v_debit_account_name TEXT;
  v_narration TEXT;
  v_count INTEGER := 0;
  v_skipped INTEGER := 0;
  v_error_count INTEGER := 0;
BEGIN
  -- ============================================================================
  -- Setup: Get required account IDs
  -- ============================================================================

  -- Get Receipt voucher type ID
  SELECT id, voucher_type_code INTO v_voucher_type_id, v_voucher_type_code
  FROM voucher_types
  WHERE voucher_type_code IN ('REC', 'RV')
    AND voucher_category = 'RECEIPT'
    AND is_active = true
  ORDER BY CASE WHEN voucher_type_code = 'REC' THEN 1 ELSE 2 END
  LIMIT 1;

  -- Get Income account ID
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '4000' AND account_name = 'INCOME';

  -- Verify required accounts exist
  IF v_voucher_type_id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher type not found. Expected REC or RV in voucher_types table.';
  END IF;

  IF v_revenue_account_id IS NULL THEN
    RAISE EXCEPTION 'Income account not found. Expected account_code 4000 with name INCOME in chart_of_accounts table.';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Starting backfill of advance payment vouchers...';
  RAISE NOTICE 'Using voucher type code: %', v_voucher_type_code;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ============================================================================
  -- Main Loop: Process all payments without vouchers
  -- ============================================================================
  FOR v_payment IN
    SELECT
      ap.id,
      ap.patient_id,
      ap.advance_amount,
      ap.payment_mode,
      ap.payment_date,
      ap.remarks,
      ap.reference_number,
      ap.bank_account_id,
      ap.bank_account_name,
      ap.created_by
    FROM advance_payment ap
    WHERE ap.is_refund = FALSE
      AND ap.advance_amount > 0
      AND UPPER(TRIM(ap.payment_mode)) != 'CREDIT'  -- Skip CREDIT (not real payment)
      -- Only process payments that don't already have a voucher
      AND NOT EXISTS (
        SELECT 1
        FROM vouchers v
        INNER JOIN voucher_entries ve ON ve.voucher_id = v.id
        WHERE v.patient_id = ap.patient_id
          AND v.voucher_date = ap.payment_date::DATE
          AND v.total_amount = ap.advance_amount
          AND (v.narration LIKE '%Advance%' OR ve.narration LIKE '%Advance%')
      )
    ORDER BY ap.payment_date DESC, ap.created_at DESC
  LOOP
    BEGIN
      -- ============================================================================
      -- Determine debit account based on payment mode
      -- ============================================================================
      v_debit_account_id := NULL;
      v_debit_account_name := NULL;

      IF UPPER(TRIM(v_payment.payment_mode)) = 'CASH' THEN
        -- CASH payments → Cash in Hand
        SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
        FROM chart_of_accounts
        WHERE account_code = '1110' AND account_name = 'Cash in Hand'
          AND is_active = true;

        IF v_debit_account_id IS NULL THEN
          RETURN QUERY SELECT
            v_payment.id,
            v_payment.payment_date::DATE,
            v_payment.payment_mode::TEXT,
            v_payment.advance_amount,
            'Cash in Hand'::TEXT,
            NULL::TEXT,
            'ERROR'::TEXT,
            'Cash in Hand account (1110) not found in chart_of_accounts'::TEXT;
          v_error_count := v_error_count + 1;
          CONTINUE;
        END IF;

      ELSIF UPPER(TRIM(v_payment.payment_mode)) IN ('ONLINE', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'DD', 'BANK TRANSFER') THEN
        -- Bank-based payments → Use bank_account_id if available
        IF v_payment.bank_account_id IS NOT NULL THEN
          SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
          FROM chart_of_accounts
          WHERE id = v_payment.bank_account_id
            AND is_active = true;
        END IF;

        -- Fallback: Try to match by bank_account_name
        IF v_debit_account_id IS NULL AND v_payment.bank_account_name IS NOT NULL AND v_payment.bank_account_name != '' THEN
          SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
          FROM chart_of_accounts
          WHERE account_name = v_payment.bank_account_name
            AND is_active = true;
        END IF;

        -- Fallback: Parse remarks for bank keywords
        IF v_debit_account_id IS NULL AND v_payment.remarks IS NOT NULL THEN
          IF v_payment.remarks ILIKE '%saraswat%' THEN
            SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
            FROM chart_of_accounts
            WHERE account_name ILIKE '%saraswat%'
              AND account_type = 'CURRENT_ASSETS'
              AND is_active = true
            LIMIT 1;
          ELSIF v_payment.remarks ILIKE '%sbi%' OR v_payment.remarks ILIKE '%state bank%' OR v_payment.remarks ILIKE '%drm%' THEN
            SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
            FROM chart_of_accounts
            WHERE account_name ILIKE '%state bank%'
              AND account_type = 'CURRENT_ASSETS'
              AND is_active = true
            LIMIT 1;
          ELSIF v_payment.remarks ILIKE '%canara%' THEN
            SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
            FROM chart_of_accounts
            WHERE account_name ILIKE '%canara%'
              AND account_type = 'CURRENT_ASSETS'
              AND is_active = true
            LIMIT 1;
          END IF;
        END IF;

        -- Ultimate fallback: Find any active bank account
        IF v_debit_account_id IS NULL THEN
          SELECT id, account_name INTO v_debit_account_id, v_debit_account_name
          FROM chart_of_accounts
          WHERE account_type = 'CURRENT_ASSETS'
            AND (account_name ILIKE '%bank%' OR account_code LIKE '11%')
            AND is_active = true
          ORDER BY account_code
          LIMIT 1;
        END IF;

        -- If still no account found, skip this payment
        IF v_debit_account_id IS NULL THEN
          RETURN QUERY SELECT
            v_payment.id,
            v_payment.payment_date::DATE,
            v_payment.payment_mode::TEXT,
            v_payment.advance_amount,
            COALESCE(v_payment.bank_account_name, 'Unknown')::TEXT,
            NULL::TEXT,
            'SKIPPED'::TEXT,
            'No valid bank account found. Please manually create voucher.'::TEXT;
          v_skipped := v_skipped + 1;
          CONTINUE;
        END IF;

      ELSE
        -- Unknown payment mode
        RETURN QUERY SELECT
          v_payment.id,
          v_payment.payment_date::DATE,
          v_payment.payment_mode::TEXT,
          v_payment.advance_amount,
          'N/A'::TEXT,
          NULL::TEXT,
          'SKIPPED'::TEXT,
          ('Unknown payment mode: ' || v_payment.payment_mode)::TEXT;
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;

      -- ============================================================================
      -- Create voucher and entries
      -- ============================================================================

      -- Generate voucher number
      v_voucher_number := generate_voucher_number(v_voucher_type_code);
      v_voucher_id := gen_random_uuid();

      -- Build narration
      v_narration := 'Advance payment received via ' || v_payment.payment_mode;
      IF v_debit_account_name IS NOT NULL AND v_debit_account_name != '' THEN
        v_narration := v_narration || ' - ' || v_debit_account_name;
      END IF;
      v_narration := v_narration || ' [BACKFILLED]';

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
        v_payment.payment_date::DATE,
        v_payment.reference_number,
        v_narration,
        v_payment.advance_amount,
        v_payment.patient_id,
        'AUTHORISED',
        v_payment.created_by,  -- Allow NULL for backfilled records
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
        'Payment received from patient via ' || v_payment.payment_mode || ' to ' || v_debit_account_name,
        v_payment.advance_amount,
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
        'Patient advance payment received [BACKFILLED]',
        0,
        v_payment.advance_amount,
        NOW()
      );

      v_count := v_count + 1;

      RAISE NOTICE '[%] Created voucher % for % payment of Rs % to %',
        v_count, v_voucher_number, v_payment.payment_mode, v_payment.advance_amount, v_debit_account_name;

      -- Return success result
      RETURN QUERY SELECT
        v_payment.id,
        v_payment.payment_date::DATE,
        v_payment.payment_mode::TEXT,
        v_payment.advance_amount,
        v_debit_account_name,
        v_voucher_number,
        'SUCCESS'::TEXT,
        'Voucher created successfully'::TEXT;

    EXCEPTION
      WHEN OTHERS THEN
        -- Handle any errors that occur during processing
        v_error_count := v_error_count + 1;
        RAISE WARNING 'Error processing payment %: %', v_payment.id, SQLERRM;

        RETURN QUERY SELECT
          v_payment.id,
          v_payment.payment_date::DATE,
          v_payment.payment_mode::TEXT,
          v_payment.advance_amount,
          COALESCE(v_debit_account_name, 'N/A')::TEXT,
          NULL::TEXT,
          'ERROR'::TEXT,
          SQLERRM::TEXT;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Backfill complete!';
  RAISE NOTICE '  ✓ Vouchers created: %', v_count;
  RAISE NOTICE '  ⊘ Payments skipped: %', v_skipped;
  RAISE NOTICE '  ✗ Errors: %', v_error_count;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION backfill_all_advance_payment_vouchers() IS
'Backfills voucher entries for all advance payments without vouchers. Handles CASH, ONLINE, UPI, NEFT, RTGS, CHEQUE, CARD, and DD payment modes.';

-- ============================================================================
-- STEP 2: Execute the backfill function
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔧 EXECUTING BACKFILL FOR ALL ADVANCE PAYMENTS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Run the backfill and show results
SELECT * FROM backfill_all_advance_payment_vouchers();

-- ============================================================================
-- STEP 3: Verify results
-- ============================================================================
DO $$
DECLARE
  v_payments_without_vouchers INTEGER;
BEGIN
  -- Count remaining payments without vouchers
  SELECT COUNT(*)
  INTO v_payments_without_vouchers
  FROM advance_payment ap
  WHERE ap.is_refund = FALSE
    AND ap.advance_amount > 0
    AND UPPER(TRIM(ap.payment_mode)) != 'CREDIT'
    AND NOT EXISTS (
      SELECT 1
      FROM vouchers v
      INNER JOIN voucher_entries ve ON ve.voucher_id = v.id
      WHERE v.patient_id = ap.patient_id
        AND v.voucher_date = ap.payment_date::DATE
        AND v.total_amount = ap.advance_amount
        AND (v.narration LIKE '%Advance%' OR ve.narration LIKE '%Advance%')
    );

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '📊 VERIFICATION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining advance payments without vouchers: %', v_payments_without_vouchers;
  RAISE NOTICE '';

  IF v_payments_without_vouchers = 0 THEN
    RAISE NOTICE '✅ SUCCESS! All advance payments now have vouchers.';
  ELSE
    RAISE NOTICE '⚠️  WARNING: % payments still without vouchers.', v_payments_without_vouchers;
    RAISE NOTICE '   These may need manual intervention.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review the results above';
  RAISE NOTICE '  2. Check ledger statement page';
  RAISE NOTICE '  3. Verify all payments appear correctly';
  RAISE NOTICE '  4. Apply the updated trigger migration (20251104000001)';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- STEP 4: Optional cleanup (comment out if you want to keep the function)
-- ============================================================================
-- DROP FUNCTION IF EXISTS backfill_all_advance_payment_vouchers();
