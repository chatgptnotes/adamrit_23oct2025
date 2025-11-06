-- ============================================================================
-- Fix Zero Amount Vouchers with PENDING Status
-- Date: 2025-11-06
-- Purpose: Update vouchers that have 0.00 amount and PENDING status
--
-- ROOT CAUSE: Two backfill scripts omitted total_amount and status fields
--   - 20251106000003_backfill_final_payment_vouchers.sql
--   - 20251106000005_backfill_poonam_advance_vouchers.sql
--
-- ISSUE: Vouchers created with:
--   - total_amount = 0.00 (implicit default for DECIMAL)
--   - status = 'PENDING' (explicit DEFAULT in table)
--
-- FIX: Match vouchers with their source payments and update amounts
-- ============================================================================

DO $$
DECLARE
  v_updated_advance INT := 0;
  v_updated_final INT := 0;
  v_updated_entries_debit INT := 0;
  v_updated_entries_credit INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔧 Fixing Zero Amount Vouchers';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ========================================================================
  -- STEP 1: Fix vouchers from ADVANCE_PAYMENT table
  -- ========================================================================

  RAISE NOTICE '📝 STEP 1: Fixing vouchers from advance_payment...';
  RAISE NOTICE '';

  WITH matched_advances AS (
    SELECT DISTINCT ON (v.id)
      v.id as voucher_id,
      ap.advance_amount,
      'AUTHORISED' as new_status
    FROM vouchers v
    INNER JOIN advance_payment ap ON
      v.patient_id = ap.patient_id
      AND v.voucher_date = ap.payment_date::DATE
    WHERE v.total_amount = 0.00
      AND v.status = 'PENDING'
      AND ap.advance_amount > 0
      AND ap.status = 'ACTIVE'
      -- Match within 5 minutes of creation (to handle same-day multiple payments)
      AND ABS(EXTRACT(EPOCH FROM (v.created_at - ap.created_at))) < 300
    ORDER BY v.id, ABS(EXTRACT(EPOCH FROM (v.created_at - ap.created_at)))
  )
  UPDATE vouchers v
  SET
    total_amount = ma.advance_amount,
    status = ma.new_status,
    updated_at = NOW()
  FROM matched_advances ma
  WHERE v.id = ma.voucher_id;

  GET DIAGNOSTICS v_updated_advance = ROW_COUNT;

  RAISE NOTICE '✅ Updated % vouchers from advance_payment', v_updated_advance;

  -- ========================================================================
  -- STEP 2: Fix vouchers from FINAL_PAYMENTS table
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '📝 STEP 2: Fixing vouchers from final_payments...';
  RAISE NOTICE '';

  WITH matched_finals AS (
    SELECT DISTINCT ON (v.id)
      v.id as voucher_id,
      fp.amount,
      'AUTHORISED' as new_status
    FROM vouchers v
    INNER JOIN final_payments fp ON
      v.patient_id = fp.patient_id
      AND v.voucher_date = fp.payment_date
    WHERE v.total_amount = 0.00
      AND v.status = 'PENDING'
      AND fp.amount > 0
      -- Match within 5 minutes of creation
      AND ABS(EXTRACT(EPOCH FROM (v.created_at - fp.created_at))) < 300
    ORDER BY v.id, ABS(EXTRACT(EPOCH FROM (v.created_at - fp.created_at)))
  )
  UPDATE vouchers v
  SET
    total_amount = mf.amount,
    status = mf.new_status,
    updated_at = NOW()
  FROM matched_finals mf
  WHERE v.id = mf.voucher_id;

  GET DIAGNOSTICS v_updated_final = ROW_COUNT;

  RAISE NOTICE '✅ Updated % vouchers from final_payments', v_updated_final;

  -- ========================================================================
  -- STEP 3: Fix voucher_entries DEBIT amounts
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '📝 STEP 3: Fixing voucher_entries DEBIT amounts...';
  RAISE NOTICE '';

  UPDATE voucher_entries ve
  SET
    debit_amount = v.total_amount
  FROM vouchers v
  WHERE ve.voucher_id = v.id
    AND ve.debit_amount = 0
    AND ve.credit_amount = 0
    AND v.total_amount > 0;

  GET DIAGNOSTICS v_updated_entries_debit = ROW_COUNT;

  RAISE NOTICE '✅ Updated % voucher_entries (DEBIT)', v_updated_entries_debit;

  -- ========================================================================
  -- STEP 4: Fix voucher_entries CREDIT amounts
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '📝 STEP 4: Fixing voucher_entries CREDIT amounts...';
  RAISE NOTICE '';

  UPDATE voucher_entries ve
  SET
    credit_amount = v.total_amount
  FROM vouchers v
  WHERE ve.voucher_id = v.id
    AND ve.credit_amount = 0
    AND ve.debit_amount = 0
    AND v.total_amount > 0;

  GET DIAGNOSTICS v_updated_entries_credit = ROW_COUNT;

  RAISE NOTICE '✅ Updated % voucher_entries (CREDIT)', v_updated_entries_credit;

  -- ========================================================================
  -- STEP 5: Verify no zero amount vouchers remain
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '📝 STEP 5: Verifying fixes...';
  RAISE NOTICE '';

  DECLARE
    v_remaining_zero INT;
  BEGIN
    SELECT COUNT(*) INTO v_remaining_zero
    FROM vouchers
    WHERE total_amount = 0.00
      AND status = 'PENDING';

    IF v_remaining_zero > 0 THEN
      RAISE WARNING '⚠️  Still have % vouchers with zero amount', v_remaining_zero;
      RAISE NOTICE 'These may need manual review (check if they are valid zero-amount vouchers)';
    ELSE
      RAISE NOTICE '✅ No zero amount vouchers remaining';
    END IF;
  END;

  -- ========================================================================
  -- Summary
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ ZERO AMOUNT VOUCHERS FIXED!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  • Vouchers fixed from advance_payment: %', v_updated_advance;
  RAISE NOTICE '  • Vouchers fixed from final_payments: %', v_updated_final;
  RAISE NOTICE '  • Voucher entries DEBIT updated: %', v_updated_entries_debit;
  RAISE NOTICE '  • Voucher entries CREDIT updated: %', v_updated_entries_credit;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Navigate to Ledger Statement';
  RAISE NOTICE '  3. All amounts should now show correctly!';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
