-- Diagnostic queries for jason roy's ₹10 payment on 03/11/2025
-- This will help identify why the payment isn't showing in ledger

\echo '==================================================================='
\echo 'DIAGNOSTIC REPORT: Jason Roy Payment Missing from Ledger'
\echo 'Payment: ₹10, Date: 03/11/2025, Bank: STATE BANK OF INDIA (DRM)'
\echo '==================================================================='
\echo ''

-- Check 1: Does the payment exist in advance_payment table?
\echo '--- CHECK 1: Payment Existence in advance_payment ---'
SELECT
  id,
  patient_id,
  patient_name,
  advance_amount,
  payment_mode,
  payment_date,
  bank_account_id,
  bank_account_name,
  created_at
FROM advance_payment
WHERE patient_name ILIKE '%jason%roy%'
  AND DATE(payment_date) = '2025-11-03'
  AND advance_amount = 10;

\echo ''

-- Check 2: Get patient_id for jason roy
\echo '--- CHECK 2: Patient ID Lookup ---'
SELECT
  id as patient_id,
  name,
  registration_no
FROM patients
WHERE name ILIKE '%jason%roy%'
LIMIT 5;

\echo ''

-- Check 3: Check if voucher was created for this payment
\echo '--- CHECK 3: Voucher Creation ---'
WITH jason_payment AS (
  SELECT patient_id, payment_date, advance_amount
  FROM advance_payment
  WHERE patient_name ILIKE '%jason%roy%'
    AND DATE(payment_date) = '2025-11-03'
    AND advance_amount = 10
  LIMIT 1
)
SELECT
  v.id as voucher_id,
  v.voucher_number,
  v.voucher_date,
  v.voucher_type,
  v.narration,
  v.patient_id
FROM vouchers v
INNER JOIN jason_payment jp ON v.patient_id = jp.patient_id
WHERE v.voucher_date = DATE(jp.payment_date);

\echo ''

-- Check 4: Check voucher entries - which account was debited?
\echo '--- CHECK 4: Voucher Entries (Which Bank Account?) ---'
WITH jason_payment AS (
  SELECT patient_id, payment_date, advance_amount
  FROM advance_payment
  WHERE patient_name ILIKE '%jason%roy%'
    AND DATE(payment_date) = '2025-11-03'
    AND advance_amount = 10
  LIMIT 1
)
SELECT
  ve.id as entry_id,
  v.voucher_number,
  v.voucher_date,
  coa.account_name,
  coa.account_group,
  ve.debit_amount,
  ve.credit_amount,
  CASE
    WHEN ve.debit_amount > 0 THEN 'DEBIT (Money IN)'
    WHEN ve.credit_amount > 0 THEN 'CREDIT (Money OUT)'
  END as entry_type
FROM vouchers v
INNER JOIN jason_payment jp ON v.patient_id = jp.patient_id
INNER JOIN voucher_entries ve ON v.id = ve.voucher_id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE v.voucher_date = DATE(jp.payment_date)
ORDER BY ve.debit_amount DESC;

\echo ''

-- Check 5: Test if JOIN is working in ledger query
\echo '--- CHECK 5: JOIN Success Test ---'
WITH jason_payment AS (
  SELECT
    id as payment_id,
    patient_id,
    payment_date,
    advance_amount,
    payment_mode,
    bank_account_id
  FROM advance_payment
  WHERE patient_name ILIKE '%jason%roy%'
    AND DATE(payment_date) = '2025-11-03'
    AND advance_amount = 10
  LIMIT 1
),
jason_vouchers AS (
  SELECT
    v.id as voucher_id,
    v.voucher_number,
    v.voucher_date,
    v.patient_id,
    ve.id as entry_id,
    ve.debit_amount,
    ve.credit_amount,
    ve.account_id,
    coa.account_name
  FROM vouchers v
  INNER JOIN jason_payment jp ON v.patient_id = jp.patient_id
  INNER JOIN voucher_entries ve ON v.id = ve.voucher_id
  INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
  WHERE v.voucher_date = DATE(jp.payment_date)
    AND coa.account_name ILIKE '%STATE BANK%DRM%'
)
SELECT
  jv.*,
  jp.payment_mode as payment_mode_from_join,
  CASE
    WHEN jp.payment_id IS NOT NULL THEN 'JOIN SUCCESS ✓'
    ELSE 'JOIN FAILED ✗'
  END as join_status,
  CASE
    WHEN jp.payment_id IS NULL THEN 'Payment mode will be inferred as ONLINE (bank account)'
    ELSE 'Payment mode from payment record: ' || jp.payment_mode
  END as payment_mode_note
FROM jason_vouchers jv
LEFT JOIN jason_payment jp ON (
  jp.patient_id = jv.patient_id
  AND DATE(jp.payment_date) = jv.voucher_date
  AND jp.advance_amount = GREATEST(jv.debit_amount, jv.credit_amount)
);

\echo ''

-- Check 6: Get STATE BANK OF INDIA (DRM) account details
\echo '--- CHECK 6: Bank Account in Chart of Accounts ---'
SELECT
  id,
  account_name,
  account_group,
  account_type,
  parent_account_id
FROM chart_of_accounts
WHERE account_name ILIKE '%STATE BANK%DRM%';

\echo ''

-- Check 7: Test the actual ledger query
\echo '--- CHECK 7: Actual Ledger Query Test ---'
SELECT * FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-01',
  '2025-11-05',
  NULL,
  'ONLINE'
)
WHERE patient_name ILIKE '%jason%';

\echo ''

-- Check 8: Try without payment mode filter
\echo '--- CHECK 8: Ledger Query WITHOUT Payment Mode Filter ---'
SELECT * FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-01',
  '2025-11-05',
  NULL,
  NULL
)
WHERE patient_name ILIKE '%jason%';

\echo ''
\echo '==================================================================='
\echo 'DIAGNOSIS COMPLETE'
\echo '==================================================================='
