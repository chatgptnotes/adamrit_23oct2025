-- ============================================================================
-- Add Final Payment Recording to Cash Book System
-- This migration ensures final payments appear in patient_payment_transactions
-- and in the Cash Book
-- ============================================================================

-- ============================================================================
-- STEP 1: Create trigger function for final_payments
-- This records final payments to patient_payment_transactions table
-- ============================================================================
CREATE OR REPLACE FUNCTION record_final_payment_to_transactions()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_id UUID;
  v_patient_uuid UUID;
  v_narration TEXT;
  v_mapped_payment_mode TEXT;
BEGIN
  -- Get patient_id from visit
  SELECT patient_id INTO v_patient_uuid
  FROM visits
  WHERE visit_id = NEW.visit_id;

  IF v_patient_uuid IS NULL THEN
    RAISE WARNING 'Patient not found for visit_id: %. Skipping payment transaction.', NEW.visit_id;
    RETURN NEW;
  END IF;

  -- Build narration
  v_narration := COALESCE(
    NEW.payment_remark,
    'Final bill payment - ' || NEW.reason_of_discharge
  );

  -- Map payment mode to valid constraint values
  -- Allowed: CASH, CARD, UPI, CHEQUE, DD, NEFT, RTGS, ONLINE, PAYTM, PHONEPE
  v_mapped_payment_mode := CASE UPPER(TRIM(NEW.mode_of_payment))
    WHEN 'CASH' THEN 'CASH'
    WHEN 'CARD' THEN 'CARD'
    WHEN 'UPI' THEN 'UPI'
    WHEN 'CHEQUE' THEN 'CHEQUE'
    WHEN 'DD' THEN 'DD'
    WHEN 'NEFT' THEN 'NEFT'
    WHEN 'RTGS' THEN 'RTGS'
    WHEN 'ONLINE' THEN 'ONLINE'
    WHEN 'PAYTM' THEN 'PAYTM'
    WHEN 'PHONEPE' THEN 'PHONEPE'
    -- Map common variations
    WHEN 'BANK TRANSFER' THEN 'ONLINE'
    WHEN 'BANK_TRANSFER' THEN 'ONLINE'
    WHEN 'NET BANKING' THEN 'ONLINE'
    WHEN 'NET_BANKING' THEN 'ONLINE'
    WHEN 'NETBANKING' THEN 'ONLINE'
    WHEN 'ONLINE TRANSFER' THEN 'ONLINE'
    WHEN 'ONLINE_TRANSFER' THEN 'ONLINE'
    WHEN 'DEBIT CARD' THEN 'CARD'
    WHEN 'CREDIT CARD' THEN 'CARD'
    WHEN 'GOOGLE PAY' THEN 'UPI'
    WHEN 'GOOGLEPAY' THEN 'UPI'
    WHEN 'GPAY' THEN 'UPI'
    WHEN 'PHONE PE' THEN 'PHONEPE'
    WHEN 'PHONE_PE' THEN 'PHONEPE'
    -- Default fallback
    ELSE 'CASH'
  END;

  -- Log warning if mode was mapped to default
  IF UPPER(TRIM(NEW.mode_of_payment)) NOT IN (
    'CASH', 'CARD', 'UPI', 'CHEQUE', 'DD', 'NEFT', 'RTGS',
    'ONLINE', 'PAYTM', 'PHONEPE', 'BANK TRANSFER', 'BANK_TRANSFER',
    'NET BANKING', 'NET_BANKING', 'NETBANKING', 'ONLINE TRANSFER',
    'ONLINE_TRANSFER', 'DEBIT CARD', 'CREDIT CARD', 'GOOGLE PAY',
    'GOOGLEPAY', 'GPAY', 'PHONE PE', 'PHONE_PE'
  ) THEN
    RAISE WARNING 'Unknown payment mode "%" for final payment %, defaulting to CASH',
      NEW.mode_of_payment, NEW.id;
  END IF;

  -- Insert payment transaction record
  INSERT INTO patient_payment_transactions (
    patient_id,
    visit_id,
    payment_source,
    source_table_name,
    source_reference_id,
    payment_date,
    payment_mode,
    amount,
    narration,
    bank_name,
    created_by,
    created_at
  ) VALUES (
    v_patient_uuid,
    NEW.visit_id,
    'FINAL_BILL',
    'final_payments',
    NEW.id::TEXT,
    CURRENT_DATE,
    v_mapped_payment_mode, -- Use mapped payment mode
    NEW.amount,
    v_narration,
    NEW.bank_account_name,
    COALESCE(NEW.created_by, 'system'),
    NOW()
  )
  RETURNING id INTO v_payment_id;

  RAISE NOTICE 'Payment transaction % recorded for final payment (visit: %, mode: % → %)',
    v_payment_id, NEW.visit_id, NEW.mode_of_payment, v_mapped_payment_mode;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: Create trigger on final_payments
