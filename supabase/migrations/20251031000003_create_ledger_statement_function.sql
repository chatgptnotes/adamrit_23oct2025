-- Create function to fetch ledger statement with patient details
-- This function retrieves voucher entries for a specific bank account with complete patient information

CREATE OR REPLACE FUNCTION get_ledger_statement_with_patients(
  p_account_name TEXT,
  p_from_date DATE,
  p_to_date DATE,
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
    v.voucher_number,
    vt.voucher_type_name as voucher_type,
    v.narration,

    -- Patient Details
    COALESCE(p.name, 'Unknown') as patient_name,
    COALESCE(p.patients_id, '') as mrn_number,
    v.patient_id,

    -- Visit Details
    COALESCE(vis.visit_id, '') as visit_id,
    COALESCE(vis.visit_type, '') as visit_type,
    COALESCE(vis.patient_type, '') as patient_type,

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
    COALESCE(ap.payment_mode, fp.mode_of_payment, '') as payment_mode,
    COALESCE(ap.remarks, fp.payment_remark, '') as remarks,
    COALESCE(ap.is_refund, FALSE) as is_refund,

    -- Bank Account Info
    coa.account_name as bank_account,
    coa.account_code

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
    AND v.voucher_date BETWEEN p_from_date AND p_to_date
    AND v.status = 'AUTHORISED'
    AND (p_mrn_filter IS NULL OR p.patients_id ILIKE '%' || p_mrn_filter || '%')

  ORDER BY v.voucher_date DESC, v.voucher_number DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION get_ledger_statement_with_patients IS
'Retrieves ledger statement entries for a specific bank account with complete patient details including MRN, visit ID, and payment type classification';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_ledger_statement_with_patients TO authenticated;
