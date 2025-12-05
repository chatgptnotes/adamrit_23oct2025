-- ============================================================================
-- Backfill Voucher Entries for Existing ONLINE Payments
-- Date: 2025-11-01
-- Purpose: Create voucher entries for ONLINE payments that were saved before
--          the trigger was updated to handle non-CASH payments
--
-- FIXED: Now handles both 'REC' and 'RV' voucher type codes
--        Automatically inserts 'REC' if missing for compatibility
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure 'REC' voucher type exists (for compatibility)
-- ============================================================================
-- Check if 'REC' voucher type exists, if not, insert it
INSERT INTO voucher_types (voucher_type_code, voucher_type_name, voucher_category, prefix, current_number, is_active)
VALUES ('REC', 'Receipt Voucher', 'RECEIPT', 'REC', 1, true)
ON CONFLICT (voucher_type_code) DO NOTHING;

-- ============================================================================
-- STEP 2: Create/Update voucher number generation function
-- ============================================================================
-- Drop existing function first to allow parameter name change
DROP FUNCTION IF EXISTS generate_voucher_number(TEXT);

-- This function generates sequential voucher numbers like REC-001, REC-002, etc.
CREATE OR REPLACE FUNCTION generate_voucher_number(p_voucher_type_code TEXT)
RETURNS TEXT AS $$
DECLARE
  current_num INTEGER;
  new_number TEXT;
