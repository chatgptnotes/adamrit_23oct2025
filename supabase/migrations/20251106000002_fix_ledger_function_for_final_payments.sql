-- ============================================================================
-- Fix Ledger Statement Function to Include Final Payments
-- Date: 2025-11-06
-- Purpose: Correct table name and JOIN conditions for final payments
--
-- ISSUES FIXED:
--   1. Wrong table name: final_payment → final_payments (plural)
--   2. Wrong column: fp.payment_date → now exists (added in previous migration)
--   3. Wrong column: fp.patient_id → now exists (added in previous migration)
--   4. Improved remarks field to show fp.payment_remark
--
-- RESULT: Final payments will now appear in Ledger Statement
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_ledger_statement_with_patients(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Create fixed function with corrected final_payments JOIN
CREATE OR REPLACE FUNCTION get_ledger_statement_with_patients(
  p_account_name TEXT,
  p_from_date TEXT,
  p_to_date TEXT,
  p_mrn_filter TEXT DEFAULT NULL,
  p_payment_mode TEXT DEFAULT NULL
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
  SELECT DISTINCT ON (ve.id)  -- ONE ROW PER VOUCHER ENTRY!
    v.voucher_date,
    v.voucher_number::TEXT,
    vt.voucher_type_name::TEXT as voucher_type,
    v.narration::TEXT,

    -- Patient Details
    COALESCE(p.name::TEXT, 'Unknown') as patient_name,
    COALESCE(p.patients_id::TEXT, '') as mrn_number,
    v.patient_id,

    -- Visit Details - Try to get from multiple sources
    COALESCE(
      vis.visit_id::TEXT,
      v.reference_number::TEXT,
      ''
    ) as visit_id,
    COALESCE(vis.visit_type::TEXT, '') as visit_type,
    COALESCE(vis.patient_type::TEXT, '') as patient_type,

    -- Payment Type - Try multiple sources
    CASE
      -- First try advance_payment JOIN
      WHEN ap.id IS NOT NULL AND ap.is_refund = FALSE THEN 'ADVANCE_PAYMENT'
      WHEN ap.id IS NOT NULL AND ap.is_refund = TRUE THEN 'ADVANCE_REFUND'
      -- Then try final_payments JOIN (FIXED!)
      WHEN fp.id IS NOT NULL THEN 'FINAL_PAYMENT'
      -- Fall back to voucher type
      WHEN vt.voucher_type_name ILIKE '%receipt%' THEN 'ADVANCE_PAYMENT'
      WHEN vt.voucher_type_name ILIKE '%payment%' THEN 'ADVANCE_PAYMENT'
      ELSE ''
    END as payment_type,

    -- Amounts
    COALESCE(ve.debit_amount, 0) as debit_amount,
    COALESCE(ve.credit_amount, 0) as credit_amount,

    -- Payment Mode - IMPROVED LOGIC
    COALESCE(
      -- First try advance_payment
      ap.payment_mode::TEXT,
      -- Then try final_payments (FIXED!)
      fp.mode_of_payment::TEXT,
      -- Check if it's a bank account transaction
      CASE
        WHEN coa.account_group = 'BANK' AND ve.debit_amount > 0 THEN 'ONLINE'
        WHEN coa.account_name ILIKE '%bank%' AND ve.debit_amount > 0 THEN 'ONLINE'
        ELSE ''
      END
    ) as payment_mode,

    -- Remarks - IMPROVED to include final payment remarks
    COALESCE(
      ap.remarks::TEXT,
      fp.payment_remark::TEXT,  -- FIXED: Use payment_remark from final_payments
      v.narration::TEXT,
      ''
    ) as remarks,

    -- Is Refund
    COALESCE(ap.is_refund, FALSE) as is_refund,

    -- Bank Account
    COALESCE(
      ap.bank_account_name::TEXT,
      fp.bank_account_name::TEXT,  -- FIXED: Use bank_account_name from final_payments
      ''
    ) as bank_account,
    coa.account_code::TEXT

  FROM voucher_entries ve

  -- Core JOINs (required)
  INNER JOIN vouchers v ON ve.voucher_id = v.id
  INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
  LEFT JOIN voucher_types vt ON v.voucher_type_id = vt.id
  LEFT JOIN patients p ON v.patient_id = p.id

  -- Visit JOIN (optional)
  LEFT JOIN visits vis ON (
    vis.patient_id = v.patient_id
    AND DATE(vis.visit_date) = v.voucher_date
  )

  -- Advance Payment JOIN
  LEFT JOIN advance_payment ap ON (
    ap.patient_id = v.patient_id
    AND DATE(ap.payment_date) = v.voucher_date
    AND (
      ap.advance_amount = GREATEST(ve.debit_amount, ve.credit_amount)
      OR ABS(ap.advance_amount - GREATEST(ve.debit_amount, ve.credit_amount)) < 0.01
      OR ap.bank_account_id = coa.id
    )
  )

  -- FINAL PAYMENTS JOIN (FIXED!)
  -- Changed from: final_payment → final_payments
  -- Now uses: payment_date and patient_id columns (added in previous migration)
  LEFT JOIN final_payments fp ON (
    fp.patient_id = v.patient_id
    AND fp.payment_date = v.voucher_date
  )

  WHERE
    -- Filter by account name (required)
    coa.account_name = p_account_name

    -- Date range filter
    AND v.voucher_date >= p_from_date::DATE
    AND v.voucher_date <= p_to_date::DATE

    -- Optional MRN filter
    AND (p_mrn_filter IS NULL OR p.patients_id = p_mrn_filter)

    -- IMPROVED payment mode filter - Check multiple sources
    AND (
      p_payment_mode IS NULL
      OR ap.payment_mode::TEXT = p_payment_mode
      OR fp.mode_of_payment::TEXT = p_payment_mode
      OR (p_payment_mode = 'ONLINE' AND coa.account_group = 'BANK' AND ve.debit_amount > 0)
    )

  ORDER BY ve.id, v.voucher_date, v.voucher_number;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION get_ledger_statement_with_patients IS
'Fixed version: Shows ALL voucher entries including FINAL PAYMENTS. Corrected table name from final_payment to final_payments and uses new payment_date and patient_id columns for proper JOIN.';

-- ============================================================================
-- FINAL: Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅✅✅ LEDGER FUNCTION FIXED SUCCESSFULLY ✅✅✅';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. ✓ Fixed table name: final_payment → final_payments';
  RAISE NOTICE '  2. ✓ Updated JOIN to use payment_date column';
  RAISE NOTICE '  3. ✓ Updated JOIN to use patient_id column';
  RAISE NOTICE '  4. ✓ Added payment_remark to remarks field';
  RAISE NOTICE '  5. ✓ Added bank_account_name for final payments';
  RAISE NOTICE '';
  RAISE NOTICE 'FINAL PAYMENTS WILL NOW SHOW IN LEDGER STATEMENT!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Apply both migrations to database';
  RAISE NOTICE '  2. Refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '  3. Open Ledger Statement page';
  RAISE NOTICE '  4. Select bank account and date range';
  RAISE NOTICE '  5. Final payments should now appear! ✅';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
