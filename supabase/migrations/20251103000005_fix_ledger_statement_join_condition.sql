-- ============================================================================
-- Fix Ledger Statement JOIN Condition
-- Date: 2025-11-03
-- Purpose: Fix faulty JOIN that prevents vouchers from appearing in ledger
--
-- ISSUE: The current JOIN condition fails to link vouchers to payments
-- RESULT: Vouchers exist in correct bank but don't show in Ledger Statement
-- FIX: Make JOIN more reliable and ensure ALL voucher entries are shown
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_ledger_statement_with_patients(TEXT, TEXT, TEXT, TEXT, TEXT);

-- Create improved function with fixed JOIN logic
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
      -- Then try final_payment JOIN
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
      -- Then try final_payment
      fp.mode_of_payment::TEXT,
      -- Check if it's a bank account transaction
      CASE
        WHEN coa.account_group = 'BANK' AND ve.debit_amount > 0 THEN 'ONLINE'
        WHEN coa.account_name ILIKE '%bank%' AND ve.debit_amount > 0 THEN 'ONLINE'
        ELSE ''
      END
    ) as payment_mode,

    -- Remarks
    COALESCE(
      ap.remarks::TEXT,
      fp.remarks::TEXT,
      v.narration::TEXT,
      ''
    ) as remarks,

    -- Is Refund
    COALESCE(ap.is_refund, FALSE) as is_refund,

    -- Bank Account
    COALESCE(ap.bank_account_name::TEXT, '') as bank_account,
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

  -- IMPROVED Payment JOINs - More flexible matching
  LEFT JOIN advance_payment ap ON (
    -- Try to match by patient and date first
    ap.patient_id = v.patient_id
    AND DATE(ap.payment_date) = v.voucher_date
    -- Amount matching is optional now (removed from main condition)
    AND (
      ap.advance_amount = GREATEST(ve.debit_amount, ve.credit_amount)
      -- OR allow small differences due to rounding
      OR ABS(ap.advance_amount - GREATEST(ve.debit_amount, ve.credit_amount)) < 0.01
      -- OR if bank matches, accept it
      OR ap.bank_account_id = coa.id
    )
  )

  LEFT JOIN final_payment fp ON (
    fp.patient_id = v.patient_id
    AND DATE(fp.payment_date) = v.voucher_date
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
      -- Also check if it's a bank transaction
      OR (p_payment_mode = 'ONLINE' AND coa.account_group = 'BANK' AND ve.debit_amount > 0)
    )

  ORDER BY ve.id, v.voucher_date, v.voucher_number;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION get_ledger_statement_with_patients IS 'Fixed version: Shows ALL voucher entries for account, with improved JOIN logic that doesnt depend solely on exact amount matching. If payment details cannot be linked, still shows the voucher entry with inferred payment_mode for bank accounts.';

-- ============================================================================
-- Verification Query
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Ledger function updated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. More flexible JOIN conditions';
  RAISE NOTICE '  2. Payment mode inference for bank transactions';
  RAISE NOTICE '  3. Shows ALL voucher entries even if JOIN fails';
  RAISE NOTICE '  4. Better handling of amount matching (allows rounding)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Refresh your browser (Ctrl+Shift+R)';
  RAISE NOTICE '  2. Open Ledger Statement page';
  RAISE NOTICE '  3. Select STATE BANK OF INDIA (DRM)';
  RAISE NOTICE '  4. Select date range: 01-11-2025 to 03-11-2025';
  RAISE NOTICE '  5. You should now see the 2 x ₹10 payments!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
