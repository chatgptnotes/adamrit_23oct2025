-- ============================================================================
-- Create View for ALL Daily Transactions in Cash Book
-- This view combines all billing tables to show complete daily transactions
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing objects if they exist
-- ============================================================================
DROP FUNCTION IF EXISTS get_daily_cash_transactions(DATE, DATE, TEXT, UUID) CASCADE;
DROP VIEW IF EXISTS v_cash_book_all_daily_transactions CASCADE;

-- ============================================================================
-- STEP 2: Create unified view for all daily transactions
-- ============================================================================
CREATE VIEW v_cash_book_all_daily_transactions AS

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
WHERE ps.total_amount > 0

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
WHERE dsb.net_amount > 0;

-- ============================================================================
-- Add comment
-- ============================================================================
COMMENT ON VIEW v_cash_book_all_daily_transactions IS
'Unified view of all daily patient transactions from all billing tables (OPD, Lab, Radiology, Pharmacy, Physiotherapy, Mandatory Services, Direct Sales)';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT ON v_cash_book_all_daily_transactions TO authenticated;

-- ============================================================================
-- STEP 3: Create helper function to get daily transactions for date range
-- ============================================================================
CREATE FUNCTION get_daily_cash_transactions(
  p_from_date DATE,
  p_to_date DATE,
  p_transaction_type TEXT DEFAULT NULL,
  p_patient_id UUID DEFAULT NULL
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
  SELECT
    t.transaction_id,
    t.transaction_type,
    t.visit_id,
    t.patient_id,
    t.patient_name,
    t.transaction_date,
    t.transaction_time,
    t.description,
    t.amount,
    t.quantity,
    t.unit_rate,
    t.rate_type,
    t.payment_mode,
    t.created_at,
    t.updated_at
  FROM v_cash_book_all_daily_transactions t
  WHERE t.transaction_date >= p_from_date
    AND t.transaction_date <= p_to_date
    AND (p_transaction_type IS NULL OR t.transaction_type = p_transaction_type)
    AND (p_patient_id IS NULL OR t.patient_id = p_patient_id)
  ORDER BY t.transaction_date DESC, t.transaction_time DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Add comment
-- ============================================================================
COMMENT ON FUNCTION get_daily_cash_transactions IS
'Fetch daily transactions for Cash Book with optional filters for date range, transaction type, and patient';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_daily_cash_transactions TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Cash Book daily transactions view created successfully!';
  RAISE NOTICE 'View includes: OPD, Lab, Radiology, Pharmacy, Physiotherapy, Mandatory Services, Direct Sales';
  RAISE NOTICE 'Use: SELECT * FROM v_cash_book_all_daily_transactions WHERE transaction_date = CURRENT_DATE';
END $$;
