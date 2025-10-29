-- ============================================================================
-- Unified Patient Payment Tracking System
-- This migration creates a centralized table to track ALL patient payments
-- Including OPD, IPD, Pharmacy, Physiotherapy, and other services
-- ============================================================================

-- ============================================================================
-- STEP 1: Create patient_payment_transactions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identifiers
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  visit_id TEXT REFERENCES visits(visit_id) ON DELETE SET NULL,

  -- Payment source tracking
  payment_source VARCHAR(50) NOT NULL,
  -- Values: 'ADVANCE', 'FINAL_BILL', 'OPD_SERVICE', 'PHARMACY', 'PHYSIOTHERAPY', 'DIRECT_SALE'

  source_reference_id TEXT, -- Flexible reference to source record (UUID or ID)
  source_table_name VARCHAR(100), -- Table name for reference (e.g., 'pharmacy_sales', 'visit_clinical_services')

  -- Payment details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode VARCHAR(20) NOT NULL DEFAULT 'CASH',
  -- Values: 'CASH', 'CARD', 'UPI', 'CHEQUE', 'DD', 'NEFT', 'RTGS', 'ONLINE'

  amount DECIMAL(15,2) NOT NULL,

  -- Transaction details
  narration TEXT,
  service_details JSONB, -- Store service/item details for rich display

  -- Reference numbers for non-cash payments
  reference_number VARCHAR(100),
  bank_name VARCHAR(200),

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_amount_positive CHECK (amount > 0),
  CONSTRAINT chk_payment_source CHECK (payment_source IN (
    'ADVANCE', 'FINAL_BILL', 'OPD_SERVICE', 'PHARMACY',
    'PHYSIOTHERAPY', 'DIRECT_SALE', 'OTHER'
  )),
  CONSTRAINT chk_payment_mode CHECK (payment_mode IN (
    'CASH', 'CARD', 'UPI', 'CHEQUE', 'DD', 'NEFT', 'RTGS', 'ONLINE', 'PAYTM', 'PHONEPE'
  ))
);

-- Create indexes for better query performance
CREATE INDEX idx_payment_txn_patient ON patient_payment_transactions(patient_id);
CREATE INDEX idx_payment_txn_visit ON patient_payment_transactions(visit_id);
CREATE INDEX idx_payment_txn_date ON patient_payment_transactions(payment_date);
CREATE INDEX idx_payment_txn_mode ON patient_payment_transactions(payment_mode);
CREATE INDEX idx_payment_txn_source ON patient_payment_transactions(payment_source);
CREATE INDEX idx_payment_txn_created ON patient_payment_transactions(created_at);

-- Add RLS policies
ALTER TABLE patient_payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON patient_payment_transactions
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON patient_payment_transactions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON patient_payment_transactions
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Add table comment
COMMENT ON TABLE patient_payment_transactions IS
'Centralized table for tracking all patient payment transactions across all modules (OPD, IPD, Pharmacy, etc.)';

-- ============================================================================
-- STEP 2: Extend the existing trigger function to handle new payment table
-- ============================================================================
CREATE OR REPLACE FUNCTION create_receipt_voucher_for_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_voucher_type_id UUID;
  v_cash_account_id UUID;
  v_revenue_account_id UUID;
  v_patient_id UUID;
  v_payment_amount DECIMAL(15,2);
  v_payment_mode TEXT;
  v_payment_date DATE;
  v_narration TEXT;
