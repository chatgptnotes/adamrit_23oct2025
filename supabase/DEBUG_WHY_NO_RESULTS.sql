-- ============================================================================
-- Debug: Why Ledger Statement Returns Empty Results
-- Date: 2025-11-03
-- ============================================================================

-- ============================================================================
-- TEST 1: Do voucher entries exist for STATE BANK OF INDIA (DRM)?
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'TEST 1: Raw voucher entries in STATE BANK OF INDIA (DRM)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  v.voucher_number,
  v.voucher_date,
  coa.account_name,
  p.name as patient_name,
  ve.debit_amount,
  ve.credit_amount,
  'Found in voucher_entries ✓' as status
FROM voucher_entries ve
JOIN chart_of_accounts coa ON ve.account_id = coa.id
JOIN vouchers v ON ve.voucher_id = v.id
LEFT JOIN patients p ON v.patient_id = p.id
WHERE coa.account_name = 'STATE BANK OF INDIA (DRM)'
  AND v.voucher_date = '2025-11-03'
ORDER BY v.voucher_number;

-- ============================================================================
-- TEST 2: Test ledger function WITHOUT payment mode filter
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'TEST 2: Ledger function WITHOUT payment mode filter';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  voucher_date,
  voucher_number,
  patient_name,
  debit_amount,
  credit_amount,
  payment_mode,
  CASE
    WHEN payment_mode = '' THEN '⚠️ BLANK - This is the problem!'
    ELSE '✓ Has value'
  END as payment_mode_status
FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-03',
  '2025-11-03',
  NULL,  -- No MRN filter
  NULL   -- No payment mode filter
)
ORDER BY voucher_date;

-- ============================================================================
-- TEST 3: Test ledger function WITH 'ONLINE' filter
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'TEST 3: Ledger function WITH "ONLINE" payment mode filter';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  voucher_date,
  voucher_number,
  patient_name,
  debit_amount,
  credit_amount,
  payment_mode
FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-03',
  '2025-11-03',
  NULL,
  'ONLINE'  -- WITH payment mode filter
)
ORDER BY voucher_date;

-- ============================================================================
-- TEST 4: Check what payment_mode is being returned
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'TEST 4: Analyze payment_mode values';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

SELECT
  ve.id as entry_id,
  coa.account_name,
  coa.account_group,
  ve.debit_amount,
  ap.payment_mode as ap_payment_mode,
  ap.id as ap_id,
  CASE
    WHEN ap.id IS NOT NULL THEN 'JOIN successful ✓'
    ELSE 'JOIN failed ✗'
  END as join_status,
  -- This is what the function returns:
  COALESCE(
    ap.payment_mode::TEXT,
    CASE
      WHEN coa.account_group = 'BANK' AND ve.debit_amount > 0 THEN 'ONLINE'
      WHEN coa.account_name ILIKE '%bank%' AND ve.debit_amount > 0 THEN 'ONLINE'
      ELSE ''
    END
  ) as computed_payment_mode
FROM voucher_entries ve
JOIN vouchers v ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
LEFT JOIN patients p ON v.patient_id = p.id
LEFT JOIN advance_payment ap ON (
  ap.patient_id = v.patient_id
  AND DATE(ap.payment_date) = v.voucher_date
  AND (
    ap.advance_amount = GREATEST(ve.debit_amount, ve.credit_amount)
    OR ABS(ap.advance_amount - GREATEST(ve.debit_amount, ve.credit_amount)) < 0.01
    OR ap.bank_account_id = coa.id
  )
)
WHERE coa.account_name = 'STATE BANK OF INDIA (DRM)'
  AND v.voucher_date = '2025-11-03';

-- ============================================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================================
DO $$
DECLARE
  raw_entry_count INTEGER;
  without_filter_count INTEGER;
  with_filter_count INTEGER;
BEGIN
  -- Count raw entries
  SELECT COUNT(*) INTO raw_entry_count
  FROM voucher_entries ve
  JOIN chart_of_accounts coa ON ve.account_id = coa.id
  JOIN vouchers v ON ve.voucher_id = v.id
  WHERE coa.account_name = 'STATE BANK OF INDIA (DRM)'
    AND v.voucher_date = '2025-11-03';

  -- Count from function without filter
  SELECT COUNT(*) INTO without_filter_count
  FROM get_ledger_statement_with_patients(
    'STATE BANK OF INDIA (DRM)',
    '2025-11-03',
    '2025-11-03',
    NULL,
    NULL
  );

  -- Count from function with filter
  SELECT COUNT(*) INTO with_filter_count
  FROM get_ledger_statement_with_patients(
    'STATE BANK OF INDIA (DRM)',
    '2025-11-03',
    '2025-11-03',
    NULL,
    'ONLINE'
  );

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'DIAGNOSTIC SUMMARY';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Raw voucher entries in STATE BANK: %', raw_entry_count;
  RAISE NOTICE 'Ledger function WITHOUT filter: %', without_filter_count;
  RAISE NOTICE 'Ledger function WITH ONLINE filter: %', with_filter_count;
  RAISE NOTICE '';

  IF raw_entry_count = 0 THEN
    RAISE NOTICE '❌ ISSUE: No voucher entries found in STATE BANK!';
    RAISE NOTICE '   → Check if trigger created vouchers correctly';
    RAISE NOTICE '   → Check account routing logic';
  ELSIF without_filter_count = 0 THEN
    RAISE NOTICE '❌ ISSUE: Entries exist but function returns nothing!';
    RAISE NOTICE '   → Problem with function logic or WHERE clause';
  ELSIF with_filter_count = 0 AND without_filter_count > 0 THEN
    RAISE NOTICE '⚠️  ISSUE: Payment mode filter is excluding results!';
    RAISE NOTICE '   → payment_mode is blank or not matching "ONLINE"';
    RAISE NOTICE '   → Fix needed in payment_mode inference logic';
    RAISE NOTICE '   → See TEST 4 results above for payment_mode values';
  ELSE
    RAISE NOTICE '✅ Everything working! Results found: %', with_filter_count;
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