-- ============================================================================
DROP TRIGGER IF EXISTS trg_final_payment_record_transaction ON final_payments;
CREATE TRIGGER trg_final_payment_record_transaction
  AFTER INSERT ON final_payments
  FOR EACH ROW
  EXECUTE FUNCTION record_final_payment_to_transactions();

-- ============================================================================
-- STEP 3: Update Cash Book function to include final payments
-- This replaces the existing function with the updated version
-- ============================================================================

-- Drop both function signatures to avoid conflicts
DROP FUNCTION IF EXISTS get_cash_book_transactions_direct(DATE, DATE, TEXT, UUID);
DROP FUNCTION IF EXISTS get_cash_book_transactions_direct(DATE, DATE, TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION get_cash_book_transactions_direct(
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL,
  p_transaction_type TEXT DEFAULT NULL,
  p_patient_id UUID DEFAULT NULL,
  p_hospital_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  transaction_id TEXT,
  transaction_type TEXT,
  visit_id TEXT,
  patient_id UUID,
  patient_name TEXT,
  transaction_date DATE,
  transaction_time TIMESTAMP WITH TIME ZONE,
  description TEXT,
  amount NUMERIC,
  quantity INTEGER,
  unit_rate NUMERIC,
  rate_type TEXT,
  payment_mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY

  -- 1. OPD Services (Clinical Services)
  SELECT
    vcs.id::TEXT as transaction_id,
    'OPD_SERVICE'::TEXT as transaction_type,
    vcs.visit_id::TEXT as visit_id,
    v.patient_id,
    p.name::TEXT as patient_name,
    vcs.selected_at::DATE as transaction_date,
    vcs.selected_at::TIMESTAMP WITH TIME ZONE as transaction_time,
    cs.service_name::TEXT as description,
    vcs.amount::NUMERIC as amount,
    vcs.quantity::INTEGER as quantity,
    vcs.rate_used::NUMERIC as unit_rate,
    vcs.rate_type::TEXT as rate_type,
    'CASH'::TEXT as payment_mode,
    vcs.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    vcs.updated_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM visit_clinical_services vcs
  LEFT JOIN visits v ON vcs.visit_id = v.id
  LEFT JOIN patients p ON v.patient_id = p.id
  LEFT JOIN clinical_services cs ON vcs.clinical_service_id = cs.id
  WHERE vcs.amount > 0
    AND (p_from_date IS NULL OR vcs.selected_at::DATE >= p_from_date)
    AND (p_to_date IS NULL OR vcs.selected_at::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'OPD_SERVICE' = p_transaction_type)
    AND (p_patient_id IS NULL OR v.patient_id = p_patient_id)
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name)

  UNION ALL

  -- 2. Lab Tests
  SELECT
    vl.id::TEXT as transaction_id,
    'LAB_TEST'::TEXT as transaction_type,
    vl.visit_id::TEXT as visit_id,
    v.patient_id,
    p.name::TEXT as patient_name,
    COALESCE(vl.ordered_date, vl.created_at)::DATE as transaction_date,
    COALESCE(vl.ordered_date, vl.created_at)::TIMESTAMP WITH TIME ZONE as transaction_time,
    l.name::TEXT as description,
    (vl.unit_rate * vl.quantity)::NUMERIC as amount,
    vl.quantity::INTEGER as quantity,
    vl.unit_rate::NUMERIC as unit_rate,
    'standard'::TEXT as rate_type,
    'CASH'::TEXT as payment_mode,
    vl.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    vl.updated_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM visit_labs vl
  LEFT JOIN visits v ON vl.visit_id = v.id
  LEFT JOIN patients p ON v.patient_id = p.id
  LEFT JOIN lab l ON vl.lab_id = l.id
  WHERE (vl.unit_rate * vl.quantity) > 0
    AND (p_from_date IS NULL OR COALESCE(vl.ordered_date, vl.created_at)::DATE >= p_from_date)
    AND (p_to_date IS NULL OR COALESCE(vl.ordered_date, vl.created_at)::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'LAB_TEST' = p_transaction_type)
    AND (p_patient_id IS NULL OR v.patient_id = p_patient_id)
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name)

  UNION ALL

  -- 3. Radiology Tests
  SELECT
    vr.id::TEXT as transaction_id,
    'RADIOLOGY'::TEXT as transaction_type,
    vr.visit_id::TEXT as visit_id,
    v.patient_id,
    p.name::TEXT as patient_name,
    COALESCE(vr.ordered_date, vr.created_at)::DATE as transaction_date,
    COALESCE(vr.ordered_date, vr.created_at)::TIMESTAMP WITH TIME ZONE as transaction_time,
    r.name::TEXT as description,
    (vr.unit_rate * vr.quantity)::NUMERIC as amount,
    vr.quantity::INTEGER as quantity,
    vr.unit_rate::NUMERIC as unit_rate,
    'standard'::TEXT as rate_type,
    'CASH'::TEXT as payment_mode,
    vr.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    vr.updated_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM visit_radiology vr
  LEFT JOIN visits v ON vr.visit_id = v.id
  LEFT JOIN patients p ON v.patient_id = p.id
  LEFT JOIN radiology r ON vr.radiology_id = r.id
  WHERE (vr.unit_rate * vr.quantity) > 0
    AND (p_from_date IS NULL OR COALESCE(vr.ordered_date, vr.created_at)::DATE >= p_from_date)
    AND (p_to_date IS NULL OR COALESCE(vr.ordered_date, vr.created_at)::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'RADIOLOGY' = p_transaction_type)
    AND (p_patient_id IS NULL OR v.patient_id = p_patient_id)
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name)

  UNION ALL

  -- 4. Mandatory Services
  SELECT
    vms.id::TEXT as transaction_id,
    'MANDATORY_SERVICE'::TEXT as transaction_type,
    vms.visit_id::TEXT as visit_id,
    v.patient_id,
    p.name::TEXT as patient_name,
    vms.selected_at::DATE as transaction_date,
    vms.selected_at::TIMESTAMP WITH TIME ZONE as transaction_time,
    ms.service_name::TEXT as description,
    vms.amount::NUMERIC as amount,
    vms.quantity::INTEGER as quantity,
    vms.rate_used::NUMERIC as unit_rate,
    vms.rate_type::TEXT as rate_type,
    'CASH'::TEXT as payment_mode,
    vms.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    vms.updated_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM visit_mandatory_services vms
  LEFT JOIN visits v ON vms.visit_id = v.id
  LEFT JOIN patients p ON v.patient_id = p.id
  LEFT JOIN mandatory_services ms ON vms.mandatory_service_id = ms.id
  WHERE vms.amount > 0
    AND (p_from_date IS NULL OR vms.selected_at::DATE >= p_from_date)
    AND (p_to_date IS NULL OR vms.selected_at::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'MANDATORY_SERVICE' = p_transaction_type)
    AND (p_patient_id IS NULL OR v.patient_id = p_patient_id)
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name)

  UNION ALL

  -- 5. Pharmacy Sales
  SELECT
    ps.sale_id::TEXT as transaction_id,
    'PHARMACY'::TEXT as transaction_type,
    ps.visit_id::TEXT as visit_id,
    CASE
      WHEN ps.patient_id::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN ps.patient_id::UUID
      ELSE NULL
    END as patient_id,
    COALESCE(ps.patient_name, 'Walk-in Customer')::TEXT as patient_name,
    ps.sale_date::DATE as transaction_date,
    ps.sale_date::TIMESTAMP WITH TIME ZONE as transaction_time,
    ('Pharmacy Sale #' || ps.sale_id::TEXT)::TEXT as description,
    ps.total_amount::NUMERIC as amount,
    1::INTEGER as quantity,
    ps.total_amount::NUMERIC as unit_rate,
    'standard'::TEXT as rate_type,
    UPPER(ps.payment_method)::TEXT as payment_mode,
    ps.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    ps.updated_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM pharmacy_sales ps
  LEFT JOIN patients p ON (
    ps.patient_id::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND ps.patient_id::UUID = p.id
  )
  WHERE ps.total_amount > 0
    AND (p_from_date IS NULL OR ps.sale_date::DATE >= p_from_date)
    AND (p_to_date IS NULL OR ps.sale_date::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'PHARMACY' = p_transaction_type)
    AND (p_patient_id IS NULL OR (
      ps.patient_id::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND ps.patient_id::UUID = p_patient_id
    ))
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name OR ps.patient_id IS NULL)

  UNION ALL

  -- 6. Physiotherapy Services
  SELECT
    pbi.id::TEXT as transaction_id,
    'PHYSIOTHERAPY'::TEXT as transaction_type,
    pbi.visit_id::TEXT as visit_id,
    v.patient_id,
    p.name::TEXT as patient_name,
    pbi.created_at::DATE as transaction_date,
    pbi.created_at::TIMESTAMP WITH TIME ZONE as transaction_time,
    pbi.item_name::TEXT as description,
    pbi.amount::NUMERIC as amount,
    pbi.quantity::INTEGER as quantity,
    pbi.cghs_rate::NUMERIC as unit_rate,
    'cghs'::TEXT as rate_type,
    'CASH'::TEXT as payment_mode,
    pbi.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    pbi.updated_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM physiotherapy_bill_items pbi
  LEFT JOIN visits v ON pbi.visit_id = v.visit_id
  LEFT JOIN patients p ON v.patient_id = p.id
  WHERE pbi.amount > 0
    AND (p_from_date IS NULL OR pbi.created_at::DATE >= p_from_date)
    AND (p_to_date IS NULL OR pbi.created_at::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'PHYSIOTHERAPY' = p_transaction_type)
    AND (p_patient_id IS NULL OR v.patient_id = p_patient_id)
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name)

  UNION ALL

  -- 7. Direct Sale Bills (Pharmacy walk-in sales)
  SELECT
    dsb.id::TEXT as transaction_id,
    'DIRECT_SALE'::TEXT as transaction_type,
    NULL::TEXT as visit_id,
    NULL::UUID as patient_id,
    COALESCE(dsb.patient_name, 'Walk-in Customer')::TEXT as patient_name,
    dsb.bill_date::DATE as transaction_date,
    dsb.bill_date::TIMESTAMP WITH TIME ZONE as transaction_time,
    ('Direct Sale Bill #' || dsb.bill_number)::TEXT as description,
    dsb.net_amount::NUMERIC as amount,
    1::INTEGER as quantity,
    dsb.net_amount::NUMERIC as unit_rate,
    'standard'::TEXT as rate_type,
    UPPER(COALESCE(dsb.payment_mode, 'CASH'))::TEXT as payment_mode,
    dsb.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    dsb.updated_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM direct_sale_bills dsb
  WHERE dsb.net_amount > 0
    AND (p_from_date IS NULL OR dsb.bill_date::DATE >= p_from_date)
    AND (p_to_date IS NULL OR dsb.bill_date::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'DIRECT_SALE' = p_transaction_type)
    AND (p_patient_id IS NULL) -- Direct sales have no patient_id

  UNION ALL

  -- 8. Advance Payments
  SELECT
    ap.id::TEXT as transaction_id,
    'ADVANCE_PAYMENT'::TEXT as transaction_type,
    ap.visit_id::TEXT as visit_id,
    ap.patient_id,
    COALESCE(ap.patient_name, p.name, 'Unknown Patient')::TEXT as patient_name,
    ap.payment_date::DATE as transaction_date,
    ap.created_at::TIMESTAMP WITH TIME ZONE as transaction_time,
    CASE
      WHEN ap.is_refund THEN ('Advance Payment Refund: ' || COALESCE(ap.refund_reason, 'No reason'))::TEXT
      ELSE ('Advance Payment' || CASE WHEN ap.remarks IS NOT NULL AND ap.remarks != '' THEN (' - ' || ap.remarks) ELSE '' END)::TEXT
    END as description,
    CASE
      WHEN ap.is_refund THEN (ap.advance_amount * -1)::NUMERIC  -- Negative for refunds
      ELSE ap.advance_amount::NUMERIC
    END as amount,
    1::INTEGER as quantity,
    ap.advance_amount::NUMERIC as unit_rate,
    'advance'::TEXT as rate_type,
    UPPER(ap.payment_mode)::TEXT as payment_mode,
    ap.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    ap.updated_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM advance_payment ap
  LEFT JOIN patients p ON ap.patient_id = p.id
  WHERE ap.status = 'ACTIVE'
    AND ap.advance_amount > 0
    AND (p_from_date IS NULL OR ap.payment_date::DATE >= p_from_date)
    AND (p_to_date IS NULL OR ap.payment_date::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'ADVANCE_PAYMENT' = p_transaction_type)
    AND (p_patient_id IS NULL OR ap.patient_id = p_patient_id)
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name)

  UNION ALL

  -- 9. Final Payments (NEW - this was missing!)
  SELECT
    fp.id::TEXT as transaction_id,
    'FINAL_BILL'::TEXT as transaction_type,
    fp.visit_id::TEXT as visit_id,
    v.patient_id,
    p.name::TEXT as patient_name,
    fp.created_at::DATE as transaction_date,
    fp.created_at::TIMESTAMP WITH TIME ZONE as transaction_time,
    ('Final Bill Payment - ' || fp.reason_of_discharge ||
     CASE WHEN fp.payment_remark IS NOT NULL AND fp.payment_remark != ''
          THEN ' (' || fp.payment_remark || ')'
          ELSE ''
     END)::TEXT as description,
    fp.amount::NUMERIC as amount,
    1::INTEGER as quantity,
    fp.amount::NUMERIC as unit_rate,
    'final'::TEXT as rate_type,
    UPPER(fp.mode_of_payment)::TEXT as payment_mode,
    fp.created_at::TIMESTAMP WITH TIME ZONE as created_at,
    fp.created_at::TIMESTAMP WITH TIME ZONE as updated_at
  FROM final_payments fp
  LEFT JOIN visits v ON fp.visit_id = v.visit_id
  LEFT JOIN patients p ON v.patient_id = p.id
  WHERE fp.amount > 0
    AND (p_from_date IS NULL OR fp.created_at::DATE >= p_from_date)
    AND (p_to_date IS NULL OR fp.created_at::DATE <= p_to_date)
    AND (p_transaction_type IS NULL OR 'FINAL_BILL' = p_transaction_type)
    AND (p_patient_id IS NULL OR v.patient_id = p_patient_id)
    AND (p_hospital_name IS NULL OR p.hospital_name = p_hospital_name)

  ORDER BY transaction_date DESC, transaction_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Add comments
