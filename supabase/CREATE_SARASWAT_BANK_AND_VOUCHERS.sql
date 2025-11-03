-- ============================================================================
-- CREATE SARASWAT BANK ACCOUNT AND MISSING VOUCHERS
-- Date: 2025-11-03
-- Purpose: Add SARASWAT BANK to chart_of_accounts and create missing vouchers
-- ============================================================================

-- ============================================================================
-- STEP 1: Create SARASWAT BANK account in chart_of_accounts
-- ============================================================================

DO $$
DECLARE
    v_saraswat_bank_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 1: Creating SARASWAT BANK account';
    RAISE NOTICE '========================================';

    -- Check if account already exists
    SELECT id INTO v_saraswat_bank_id
    FROM chart_of_accounts
    WHERE account_name = 'SARASWAT BANK';

    IF v_saraswat_bank_id IS NOT NULL THEN
        RAISE NOTICE 'SARASWAT BANK already exists with ID: %', v_saraswat_bank_id;
    ELSE
        -- Create new bank account
        INSERT INTO chart_of_accounts (
            id,
            account_code,
            account_name,
            account_type,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            '1125',  -- Bank account code (similar to Cash at Bank 1120)
            'SARASWAT BANK',
            'ASSETS',  -- Bank accounts are assets (plural as per constraint)
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_saraswat_bank_id;

        RAISE NOTICE '✓ SARASWAT BANK created with ID: %', v_saraswat_bank_id;
    END IF;

    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 2: Update advance_payment records to link with SARASWAT BANK
-- ============================================================================

DO $$
DECLARE
    v_saraswat_bank_id UUID;
    v_updated_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 2: Linking advance payments to SARASWAT BANK';
    RAISE NOTICE '========================================';

    -- Get SARASWAT BANK ID
    SELECT id INTO v_saraswat_bank_id
    FROM chart_of_accounts
    WHERE account_name = 'SARASWAT BANK';

    IF v_saraswat_bank_id IS NULL THEN
        RAISE EXCEPTION 'SARASWAT BANK not found! Run STEP 1 first.';
    END IF;

    -- Update all ONLINE payments with SARASWAT BANK name to link to actual account
    UPDATE advance_payment
    SET
        bank_account_id = v_saraswat_bank_id,
        updated_at = NOW()
    WHERE payment_mode = 'ONLINE'
      AND (bank_account_name = 'SARASWAT BANK' OR bank_account_name IS NULL)
      AND bank_account_id IS NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RAISE NOTICE '✓ Updated % payment records with bank_account_id', v_updated_count;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: Create vouchers for ONLINE payments to SARASWAT BANK
-- ============================================================================

DO $$
DECLARE
    payment_record RECORD;
    v_voucher_id UUID;
    v_voucher_number TEXT;
    v_voucher_type_id UUID;
    v_voucher_type_code TEXT;
    v_saraswat_bank_id UUID;
    v_revenue_account_id UUID;
    v_created_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
    v_error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 3: Creating vouchers for ONLINE payments';
    RAISE NOTICE '========================================';

    -- Get SARASWAT BANK account
    SELECT id INTO v_saraswat_bank_id
    FROM chart_of_accounts
    WHERE account_name = 'SARASWAT BANK'
      AND is_active = true;

    IF v_saraswat_bank_id IS NULL THEN
        RAISE EXCEPTION 'SARASWAT BANK account not found in chart_of_accounts!';
    END IF;

    -- Get Receipt voucher type
    SELECT id, voucher_type_code INTO v_voucher_type_id, v_voucher_type_code
    FROM voucher_types
    WHERE voucher_type_code IN ('REC', 'RV')
      AND voucher_category = 'RECEIPT'
      AND is_active = true
    ORDER BY CASE WHEN voucher_type_code = 'REC' THEN 1 ELSE 2 END
    LIMIT 1;

    -- Get INCOME account
    SELECT id INTO v_revenue_account_id
    FROM chart_of_accounts
    WHERE account_code = '4000'
      AND account_name = 'INCOME';

    IF v_voucher_type_id IS NULL THEN
        RAISE EXCEPTION 'Receipt voucher type not found!';
    END IF;

    IF v_revenue_account_id IS NULL THEN
        RAISE EXCEPTION 'INCOME account not found!';
    END IF;

    RAISE NOTICE 'Using:';
    RAISE NOTICE '  - SARASWAT BANK ID: %', v_saraswat_bank_id;
    RAISE NOTICE '  - Voucher Type: % (ID: %)', v_voucher_type_code, v_voucher_type_id;
    RAISE NOTICE '  - Revenue Account ID: %', v_revenue_account_id;
    RAISE NOTICE '';

    -- Loop through ONLINE payments that don't have vouchers
    FOR payment_record IN
        SELECT
            ap.id,
            ap.patient_id,
            ap.advance_amount,
            ap.payment_date,
            ap.payment_mode,
            ap.bank_account_name,
            ap.remarks,
            p.name as patient_name,
            p.patients_id as mrn_number
        FROM advance_payment ap
        JOIN patients p ON p.id = ap.patient_id
        WHERE ap.payment_mode = 'ONLINE'
          AND (ap.bank_account_name = 'SARASWAT BANK' OR ap.bank_account_id = v_saraswat_bank_id)
          AND NOT EXISTS (
              SELECT 1
              FROM vouchers v
              WHERE v.patient_id = ap.patient_id
                AND v.voucher_date = ap.payment_date::DATE
                AND v.total_amount = ap.advance_amount
                AND v.narration ILIKE '%ONLINE%'
          )
        ORDER BY ap.payment_date, ap.created_at
    LOOP
        BEGIN
            -- Generate voucher number
            v_voucher_number := generate_voucher_number(v_voucher_type_code);
            v_voucher_id := gen_random_uuid();

            -- Create voucher header
            INSERT INTO vouchers (
                id,
                voucher_number,
                voucher_type_id,
                voucher_date,
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
                payment_record.payment_date::DATE,
                'Advance payment received via ONLINE - SARASWAT BANK',
                payment_record.advance_amount,
                payment_record.patient_id,
                'AUTHORISED',
                'system_backfill',
                NOW(),
                NOW()
            );

            -- Create debit entry (SARASWAT BANK)
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
                v_saraswat_bank_id,
                'Payment received from ' || payment_record.patient_name || ' (MRN: ' || payment_record.mrn_number || ') via ONLINE to SARASWAT BANK',
                payment_record.advance_amount,
                0,
                NOW()
            );

            -- Create credit entry (Revenue/Income)
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
                'Advance payment received from patient',
                0,
                payment_record.advance_amount,
                NOW()
            );

            v_created_count := v_created_count + 1;

            RAISE NOTICE '✓ Created voucher % for date % amount Rs %',
                v_voucher_number,
                payment_record.payment_date,
                payment_record.advance_amount;

        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '✗ Error creating voucher for payment % (Date: %, Amount: %): %',
                payment_record.id,
                payment_record.payment_date,
                payment_record.advance_amount,
                SQLERRM;
            v_error_count := v_error_count + 1;
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VOUCHER CREATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Vouchers created: %', v_created_count;
    RAISE NOTICE 'Errors: %', v_error_count;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 4: Verify the fix
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STEP 4: Verification';
    RAISE NOTICE '========================================';