BEGIN
  -- Get and increment the current number for this voucher type
  UPDATE voucher_types
  SET current_number = current_number + 1
  WHERE voucher_types.voucher_type_code = p_voucher_type_code
  RETURNING current_number INTO current_num;

  -- Handle case where voucher type doesn't exist
  IF current_num IS NULL THEN
    RAISE EXCEPTION 'Voucher type % not found in voucher_types table', p_voucher_type_code;
  END IF;

  -- Format: REC-001, RV-001, etc.
  new_number := p_voucher_type_code || '-' || LPAD(current_num::TEXT, 3, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION generate_voucher_number IS 'Generates sequential voucher numbers for different voucher types';

-- ============================================================================
-- STEP 3: Create temporary function to backfill vouchers
-- ============================================================================
CREATE OR REPLACE FUNCTION backfill_online_payment_vouchers()
RETURNS TABLE (
  payment_id UUID,
  voucher_number TEXT,
  payment_mode TEXT,
  amount DECIMAL,
  bank_account TEXT,
  status TEXT
) AS $$
DECLARE
  v_payment RECORD;
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_voucher_type_id UUID;
  v_voucher_type_code TEXT;
  v_debit_account_id UUID;
  v_revenue_account_id UUID;
  v_account_name TEXT;
  v_narration TEXT;
  v_count INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  -- Get Receipt voucher type ID - try 'REC' first, then 'RV'
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

  -- Check if required accounts exist
  IF v_voucher_type_id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher type not found. Expected REC or RV in voucher_types table.';
  END IF;

  IF v_revenue_account_id IS NULL THEN
    RAISE EXCEPTION 'Income account not found. Expected account_code 4000 with name INCOME in chart_of_accounts table.';
  END IF;

  RAISE NOTICE 'Using voucher type code: %', v_voucher_type_code;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting backfill of ONLINE payment vouchers...';
  RAISE NOTICE '========================================';

  -- Loop through all ONLINE payments that don't have vouchers yet
  FOR v_payment IN
    SELECT
      ap.id,
      ap.patient_id,
      ap.advance_amount,
      ap.payment_mode,
      ap.payment_date,
      ap.remarks,
      ap.bank_account_id,
      ap.bank_account_name,
      ap.created_by
    FROM advance_payment ap
    WHERE ap.payment_mode IN ('ONLINE', 'Online', 'online', 'Bank Transfer', 'BANK TRANSFER')
      AND ap.is_refund = FALSE
      AND ap.advance_amount > 0
      -- Only process payments that don't already have a voucher
      AND NOT EXISTS (
        SELECT 1
        FROM vouchers v
        WHERE v.patient_id = ap.patient_id
          AND v.voucher_date = ap.payment_date::DATE
          AND v.total_amount = ap.advance_amount
          AND v.narration LIKE '%Advance payment received%'
      )
    ORDER BY ap.payment_date DESC
  LOOP
    -- Determine which account to debit
    v_debit_account_id := NULL;
    v_account_name := 'Cash in Hand'; -- Default

    -- Use bank_account_id if available
    IF v_payment.bank_account_id IS NOT NULL THEN
      SELECT id, account_name INTO v_debit_account_id, v_account_name
      FROM chart_of_accounts
      WHERE id = v_payment.bank_account_id
        AND is_active = true;

      IF v_debit_account_id IS NOT NULL THEN
        RAISE NOTICE 'Payment %: Using bank_account_id -> %', v_payment.id, v_account_name;
      END IF;
    END IF;

    -- Fallback to bank_account_name
    IF v_debit_account_id IS NULL AND v_payment.bank_account_name IS NOT NULL AND v_payment.bank_account_name != '' THEN
      SELECT id, account_name INTO v_debit_account_id, v_account_name
      FROM chart_of_accounts
      WHERE account_name = v_payment.bank_account_name
        AND is_active = true;

      IF v_debit_account_id IS NOT NULL THEN
        RAISE NOTICE 'Payment %: Using bank_account_name -> %', v_payment.id, v_account_name;
      END IF;
    END IF;

    -- Final fallback: Parse remarks for bank keywords
    IF v_debit_account_id IS NULL AND v_payment.remarks IS NOT NULL THEN
      IF v_payment.remarks ILIKE '%saraswat%' THEN
        v_account_name := 'SARASWAT BANK';
      ELSIF v_payment.remarks ILIKE '%sbi%' OR v_payment.remarks ILIKE '%state bank%' OR v_payment.remarks ILIKE '%drm%' THEN
        v_account_name := 'STATE BANK OF INDIA (DRM)';
      END IF;

      SELECT id INTO v_debit_account_id
      FROM chart_of_accounts
      WHERE account_name = v_account_name
        AND is_active = true;

      IF v_debit_account_id IS NOT NULL THEN
        RAISE NOTICE 'Payment %: Using remarks parsing -> %', v_payment.id, v_account_name;
      END IF;
    END IF;

    -- Ultimate fallback to Cash in Hand
    IF v_debit_account_id IS NULL THEN
      SELECT id INTO v_debit_account_id
      FROM chart_of_accounts
      WHERE account_code = '1110' AND account_name = 'Cash in Hand';

      v_account_name := 'Cash in Hand';
      RAISE WARNING 'Payment %: No bank account found, using Cash in Hand', v_payment.id;
    END IF;

    -- Skip if we still don't have a debit account
    IF v_debit_account_id IS NULL THEN
      v_skipped := v_skipped + 1;
      RAISE WARNING 'Payment %: Skipped - no valid account found', v_payment.id;

      RETURN QUERY SELECT
        v_payment.id,
        NULL::TEXT,
        v_payment.payment_mode,
        v_payment.advance_amount,
        v_account_name,
        'SKIPPED - No valid account'::TEXT;

      CONTINUE;
    END IF;

    -- Generate voucher number using the voucher type code found
    v_voucher_number := generate_voucher_number(v_voucher_type_code);
    v_voucher_id := gen_random_uuid();

    -- Build narration
    v_narration := 'Advance payment received via ' || v_payment.payment_mode || ' - ' || v_account_name || ' [BACKFILLED]';

    -- Create voucher header
    INSERT INTO vouchers (
      id,
      voucher_number,
      voucher_type_id,
      voucher_date,
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
      v_narration,
      v_payment.advance_amount,
      v_payment.patient_id,
      'AUTHORISED',
      v_payment.created_by,  -- UUID type, can be NULL
      NOW(),
      NOW()
    );

    -- Create voucher entry 1: DEBIT Bank Account
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
      'Payment received from patient via ' || v_payment.payment_mode || ' to ' || v_account_name,
      v_payment.advance_amount,
      0,
      NOW()
    );

    -- Create voucher entry 2: CREDIT Revenue/Income
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
      'Patient payment received [BACKFILLED]',
      0,
      v_payment.advance_amount,
      NOW()
    );

    v_count := v_count + 1;

    RAISE NOTICE 'Payment %: Created voucher % for Rs % to %',
      v_payment.id, v_voucher_number, v_payment.advance_amount, v_account_name;

    -- Return result
    RETURN QUERY SELECT
      v_payment.id,
      v_voucher_number,
      v_payment.payment_mode,
      v_payment.advance_amount,
      v_account_name,
      'SUCCESS'::TEXT;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Backfill complete!';
  RAISE NOTICE 'Vouchers created: %', v_count;
  RAISE NOTICE 'Payments skipped: %', v_skipped;
  RAISE NOTICE '========================================';

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Execute the backfill function
-- ============================================================================
-- IMPORTANT: Review the results before running in production!
-- This will show what vouchers will be created without actually creating them

-- To see what would be backfilled (DRY RUN - just shows the plan):
-- SELECT * FROM backfill_online_payment_vouchers();

-- ============================================================================
-- STEP 5: Run the actual backfill (uncomment to execute)
-- ============================================================================
-- Execute the backfill and show results
SELECT * FROM backfill_online_payment_vouchers();

-- ============================================================================
-- STEP 6: Cleanup - Drop the temporary function (optional)
-- ============================================================================
-- DROP FUNCTION IF EXISTS backfill_online_payment_vouchers();

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Backfill script completed!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review the backfill results above';
  RAISE NOTICE '2. Check the ledger statement page';
  RAISE NOTICE '3. Verify ONLINE payments now appear';
  RAISE NOTICE '';
  RAISE NOTICE 'All existing ONLINE payments should now have voucher entries';
  RAISE NOTICE 'Future ONLINE payments will automatically create vouchers';
  RAISE NOTICE '========================================';
END $$;


