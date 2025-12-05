-- ============================================================================
-- SARASWAT BANK LEDGER - COMPLETE SOLUTION
-- Date: 2025-11-01
-- Purpose: Ek hi file mein sab kuch - functions, triggers, aur vouchers
-- ============================================================================

-- ============================================================================
-- STEP 1: Purane Functions Drop Karo (Clean Slate)
-- ============================================================================
DROP FUNCTION IF EXISTS get_ledger_statement_with_patients(TEXT, DATE, DATE, TEXT);
DROP FUNCTION IF EXISTS get_ledger_statement_with_patients(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS generate_voucher_number(TEXT);

-- ============================================================================
-- STEP 2: Ledger Statement Function Banao (TEXT dates ke saath)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_ledger_statement_with_patients(
  p_account_name TEXT,
  p_from_date TEXT,  -- Frontend se string aata hai: "2025-11-01"
  p_to_date TEXT,
  p_mrn_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  voucher_date DATE,
  voucher_number TEXT,
  voucher_type TEXT,
  narration TEXT,
  patient_name TEXT,
  mrn_number TEXT,
  patient_id UUID,
  visit_id TEXT,
  visit_type TEXT,
  patient_type TEXT,
  payment_type TEXT,
  debit_amount DECIMAL,
  credit_amount DECIMAL,
  payment_mode TEXT,
  remarks TEXT,
  is_refund BOOLEAN,
  bank_account TEXT,
  account_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.voucher_date,
    v.voucher_number::TEXT,
    vt.voucher_type_name::TEXT as voucher_type,
    v.narration::TEXT,

    -- Patient Details
    COALESCE(p.name::TEXT, 'Unknown') as patient_name,
    COALESCE(p.patients_id::TEXT, '') as mrn_number,
    v.patient_id,

    -- Visit Details
    COALESCE(vis.visit_id::TEXT, '') as visit_id,
    COALESCE(vis.visit_type::TEXT, '') as visit_type,
    COALESCE(vis.patient_type::TEXT, '') as patient_type,

    -- Payment Type Classification
    CASE
      WHEN ap.id IS NOT NULL AND ap.is_refund = FALSE THEN 'ADVANCE_PAYMENT'
      WHEN ap.id IS NOT NULL AND ap.is_refund = TRUE THEN 'ADVANCE_REFUND'
      WHEN fp.id IS NOT NULL THEN 'FINAL_PAYMENT'
      ELSE 'OTHER'
    END as payment_type,

    -- Amount Details
    ve.debit_amount,
    ve.credit_amount,

    -- Payment Mode and Remarks
    COALESCE(ap.payment_mode::TEXT, fp.mode_of_payment::TEXT, '') as payment_mode,
    COALESCE(ap.remarks::TEXT, fp.payment_remark::TEXT, '') as remarks,
    COALESCE(ap.is_refund, FALSE) as is_refund,

    -- Bank Account Info
    coa.account_name::TEXT as bank_account,
    coa.account_code::TEXT

  FROM voucher_entries ve

  -- Join vouchers table
  INNER JOIN vouchers v ON ve.voucher_id = v.id

  -- Join chart of accounts to filter by bank
  INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id

  -- Join voucher types
  LEFT JOIN voucher_types vt ON v.voucher_type_id = vt.id

  -- Join patients table
  LEFT JOIN patients p ON v.patient_id = p.id

  -- Join visits table
  LEFT JOIN visits vis ON vis.patient_id = v.patient_id

  -- Join advance_payment to identify advance payments
  LEFT JOIN advance_payment ap ON (
    ap.patient_id = v.patient_id
    AND DATE(ap.payment_date) = v.voucher_date
    AND ap.advance_amount = GREATEST(ve.debit_amount, ve.credit_amount)
  )

  -- Join final_payments to identify final payments
  LEFT JOIN final_payments fp ON (
    fp.visit_id = vis.visit_id
    AND DATE(fp.created_at) = v.voucher_date
    AND fp.amount = GREATEST(ve.debit_amount, ve.credit_amount)
  )

  -- Filters
  WHERE coa.account_name = p_account_name
    AND v.voucher_date BETWEEN p_from_date::DATE AND p_to_date::DATE
    AND v.status = 'AUTHORISED'
    AND (p_mrn_filter IS NULL OR p.patients_id ILIKE '%' || p_mrn_filter || '%')

  ORDER BY v.voucher_date DESC, v.voucher_number DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_ledger_statement_with_patients IS
'Bank ledger statement with patient details - accepts TEXT dates from frontend';

GRANT EXECUTE ON FUNCTION get_ledger_statement_with_patients TO authenticated;

-- ============================================================================
-- STEP 3: Voucher Number Generator Function Banao
-- ============================================================================
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

  -- Format: REC-001, REC-002, etc.
  new_number := p_voucher_type_code || '-' || LPAD(current_num::TEXT, 3, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_voucher_number IS
'Generates sequential voucher numbers like REC-001, REC-002';

-- ============================================================================
-- STEP 4: 'REC' Voucher Type Ensure Karo
-- ============================================================================
INSERT INTO voucher_types (
  voucher_type_code,
  voucher_type_name,
  voucher_category,
  prefix,
  current_number,
  is_active
)
VALUES ('REC', 'Receipt Voucher', 'RECEIPT', 'REC', 1, true)
ON CONFLICT (voucher_type_code) DO NOTHING;

-- ============================================================================
-- STEP 5: Purane ONLINE Payments Ke Liye Vouchers Banao
-- ============================================================================
DO $$
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

  -- Validation
  IF v_voucher_type_id IS NULL THEN
    RAISE EXCEPTION 'Receipt voucher type not found. Expected REC or RV.';
  END IF;

  IF v_revenue_account_id IS NULL THEN
    RAISE EXCEPTION 'Income account not found. Expected account_code 4000.';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SARASWAT BANK Voucher Backfill Started...';
  RAISE NOTICE 'Using voucher type: %', v_voucher_type_code;
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
        RAISE NOTICE 'Payment %: Using bank_account_id -> %',
          SUBSTRING(v_payment.id::TEXT, 1, 8), v_account_name;
      END IF;
    END IF;

    -- Fallback to bank_account_name
    IF v_debit_account_id IS NULL AND v_payment.bank_account_name IS NOT NULL THEN
      SELECT id, account_name INTO v_debit_account_id, v_account_name
      FROM chart_of_accounts
      WHERE account_name = v_payment.bank_account_name
        AND is_active = true;

      IF v_debit_account_id IS NOT NULL THEN
        RAISE NOTICE 'Payment %: Using bank_account_name -> %',
          SUBSTRING(v_payment.id::TEXT, 1, 8), v_account_name;
      END IF;
    END IF;

    -- Final fallback: Parse remarks for bank keywords
    IF v_debit_account_id IS NULL AND v_payment.remarks IS NOT NULL THEN
      IF v_payment.remarks ILIKE '%saraswat%' THEN
        v_account_name := 'SARASWAT BANK';
      ELSIF v_payment.remarks ILIKE '%sbi%' OR v_payment.remarks ILIKE '%state bank%' THEN
        v_account_name := 'STATE BANK OF INDIA (DRM)';
      END IF;

      SELECT id INTO v_debit_account_id
      FROM chart_of_accounts
      WHERE account_name = v_account_name
        AND is_active = true;

      IF v_debit_account_id IS NOT NULL THEN
        RAISE NOTICE 'Payment %: Using remarks parsing -> %',
          SUBSTRING(v_payment.id::TEXT, 1, 8), v_account_name;
      END IF;
    END IF;

    -- Ultimate fallback to Cash in Hand
    IF v_debit_account_id IS NULL THEN
      SELECT id INTO v_debit_account_id
      FROM chart_of_accounts
      WHERE account_code = '1110' AND account_name = 'Cash in Hand';

      v_account_name := 'Cash in Hand';
      RAISE WARNING 'Payment %: No bank account found, using Cash in Hand',
        SUBSTRING(v_payment.id::TEXT, 1, 8);
    END IF;

    -- Skip if we still don't have a debit account
    IF v_debit_account_id IS NULL THEN
      v_skipped := v_skipped + 1;
      RAISE WARNING 'Payment %: SKIPPED - no valid account found',
        SUBSTRING(v_payment.id::TEXT, 1, 8);
      CONTINUE;
    END IF;

    -- Generate voucher number
    v_voucher_number := generate_voucher_number(v_voucher_type_code);
    v_voucher_id := gen_random_uuid();

    -- Build narration
    v_narration := 'Advance payment received via ' || v_payment.payment_mode ||
                   ' - ' || v_account_name || ' [BACKFILLED]';

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
      v_payment.created_by,  -- UUID type
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
      'Payment received via ' || v_payment.payment_mode || ' to ' || v_account_name,
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

    RAISE NOTICE 'Voucher %: Created for Rs % to % (Payment: %)',
      v_voucher_number,
      v_payment.advance_amount,
      v_account_name,
      SUBSTRING(v_payment.id::TEXT, 1, 8);

  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Backfill Complete!';
  RAISE NOTICE 'Vouchers created: %', v_count;
  RAISE NOTICE 'Payments skipped: %', v_skipped;
  RAISE NOTICE '========================================';

  IF v_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'SUCCESS! % vouchers created for ONLINE payments', v_count;
    RAISE NOTICE 'Now test the ledger statement page!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE 'No new vouchers created (may already exist)';
  END IF;

END $$;

-- ============================================================================
-- STEP 6: Verification Query (Check karo kya bana)
-- ============================================================================
SELECT
  'Total SARASWAT BANK Payments' as check_type,
  COUNT(*) as count,
  SUM(advance_amount) as total_amount
FROM advance_payment
WHERE bank_account_name = 'SARASWAT BANK'
  AND payment_mode IN ('ONLINE', 'Online', 'online', 'Bank Transfer', 'BANK TRANSFER')
  AND is_refund = FALSE;

SELECT
  'Total Vouchers for SARASWAT BANK' as check_type,
  COUNT(*) as voucher_count,
  SUM(v.total_amount) as total_amount
FROM vouchers v
JOIN voucher_entries ve ON ve.voucher_id = v.id
JOIN chart_of_accounts ca ON ca.id = ve.account_id
WHERE ca.account_name = 'SARASWAT BANK'
  AND v.voucher_date >= '2025-10-27';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ COMPLETE! Sab kuch ready hai!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Ab kya karna hai:';
  RAISE NOTICE '1. Ledger Statement page kholo';
  RAISE NOTICE '2. Hard refresh karo (Ctrl+Shift+R)';
  RAISE NOTICE '3. SARASWAT BANK select karo';
  RAISE NOTICE '4. Date: 27-10-2025 to 01-11-2025';
  RAISE NOTICE '5. Search click karo';
  RAISE NOTICE '';
  RAISE NOTICE 'Tumhare saare ONLINE payments dikhne chahiye!';
  RAISE NOTICE '========================================';
END $$;
