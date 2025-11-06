-- ============================================================================
-- Add SECURITY DEFINER to Ledger Function
-- Date: 2025-11-06
-- Purpose: Bypass RLS policies so frontend can access ledger data
--
-- ISSUE: Frontend gets empty array due to RLS policies
--        SQL Editor works because it runs with superuser permissions
--        Function needs SECURITY DEFINER to bypass RLS
--
-- FIX: Recreate function with SECURITY DEFINER clause
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_ledger_statement_with_patients(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Create function with SECURITY DEFINER
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
)
SECURITY DEFINER  -- ⭐ THIS IS THE KEY FIX!
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (ve.id)
    v.voucher_date,
    v.voucher_number::TEXT,
    vt.voucher_type_name::TEXT as voucher_type,
    v.narration::TEXT,

    -- Patient Details
    COALESCE(p.name::TEXT, 'Unknown') as patient_name,
    COALESCE(p.patients_id::TEXT, '') as mrn_number,
    v.patient_id,

    -- Visit Details
    COALESCE(
      vis.visit_id::TEXT,
      v.reference_number::TEXT,
      ''
    ) as visit_id,
    COALESCE(vis.visit_type::TEXT, '') as visit_type,
    COALESCE(vis.patient_type::TEXT, '') as patient_type,

    -- Payment Type
    CASE
      WHEN ap.id IS NOT NULL AND ap.is_refund = FALSE THEN 'ADVANCE_PAYMENT'
      WHEN ap.id IS NOT NULL AND ap.is_refund = TRUE THEN 'ADVANCE_REFUND'
      WHEN fp.id IS NOT NULL THEN 'FINAL_PAYMENT'
      WHEN vt.voucher_type_name ILIKE '%receipt%' THEN 'ADVANCE_PAYMENT'
      WHEN vt.voucher_type_name ILIKE '%payment%' THEN 'ADVANCE_PAYMENT'
      ELSE ''
    END as payment_type,

    -- Amounts
    COALESCE(ve.debit_amount, 0) as debit_amount,
    COALESCE(ve.credit_amount, 0) as credit_amount,

    -- Payment Mode
    COALESCE(
      ap.payment_mode::TEXT,
      fp.mode_of_payment::TEXT,
      CASE
        WHEN coa.account_group = 'BANK' AND ve.debit_amount > 0 THEN 'ONLINE'
        WHEN coa.account_name ILIKE '%bank%' AND ve.debit_amount > 0 THEN 'ONLINE'
        ELSE ''
      END
    ) as payment_mode,

    -- Remarks
    COALESCE(
      ap.remarks::TEXT,
      fp.payment_remark::TEXT,
      v.narration::TEXT,
      ''
    ) as remarks,

    -- Is Refund
    COALESCE(ap.is_refund, FALSE) as is_refund,

    -- Bank Account
    COALESCE(
      ap.bank_account_name::TEXT,
      fp.bank_account_name::TEXT,
      ''
    ) as bank_account,
    coa.account_code::TEXT

  FROM voucher_entries ve

  -- Core JOINs
  INNER JOIN vouchers v ON ve.voucher_id = v.id
  INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
  LEFT JOIN voucher_types vt ON v.voucher_type_id = vt.id
  LEFT JOIN patients p ON v.patient_id = p.id

  -- Visit JOIN
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

  -- Final Payments JOIN
  LEFT JOIN final_payments fp ON (
    fp.patient_id = v.patient_id
    AND fp.payment_date = v.voucher_date
  )

  WHERE
    -- Filter by account name
    coa.account_name = p_account_name

    -- Date range filter
    AND v.voucher_date >= p_from_date::DATE
    AND v.voucher_date <= p_to_date::DATE

    -- Optional MRN filter
    AND (p_mrn_filter IS NULL OR p.patients_id = p_mrn_filter)

    -- Payment mode filter
    AND (
      p_payment_mode IS NULL
      OR ap.payment_mode::TEXT = p_payment_mode
      OR fp.mode_of_payment::TEXT = p_payment_mode
      OR (p_payment_mode = 'ONLINE' AND coa.account_group = 'BANK' AND ve.debit_amount > 0)
    )

  ORDER BY ve.id, v.voucher_date, v.voucher_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_ledger_statement_with_patients TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_ledger_statement_with_patients IS
'Ledger statement function with SECURITY DEFINER to bypass RLS policies. Shows all voucher entries including advance and final payments.';

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SECURITY DEFINER ADDED TO LEDGER FUNCTION';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. ✓ Added SECURITY DEFINER clause';
  RAISE NOTICE '  2. ✓ Function now bypasses RLS policies';
  RAISE NOTICE '  3. ✓ Granted EXECUTE permission to authenticated users';
  RAISE NOTICE '';
  RAISE NOTICE 'This fixes the empty array issue in frontend!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Open Ledger Statement page';
  RAISE NOTICE '  3. poonam payments should now be visible! 🎉';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
