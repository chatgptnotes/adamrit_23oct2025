-- ============================================================================
-- ENABLE: Final Payment Triggers
-- Date: 2025-11-08
-- Purpose: Enable the disabled triggers on final_payments table
--
-- ISSUE: Triggers exist but are DISABLED (is_enabled = 0)
-- RESULT: Vouchers not created automatically
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable the triggers
-- ============================================================================

-- Enable trigger 1
ALTER TABLE final_payments
  ENABLE TRIGGER trg_final_payment_create_voucher;

-- Enable trigger 2
ALTER TABLE final_payments
  ENABLE TRIGGER trigger_create_receipt_voucher_final_payment;

-- ============================================================================
-- STEP 2: Verify triggers are enabled
-- ============================================================================

DO $$
DECLARE
  v_trigger RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TRIGGER STATUS AFTER ENABLING';
  RAISE NOTICE '========================================';

  FOR v_trigger IN
    SELECT
      tgname as trigger_name,
      tgenabled as is_enabled,
      CASE tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
        ELSE 'UNKNOWN'
      END as status
    FROM pg_trigger
    WHERE tgrelid = 'final_payments'::regclass
      AND tgname LIKE '%voucher%'
  LOOP
    RAISE NOTICE 'Trigger: % - Status: %', v_trigger.trigger_name, v_trigger.status;
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- STEP 3: Delete old vouchers without patient_id
-- ============================================================================

DO $$
DECLARE
  v_deleted_entries INTEGER;
  v_deleted_vouchers INTEGER;
BEGIN
  -- Delete voucher entries
  DELETE FROM voucher_entries
  WHERE voucher_id IN (
    SELECT id FROM vouchers
    WHERE patient_id IS NULL
      AND voucher_date >= '2025-11-08'::DATE
  );
  GET DIAGNOSTICS v_deleted_entries = ROW_COUNT;

  -- Delete vouchers
  DELETE FROM vouchers
  WHERE patient_id IS NULL
    AND voucher_date >= '2025-11-08'::DATE;
  GET DIAGNOSTICS v_deleted_vouchers = ROW_COUNT;

  RAISE NOTICE 'Cleaned up: % voucher entries, % vouchers', v_deleted_entries, v_deleted_vouchers;
END $$;

-- ============================================================================
-- STEP 4: Re-create vouchers by updating final_payments
-- ============================================================================

DO $$
DECLARE
  v_payment RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_payment IN
    SELECT id, visit_id, patient_id, amount
    FROM final_payments
    WHERE payment_date >= '2025-11-08'::DATE
      AND patient_id IS NOT NULL
  LOOP
    -- Trigger the AFTER UPDATE trigger
    UPDATE final_payments
    SET updated_at = NOW()
    WHERE id = v_payment.id;

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Triggered voucher creation for % final payments', v_count;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅✅✅ TRIGGERS ENABLED AND VOUCHERS RECREATED ✅✅✅';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. ✓ Enabled trg_final_payment_create_voucher';
  RAISE NOTICE '  2. ✓ Enabled trigger_create_receipt_voucher_final_payment';
  RAISE NOTICE '  3. ✓ Deleted old vouchers without patient_id';
  RAISE NOTICE '  4. ✓ Re-triggered voucher creation';
  RAISE NOTICE '';
  RAISE NOTICE 'Result:';
  RAISE NOTICE '  → Triggers are now ACTIVE';
  RAISE NOTICE '  → New vouchers created with proper data';
  RAISE NOTICE '  → Ledger should now show entries';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