-- ============================================================================
COMMENT ON FUNCTION record_final_payment_to_transactions() IS
'Automatically records final payment into patient_payment_transactions table for Cash Book integration';

COMMENT ON FUNCTION get_cash_book_transactions_direct IS
'Fetch all patient transactions from source tables directly with hospital filtering. Includes: OPD, Lab, Radiology, Pharmacy, Physiotherapy, Mandatory Services, Direct Sales, Advance Payments, Final Payments (9 types total). All parameters are optional - if NULL, no filter is applied. p_hospital_name filters patients by their hospital_name.';

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_cash_book_transactions_direct TO authenticated;
GRANT EXECUTE ON FUNCTION record_final_payment_to_transactions TO authenticated;

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Final payments NOW appear in Cash Book!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. ✓ Trigger function created: record_final_payment_to_transactions()';
  RAISE NOTICE '  2. ✓ Trigger added on final_payments table';
  RAISE NOTICE '  3. ✓ Cash book function updated to include FINAL_BILL transactions';
  RAISE NOTICE '';
  RAISE NOTICE 'Transaction types now in Cash Book: 9';
  RAISE NOTICE '  - OPD Services';
  RAISE NOTICE '  - Lab Tests';
  RAISE NOTICE '  - Radiology';
  RAISE NOTICE '  - Mandatory Services';
  RAISE NOTICE '  - Pharmacy Sales';
  RAISE NOTICE '  - Physiotherapy';
  RAISE NOTICE '  - Direct Sales';
  RAISE NOTICE '  - Advance Payments';
  RAISE NOTICE '  - Final Bill Payments (NEW!)';
  RAISE NOTICE '';
  RAISE NOTICE 'All future final payments will automatically:';
  RAISE NOTICE '  - Be recorded in patient_payment_transactions';
  RAISE NOTICE '  - Appear in Cash Book';
  RAISE NOTICE '  - Appear in Ledger';
  RAISE NOTICE '========================================';
END $$;
