-- ============================================================================
-- Add Payment Triggers for Pharmacy Sales and OPD Services
-- This migration creates triggers to automatically record payments when
-- pharmacy sales or OPD services are billed
-- ============================================================================

-- ============================================================================
-- STEP 1: Create trigger function for pharmacy_sales
-- ============================================================================
CREATE OR REPLACE FUNCTION record_pharmacy_sale_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_id UUID;
  v_patient_uuid UUID;
  v_visit_uuid UUID;
  v_service_details JSONB;
BEGIN
  -- Only process if payment is made (skip PENDING status)
  IF NEW.payment_status = 'PENDING' THEN
    RETURN NEW;
  END IF;

  -- Convert patient_id and visit_id to UUID if they exist and are valid UUIDs
  BEGIN
    IF NEW.patient_id IS NOT NULL THEN
      -- Check if it's a valid UUID format
      IF NEW.patient_id::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_patient_uuid := NEW.patient_id::UUID;
      END IF;
    END IF;

    IF NEW.visit_id IS NOT NULL THEN
      -- Check if it's a valid UUID format
      IF NEW.visit_id::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_visit_uuid := NEW.visit_id::UUID;
      END IF;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If conversion fails, just set to NULL
      v_patient_uuid := NULL;
      v_visit_uuid := NULL;
  END;

  -- Build service details JSON
  v_service_details := jsonb_build_object(
    'sale_type', NEW.sale_type,
    'patient_name', NEW.patient_name,
    'prescription_number', NEW.prescription_number,
    'doctor_name', NEW.doctor_name,
    'subtotal', NEW.subtotal,
    'discount', NEW.discount,
    'tax_gst', NEW.tax_gst,
    'sale_date', NEW.sale_date
  );

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
    service_details,
    created_by,
    created_at
  ) VALUES (
    v_patient_uuid,
    v_visit_uuid,
    'PHARMACY',
    'pharmacy_sales',
    NEW.sale_id::TEXT,
    COALESCE(NEW.sale_date::DATE, CURRENT_DATE),
    UPPER(NEW.payment_method), -- Normalize to uppercase
    NEW.total_amount,
    CASE
      WHEN NEW.patient_name IS NOT NULL THEN
        'Pharmacy sale to ' || NEW.patient_name
      ELSE
        'Pharmacy direct sale'
    END,
    v_service_details,
    COALESCE(NEW.created_by, 'system'),
    NOW()
  )
  RETURNING id INTO v_payment_id;

  RAISE NOTICE 'Payment transaction % recorded for pharmacy sale %', v_payment_id, NEW.sale_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: Create trigger on pharmacy_sales
-- ============================================================================
DROP TRIGGER IF EXISTS trg_pharmacy_sale_record_payment ON pharmacy_sales;
CREATE TRIGGER trg_pharmacy_sale_record_payment
  AFTER INSERT ON pharmacy_sales
  FOR EACH ROW
  WHEN (NEW.payment_status != 'PENDING')
  EXECUTE FUNCTION record_pharmacy_sale_payment();

-- ============================================================================
-- STEP 3: Create helper function to record OPD service payment (bulk)
-- ============================================================================
-- This function should be called from the frontend when OPD services are billed
-- It will create a single payment transaction for all services in a visit

CREATE OR REPLACE FUNCTION record_opd_visit_payment(
  p_visit_id TEXT,
  p_payment_mode VARCHAR(20),
  p_amount DECIMAL(15,2),
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_narration TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_patient_id UUID;
  v_payment_id UUID;
  v_service_details JSONB;
  v_services_count INTEGER;
BEGIN
  -- Get patient_id from visit
  SELECT patient_id INTO v_patient_id
  FROM visits
  WHERE visit_id = p_visit_id;

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Visit not found: %', p_visit_id;
  END IF;

  -- Get services details for this visit
  SELECT
    COUNT(*),
    jsonb_agg(
      jsonb_build_object(
        'service_id', vcs.clinical_service_id,
        'service_name', cs.service_name,
        'quantity', vcs.quantity,
        'rate_used', vcs.rate_used,
        'rate_type', vcs.rate_type,
        'amount', vcs.amount
      )
    )
  INTO v_services_count, v_service_details
  FROM visit_clinical_services vcs
  LEFT JOIN clinical_services cs ON cs.id = vcs.clinical_service_id
  WHERE vcs.visit_id = p_visit_id;

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
    created_by,
    created_at
  ) VALUES (
    v_patient_id,
    p_visit_id,
    'OPD_SERVICE',
    'visit_clinical_services',
    p_payment_date,
    UPPER(p_payment_mode),
    p_amount,
    COALESCE(
      p_narration,
      'OPD service payment - ' || v_services_count || ' service(s)'
    ),
    v_service_details,
    p_created_by,
    NOW()
  )
  RETURNING id INTO v_payment_id;

  RAISE NOTICE 'OPD payment transaction % recorded for visit %', v_payment_id, p_visit_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: Add comments
-- ============================================================================
COMMENT ON FUNCTION record_pharmacy_sale_payment() IS
'Automatically records payment transaction when pharmacy sale is completed (excluding PENDING status)';

COMMENT ON FUNCTION record_opd_visit_payment IS
'Records payment for OPD services. Call this function from frontend when billing OPD services.';

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION record_opd_visit_payment TO authenticated;

-- ============================================================================
-- STEP 6: Sample usage examples (for documentation)
-- ============================================================================
-- Example: Record OPD service payment from frontend
-- SELECT record_opd_visit_payment(
--   p_visit_id := 'visit-uuid-here',
--   p_payment_mode := 'CASH',
--   p_amount := 1500.00,
--   p_payment_date := CURRENT_DATE,
--   p_narration := 'Consultation and X-ray charges',
--   p_created_by := 'user-uuid-here'
-- );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Payment triggers created successfully!';
  RAISE NOTICE '  - Pharmacy sales will auto-record payments';
  RAISE NOTICE '  - OPD payments can be recorded via record_opd_visit_payment()';
END $$;