BEGIN
  -- Extract payment details based on which table triggered this
  IF TG_TABLE_NAME = 'final_payments' THEN
    v_payment_amount := NEW.amount;
    v_payment_mode := NEW.mode_of_payment;
    v_payment_date := CURRENT_DATE;

    -- Get patient_id from visit
    SELECT patient_id INTO v_patient_id
    FROM visits
    WHERE visit_id = NEW.visit_id;

    v_narration := 'Cash payment received on final bill';

  ELSIF TG_TABLE_NAME = 'advance_payment' THEN
    v_payment_amount := NEW.advance_amount;
    v_payment_mode := NEW.payment_mode;
    v_payment_date := NEW.payment_date::DATE;
    v_patient_id := NEW.patient_id;
    v_narration := 'Advance cash payment received';

  ELSIF TG_TABLE_NAME = 'patient_payment_transactions' THEN
    -- NEW TABLE: Handle unified payment transactions
    v_payment_amount := NEW.amount;
    v_payment_mode := NEW.payment_mode;
    v_payment_date := NEW.payment_date;
    v_patient_id := NEW.patient_id;

    -- Use custom narration or build from payment source
    v_narration := COALESCE(
      NEW.narration,
      CASE NEW.payment_source
        WHEN 'OPD_SERVICE' THEN 'OPD service payment received'
        WHEN 'PHARMACY' THEN 'Pharmacy bill payment received'
        WHEN 'PHYSIOTHERAPY' THEN 'Physiotherapy payment received'
        WHEN 'DIRECT_SALE' THEN 'Direct pharmacy sale payment received'
        ELSE 'Payment received'
      END
    );

  END IF;

  -- Only process CASH payments
  IF v_payment_mode NOT IN ('CASH', 'Cash', 'cash') THEN
    RETURN NEW;
  END IF;

  -- Get Receipt voucher type ID
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_code = 'REC';

  -- Get Cash in Hand account ID (account code 1110)
  SELECT id INTO v_cash_account_id
  FROM chart_of_accounts
  WHERE account_code = '1110' AND account_name = 'Cash in Hand';

  -- Get Income account ID for revenue (using INCOME account code 4000)
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '4000' AND account_name = 'INCOME';

  -- If accounts don't exist, log error and skip
  IF v_cash_account_id IS NULL OR v_revenue_account_id IS NULL THEN
    RAISE WARNING 'Cash or Revenue account not found. Voucher not created.';
    RETURN NEW;
  END IF;

  -- Generate voucher number
  v_voucher_number := generate_voucher_number('REC');
  v_voucher_id := gen_random_uuid();

  -- Create voucher header
  INSERT INTO vouchers (
    id,
    voucher_number,
    voucher_type_id,
    voucher_date,
    reference_number,
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
    v_payment_date,
    CASE
      WHEN TG_TABLE_NAME = 'final_payments' THEN NEW.visit_id::TEXT
      WHEN TG_TABLE_NAME = 'patient_payment_transactions' THEN NEW.id::TEXT
      ELSE NULL
    END,
    v_narration,
    v_payment_amount,
    v_patient_id,
    'AUTHORISED',  -- Auto-authorize cash receipts
    COALESCE(NEW.created_by, 'system'),
    NOW(),
    NOW()
  );

  -- Create voucher entry 1: DEBIT Cash in Hand
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
    v_cash_account_id,
    'Cash received from patient',
    v_payment_amount,
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
    'Patient payment received',
    0,
    v_payment_amount,
    NOW()
  );

  RAISE NOTICE 'Receipt voucher % created for cash payment of %', v_voucher_number, v_payment_amount;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Create trigger on patient_payment_transactions table
-- ============================================================================
DROP TRIGGER IF EXISTS trg_patient_payment_create_voucher ON patient_payment_transactions;
CREATE TRIGGER trg_patient_payment_create_voucher
  AFTER INSERT ON patient_payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_receipt_voucher_for_payment();

-- ============================================================================
-- STEP 4: Create helper function to record OPD service payments
-- ============================================================================
CREATE OR REPLACE FUNCTION record_opd_service_payment(
  p_visit_id TEXT,
  p_amount DECIMAL(15,2),
  p_payment_mode VARCHAR(20),
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_service_details JSONB DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_patient_id UUID;
  v_payment_id UUID;
BEGIN
  -- Get patient_id from visit
  SELECT patient_id INTO v_patient_id
  FROM visits
  WHERE visit_id = p_visit_id;

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Visit not found: %', p_visit_id;
  END IF;

  -- Insert payment transaction
  INSERT INTO patient_payment_transactions (
    patient_id,
    visit_id,
    payment_source,
    source_table_name,
    payment_date,
    payment_mode,
    amount,
    narration,
    service_details,
    created_by
  ) VALUES (
    v_patient_id,
    p_visit_id,
    'OPD_SERVICE',
    'visit_clinical_services',
    p_payment_date,
    p_payment_mode,
    p_amount,
    'OPD service charges',
    p_service_details,
    p_created_by
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Create helper function to record pharmacy payments
-- ============================================================================
CREATE OR REPLACE FUNCTION record_pharmacy_payment(
  p_sale_id INTEGER,
  p_amount DECIMAL(15,2),
  p_payment_mode VARCHAR(20),
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_medicine_details JSONB DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_patient_id UUID;
  v_visit_id UUID;
  v_payment_id UUID;
BEGIN
  -- Get patient and visit info from pharmacy_sales
  SELECT patient_id, visit_id INTO v_patient_id, v_visit_id
  FROM pharmacy_sales
  WHERE sale_id = p_sale_id;

  IF v_patient_id IS NULL THEN
    -- This might be a direct sale (non-patient)
    -- In that case, we still record it but without patient link
    NULL;
  END IF;

  -- Insert payment transaction
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
    service_details,
    created_by
  ) VALUES (
    v_patient_id,
    v_visit_id,
    'PHARMACY',
    'pharmacy_sales',
    p_sale_id::TEXT,
    p_payment_date,
    p_payment_mode,
    p_amount,
    'Pharmacy bill payment',
    p_medicine_details,
    p_created_by
  )
  RETURNING id INTO v_payment_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================
COMMENT ON FUNCTION record_opd_service_payment IS
'Helper function to record OPD service payments in patient_payment_transactions table';

COMMENT ON FUNCTION record_pharmacy_payment IS
'Helper function to record pharmacy bill payments in patient_payment_transactions table';

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION record_opd_service_payment TO authenticated;
GRANT EXECUTE ON FUNCTION record_pharmacy_payment TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Patient payment transactions table created successfully!';
  RAISE NOTICE 'Trigger function extended to handle all payment types.';
  RAISE NOTICE 'Helper functions created for OPD and Pharmacy payments.';
END $$;
