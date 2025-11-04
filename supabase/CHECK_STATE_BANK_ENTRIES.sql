-- ============================================================================
-- Check if STATE BANK OF INDIA (DRM) has any entries
-- ============================================================================

-- TEST 1: Get STATE BANK account ID
SELECT
  'TEST 1: STATE BANK account details' as test,
  id as account_id,
  account_code,
  account_name,
  account_group
FROM chart_of_accounts
WHERE account_name = 'STATE BANK OF INDIA (DRM)';

-- TEST 2: Check voucher_entries for STATE BANK account
SELECT
  'TEST 2: voucher_entries for STATE BANK' as test,
  ve.id,
  ve.voucher_id,
  ve.account_id,
  ve.debit_amount,
  ve.credit_amount,
  v.voucher_date,
  v.voucher_number,
  coa.account_name
FROM voucher_entries ve
JOIN vouchers v ON ve.voucher_id = v.id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE coa.account_name = 'STATE BANK OF INDIA (DRM)'
  AND v.voucher_date BETWEEN '2025-10-30' AND '2025-11-03'
ORDER BY v.voucher_date DESC;

-- TEST 3: Check advance_payment entries and their bank_account_id
SELECT
  'TEST 3: advance_payment with bank details' as test,
  ap.id,
  ap.payment_date,
  ap.advance_amount,
  ap.payment_mode,
  ap.bank_account_id,
  coa.account_name as bank_account_name,
  ap.visit_id
FROM advance_payment ap
LEFT JOIN chart_of_accounts coa ON ap.bank_account_id = coa.id
WHERE DATE(ap.payment_date) BETWEEN '2025-10-30' AND '2025-11-03'
  AND ap.payment_mode = 'ONLINE'
ORDER BY ap.payment_date DESC;

-- TEST 4: Check if advance_payment.bank_account_id matches STATE BANK
SELECT
  'TEST 4: Which bank do Nov 3 payments belong to?' as test,
  ap.payment_date,
  ap.advance_amount,
  coa.account_name as bank_account,
  ap.visit_id
FROM advance_payment ap
LEFT JOIN chart_of_accounts coa ON ap.bank_account_id = coa.id
WHERE DATE(ap.payment_date) = '2025-11-03'
  AND ap.payment_mode = 'ONLINE';
