-- ============================================================================
-- Add Payment Mode Filter to Ledger Statement
-- Date: 2025-11-03
-- Purpose: Enable filtering ledger statements by payment mode
--          Specifically to show only ONLINE transactions for SARASWAT BANK
--
-- CHANGES:
--   1. Add p_payment_mode parameter to get_ledger_statement_with_patients
--   2. Add WHERE clause filter for payment_mode
--   3. Maintain backward compatibility (payment_mode is optional)
-- ============================================================================

-- Drop the old function signature (without payment_mode parameter)
DROP FUNCTION IF EXISTS get_ledger_statement_with_patients(TEXT, TEXT, TEXT, TEXT);

-- Create the updated function with payment_mode filter
CREATE OR REPLACE FUNCTION get_ledger_statement_with_patients(
  p_account_name TEXT,
  p_from_date TEXT,
  p_to_date TEXT,
  p_mrn_filter TEXT DEFAULT NULL,
  p_payment_mode TEXT DEFAULT NULL  -- NEW: Optional payment mode filter
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

  -- Join patients table (FK: vouchers.patient_id -> patients.id)
  LEFT JOIN patients p ON v.patient_id = p.id

  -- Join visits table (FK: visits.patient_id -> patients.id)
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
    -- NEW: Optional payment mode filter (case-insensitive)
    AND (p_payment_mode IS NULL OR
         UPPER(COALESCE(ap.payment_mode, fp.mode_of_payment)) = UPPER(p_payment_mode))

  ORDER BY v.voucher_date DESC, v.voucher_number DESC;
END;
$$ LANGUAGE plpgsql;

-- Update function comment
COMMENT ON FUNCTION get_ledger_statement_with_patients IS
'Retrieves ledger statement entries for a specific bank account with complete patient details.
Supports optional filtering by payment mode (ONLINE, CASH, UPI, etc.) for targeted transaction reporting.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_ledger_statement_with_patients TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Payment mode filter added to ledger statement!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'New Feature:';
  RAISE NOTICE '  - Added p_payment_mode parameter (optional)';
  RAISE NOTICE '  - Filter by: ONLINE, CASH, UPI, NEFT, RTGS, etc.';
  RAISE NOTICE '  - Case-insensitive matching';
  RAISE NOTICE '  - Backward compatible (existing calls still work)';
  RAISE NOTICE '';
  RAISE NOTICE 'Example Usage:';
  RAISE NOTICE '  SELECT * FROM get_ledger_statement_with_patients(';
  RAISE NOTICE '    ''SARASWAT BANK'', ''2025-10-01'', ''2025-10-31'', NULL, ''ONLINE''';
  RAISE NOTICE '  );';
  RAISE NOTICE '========================================';
END $$;