END $$;

-- Show SARASWAT BANK account
SELECT
    'SARASWAT BANK ACCOUNT:' as verification_step,
    id,
    account_code,
    account_name,
    is_active
FROM chart_of_accounts
WHERE account_name = 'SARASWAT BANK';

-- Show created vouchers
SELECT
    'CREATED VOUCHERS:' as verification_step,
    v.voucher_number,
    v.voucher_date,
    v.total_amount,
    p.name as patient_name,
    p.patients_id as mrn_number
FROM vouchers v
JOIN patients p ON p.id = v.patient_id
WHERE v.narration LIKE '%ONLINE%'
  AND v.narration LIKE '%SARASWAT%'
ORDER BY v.voucher_date DESC
LIMIT 10;

-- Test ledger statement function
SELECT
    'LEDGER STATEMENT RESULT:' as verification_step,
    voucher_date,
    patient_name,
    mrn_number,
    payment_mode,
    debit_amount,
    bank_account
FROM get_ledger_statement_with_patients(
    'SARASWAT BANK',
    '2025-10-01',
    '2025-11-30',
    NULL,
    'ONLINE'
)
ORDER BY voucher_date DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ ✓ ✓ FIX COMPLETE! ✓ ✓ ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '  1. Created SARASWAT BANK account in chart_of_accounts';
    RAISE NOTICE '  2. Linked advance_payment records to SARASWAT BANK';
    RAISE NOTICE '  3. Created vouchers for all ONLINE payments';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Refresh your browser (Ctrl+F5)';
    RAISE NOTICE '  2. Go to Ledger Statement page';
    RAISE NOTICE '  3. Select SARASWAT BANK';
    RAISE NOTICE '  4. Set date range (e.g., 01-11-2025)';
    RAISE NOTICE '  5. ONLINE transactions should now appear!';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
