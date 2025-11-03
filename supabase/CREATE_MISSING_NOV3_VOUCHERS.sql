-- ============================================================================
-- Manually create vouchers for Nov 3 ONLINE payments
-- These were missed because old trigger only handled CASH
-- ============================================================================

DO $$
DECLARE
  payment_rec RECORD;
  v_voucher_id UUID;
  v_voucher_number TEXT;
  v_voucher_type_id UUID;
  v_revenue_account_id UUID;
  v_system_user_id UUID;
  voucher_count INT := 0;
BEGIN
  -- Get Receipt voucher type
  SELECT id INTO v_voucher_type_id
  FROM voucher_types
  WHERE voucher_type_code = 'REC';

  -- Get Income account
  SELECT id INTO v_revenue_account_id
  FROM chart_of_accounts
  WHERE account_code = '4000' AND account_name = 'INCOME';

  -- Get a system user ID (first user in the system, or NULL if none)
  SELECT id INTO v_system_user_id
  FROM auth.users
  LIMIT 1;

  -- Loop through Nov 3 ONLINE payments that don't have vouchers
  FOR payment_rec IN
    SELECT
      ap.id,
      ap.patient_id,
      ap.advance_amount,
      ap.payment_date,
      ap.bank_account_id,
      ap.visit_id,
      coa.account_name as bank_name
    FROM advance_payment ap
    JOIN chart_of_accounts coa ON ap.bank_account_id = coa.id
    WHERE DATE(ap.payment_date) = '2025-11-03'
      AND ap.payment_mode = 'ONLINE'
      AND NOT EXISTS (
        -- Check if voucher already exists for this payment
        SELECT 1
        FROM vouchers v
        WHERE v.patient_id = ap.patient_id
          AND v.voucher_date = DATE(ap.payment_date)
          AND v.total_amount = ap.advance_amount
      )
  LOOP
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
      payment_rec.payment_date,
      NULL,
      'Advance payment received via ONLINE - ' || payment_rec.bank_name,
      payment_rec.advance_amount,
      payment_rec.patient_id,
      'AUTHORISED',
      v_system_user_id,
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
      payment_rec.bank_account_id,
      'Advance payment received via ONLINE - ' || payment_rec.bank_name,
      payment_rec.advance_amount,
      0,
      NOW()
    );

    -- Create voucher entry 2: CREDIT Income
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
      'Patient advance payment received',
      0,
      payment_rec.advance_amount,
      NOW()
    );

    voucher_count := voucher_count + 1;
    RAISE NOTICE 'Created voucher % for payment amount Rs %', v_voucher_number, payment_rec.advance_amount;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Created % vouchers for Nov 3 ONLINE payments', voucher_count;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
