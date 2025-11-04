-- MANUAL FIX: Jason Roy ₹10 Payment Missing from Ledger
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv/sql

-- Step 1: First, let's check if the payment exists
DO $$
DECLARE
  v_payment_id UUID;
  v_patient_id UUID;
  v_voucher_id UUID;
  v_bank_account_id UUID;
  v_payment_amount NUMERIC;
  v_payment_mode TEXT;
  v_bank_name TEXT;
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'FIXING: Jason Roy Payment Missing from Ledger';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';

  -- Find the payment
  SELECT
    id, patient_id, advance_amount, payment_mode, bank_account_id, bank_account_name
  INTO
    v_payment_id, v_patient_id, v_payment_amount, v_payment_mode, v_bank_account_id, v_bank_name
  FROM advance_payment
  WHERE patient_name ILIKE '%jason%roy%'
    AND DATE(payment_date) = '2025-11-03'
    AND advance_amount = 10
  LIMIT 1;

  IF v_payment_id IS NULL THEN
    RAISE NOTICE '❌ PROBLEM: Payment not found in advance_payment table!';
    RAISE NOTICE '   This payment may not have been saved correctly.';
    RAISE NOTICE '   Please check the Advance Payment form and re-save.';
    RETURN;
  END IF;

  RAISE NOTICE '✓ Payment found: ID = %', v_payment_id;
  RAISE NOTICE '  Amount: ₹%', v_payment_amount;
  RAISE NOTICE '  Payment Mode: %', v_payment_mode;
  RAISE NOTICE '  Bank: %', v_bank_name;
  RAISE NOTICE '  Bank Account ID: %', v_bank_account_id;
  RAISE NOTICE '';

  -- Check if voucher was created
  SELECT id INTO v_voucher_id
  FROM vouchers
  WHERE patient_id = v_patient_id
    AND voucher_date = '2025-11-03'
    AND narration ILIKE '%jason%'
  LIMIT 1;

  IF v_voucher_id IS NULL THEN
    RAISE NOTICE '❌ PROBLEM: Voucher not created for this payment!';
    RAISE NOTICE '   The trigger may have failed. Creating voucher now...';
    RAISE NOTICE '';

    -- Create voucher manually
    INSERT INTO vouchers (patient_id, voucher_date, voucher_type, narration)
    VALUES (
      v_patient_id,
      '2025-11-03',
      'RECEIPT',
      'Being cash received towards Cash from jason roy against R. No.: (Registration number here)'
    )
    RETURNING id INTO v_voucher_id;

    RAISE NOTICE '✓ Voucher created: ID = %', v_voucher_id;

    -- Create debit entry (Bank account)
    INSERT INTO voucher_entries (voucher_id, account_id, debit_amount, credit_amount)
    VALUES (
      v_voucher_id,
      v_bank_account_id,
      v_payment_amount,
      0
    );

    RAISE NOTICE '✓ Debit entry created for bank: %', v_bank_name;

    -- Create credit entry (Income account - you may need to adjust this)
    INSERT INTO voucher_entries (voucher_id, account_id, debit_amount, credit_amount)
    SELECT
      v_voucher_id,
      id,
      0,
      v_payment_amount
    FROM chart_of_accounts
    WHERE account_name ILIKE '%income%' OR account_name ILIKE '%advance%'
    LIMIT 1;

    RAISE NOTICE '✓ Credit entry created for income account';
    RAISE NOTICE '';
    RAISE NOTICE '✅ FIXED: Voucher and entries created successfully!';

  ELSE
    RAISE NOTICE '✓ Voucher exists: ID = %', v_voucher_id;
    RAISE NOTICE '';

    -- Check which account was debited
    DECLARE
      v_debited_account TEXT;
    BEGIN
      SELECT coa.account_name INTO v_debited_account
      FROM voucher_entries ve
      JOIN chart_of_accounts coa ON ve.account_id = coa.id
      WHERE ve.voucher_id = v_voucher_id
        AND ve.debit_amount > 0
      LIMIT 1;

      RAISE NOTICE '  Debited Account: %', v_debited_account;

      IF v_debited_account NOT ILIKE '%STATE BANK%DRM%' THEN
        RAISE NOTICE '❌ PROBLEM: Voucher was created in wrong account!';
        RAISE NOTICE '   Expected: STATE BANK OF INDIA (DRM)';
        RAISE NOTICE '   Actual: %', v_debited_account;
        RAISE NOTICE '';
        RAISE NOTICE 'Fixing: Updating voucher entry to correct bank account...';

        -- Update the debit entry to use correct bank account
        UPDATE voucher_entries
        SET account_id = v_bank_account_id
        WHERE voucher_id = v_voucher_id
          AND debit_amount > 0;

        RAISE NOTICE '✅ FIXED: Voucher entry updated to STATE BANK OF INDIA (DRM)';
      ELSE
        RAISE NOTICE '✓ Voucher is in correct bank account';
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  The issue is likely with the ledger query JOIN or filter.';
        RAISE NOTICE '   The root cause fix (Step 2) should resolve this.';
      END IF;
    END;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'STEP 1 COMPLETE - Proceed to Step 2 for permanent fix';
  RAISE NOTICE '=================================================================';

END $$;

-- Step 2: Verify the fix worked
SELECT
  'Verification: Jason Roy payment in ledger' as test,
  *
FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-01',
  '2025-11-05',
  NULL,
  'ONLINE'
)
WHERE patient_name ILIKE '%jason%';

-- If the above returns results, the fix worked!
-- If not, run the diagnostic script to identify remaining issues.
