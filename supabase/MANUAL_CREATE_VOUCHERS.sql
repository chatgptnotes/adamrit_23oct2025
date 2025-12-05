-- ============================================================================
-- MANUAL VOUCHER CREATION - Simple & Direct Approach
-- Date: 2025-11-03
-- Purpose: Manually create vouchers for the 2 ONLINE payments
--          Bypasses all complex logic - just creates what's needed
-- ============================================================================

DO $$
DECLARE
    -- Account IDs
    v_saraswat_bank_id UUID;
    v_income_account_id UUID;
    v_voucher_type_id UUID;

    -- Payment 1 (31/10/2025 - Rs 50)
    v_payment1_id UUID;
    v_patient1_id UUID;
    v_patient1_name TEXT;
    v_patient1_mrn TEXT;

    -- Payment 2 (01/11/2025 - Rs 10)
    v_payment2_id UUID;
    v_patient2_id UUID;
    v_patient2_name TEXT;
    v_patient2_mrn TEXT;

    -- Voucher IDs
    v_voucher1_id UUID;
    v_voucher2_id UUID;

BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MANUAL VOUCHER CREATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- ========================================================================
    -- Get required account IDs
    -- ========================================================================

    -- Get SARASWAT BANK
    SELECT id INTO v_saraswat_bank_id
    FROM chart_of_accounts
    WHERE account_name = 'SARASWAT BANK'
    LIMIT 1;

    IF v_saraswat_bank_id IS NULL THEN
        RAISE EXCEPTION 'SARASWAT BANK account not found!';
    END IF;

    -- Get INCOME account
    SELECT id INTO v_income_account_id
    FROM chart_of_accounts
    WHERE account_code = '4000'
      AND account_name = 'INCOME'
    LIMIT 1;

    IF v_income_account_id IS NULL THEN
        RAISE EXCEPTION 'INCOME account not found!';
    END IF;

    -- Get Receipt voucher type
    SELECT id INTO v_voucher_type_id
    FROM voucher_types
    WHERE voucher_type_code IN ('REC', 'RV')
      AND voucher_category = 'RECEIPT'
    LIMIT 1;

    IF v_voucher_type_id IS NULL THEN
        RAISE EXCEPTION 'Receipt voucher type not found!';
    END IF;

    RAISE NOTICE 'Account IDs found:';
    RAISE NOTICE '  SARASWAT BANK: %', v_saraswat_bank_id;
    RAISE NOTICE '  INCOME: %', v_income_account_id;
    RAISE NOTICE '  Voucher Type: %', v_voucher_type_id;
    RAISE NOTICE '';

    -- ========================================================================
    -- Get the 2 ONLINE payment records
    -- ========================================================================

    -- Payment 1: 31/10/2025
    SELECT
        ap.id, ap.patient_id, p.name, p.patients_id
    INTO
        v_payment1_id, v_patient1_id, v_patient1_name, v_patient1_mrn
    FROM advance_payment ap
    JOIN patients p ON p.id = ap.patient_id
    WHERE ap.payment_date = '2025-10-31'
      AND ap.payment_mode = 'ONLINE'
    LIMIT 1;

    -- Payment 2: 01/11/2025
    SELECT
        ap.id, ap.patient_id, p.name, p.patients_id
    INTO
        v_payment2_id, v_patient2_id, v_patient2_name, v_patient2_mrn
    FROM advance_payment ap
    JOIN patients p ON p.id = ap.patient_id
    WHERE ap.payment_date = '2025-11-01'
      AND ap.payment_mode = 'ONLINE'
    LIMIT 1;

    IF v_payment1_id IS NULL AND v_payment2_id IS NULL THEN
        RAISE EXCEPTION 'No ONLINE payments found for 31/10 or 01/11!';
    END IF;

    RAISE NOTICE 'Found payments:';
    IF v_payment1_id IS NOT NULL THEN
        RAISE NOTICE '  Payment 1: 31/10/2025 - Patient: % (MRN: %)', v_patient1_name, v_patient1_mrn;
    END IF;
    IF v_payment2_id IS NOT NULL THEN
        RAISE NOTICE '  Payment 2: 01/11/2025 - Patient: % (MRN: %)', v_patient2_name, v_patient2_mrn;
    END IF;
    RAISE NOTICE '';

    -- ========================================================================
    -- CREATE VOUCHER 1 (31/10/2025 - Rs 50)
    -- ========================================================================

    IF v_payment1_id IS NOT NULL THEN
        RAISE NOTICE 'Creating voucher 1 for 31/10/2025...';

        v_voucher1_id := gen_random_uuid();

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
            v_voucher1_id,
            'REC-9001',  -- Manual voucher number
            v_voucher_type_id,
            '2025-10-31'::DATE,
            'Advance payment received via ONLINE - SARASWAT BANK',
            50.00,
            v_patient1_id,
            'AUTHORISED',
            NULL,  -- created_by is UUID, set to NULL
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
            v_voucher1_id,
            v_saraswat_bank_id,
            'Payment received from ' || v_patient1_name || ' via ONLINE to SARASWAT BANK',
            50.00,
            0,
            NOW()
        );

        -- Create credit entry (INCOME)
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
            v_voucher1_id,
            v_income_account_id,
            'Advance payment received',
            0,
            50.00,
            NOW()
        );

        RAISE NOTICE '✓ Voucher REC-9001 created for 31/10/2025 - Rs 50';
    END IF;

    -- ========================================================================
    -- CREATE VOUCHER 2 (01/11/2025 - Rs 10)
    -- ========================================================================

    IF v_payment2_id IS NOT NULL THEN
        RAISE NOTICE 'Creating voucher 2 for 01/11/2025...';

        v_voucher2_id := gen_random_uuid();

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
            v_voucher2_id,
            'REC-9002',  -- Manual voucher number
            v_voucher_type_id,
            '2025-11-01'::DATE,
            'Advance payment received via ONLINE - SARASWAT BANK',
            10.00,
            v_patient2_id,
            'AUTHORISED',
            NULL,  -- created_by is UUID, set to NULL
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
            v_voucher2_id,
            v_saraswat_bank_id,
            'Payment received from ' || v_patient2_name || ' via ONLINE to SARASWAT BANK',
            10.00,
            0,
            NOW()
        );

        -- Create credit entry (INCOME)
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
            v_voucher2_id,
            v_income_account_id,
            'Advance payment received',
            0,
            10.00,
            NOW()
        );

        RAISE NOTICE '✓ Voucher REC-9002 created for 01/11/2025 - Rs 10';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ ✓ ✓ VOUCHERS CREATED SUCCESSFULLY! ✓ ✓ ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Refresh your browser (Ctrl+F5)';
    RAISE NOTICE '  2. Go to Ledger Statement';
    RAISE NOTICE '  3. Select SARASWAT BANK';
    RAISE NOTICE '  4. Set dates: 01-11-2025';
    RAISE NOTICE '  5. Transactions should now appear!';
    RAISE NOTICE '';

END $$;

-- Verify vouchers were created
SELECT
    '=== VERIFICATION: Created Vouchers ===' as verification,
    voucher_number,
    voucher_date,
    total_amount,
    narration
FROM vouchers
WHERE voucher_number IN ('REC-9001', 'REC-9002')
ORDER BY voucher_date;
