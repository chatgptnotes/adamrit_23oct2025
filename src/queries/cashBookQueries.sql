-- =====================================================
-- CASH BOOK SQL QUERIES
-- =====================================================
-- These queries fetch cash transactions from the accounting system
-- for display in the Cash Book report
-- =====================================================

-- =====================================================
-- 1. GET CASH ACCOUNT ID
-- =====================================================
-- First, we need to identify the Cash account from chart_of_accounts
SELECT id, account_name, opening_balance, opening_balance_type
FROM chart_of_accounts
WHERE account_name = 'Cash in Hand'
  AND is_active = true;


-- =====================================================
-- 2. GET ALL CASH TRANSACTIONS (MAIN QUERY)
-- =====================================================
-- Fetch all voucher entries where the account is Cash
-- Includes voucher details, patient info, and user who created it
SELECT
  -- Date and Time
  v.voucher_date,
  v.created_at as transaction_time,
  TO_CHAR(v.created_at, 'HH24:MI:SS') as time_only,

  -- Voucher Details
  v.voucher_number,
  vt.voucher_type_name as voucher_type,
  v.narration as voucher_narration,

  -- Transaction Details
  ve.narration as entry_narration,
  ve.debit_amount,
  ve.credit_amount,

  -- Particulars (Patient or Account Name)
  COALESCE(p.name, contra_coa.account_name, 'Unknown') as particulars,

  -- User Information
  v.created_by as user_id,
  COALESCE(u.full_name, u.email, 'System') as entered_by,

  -- Status
  v.status,

  -- IDs for joining
  v.id as voucher_id,
  ve.id as entry_id

FROM voucher_entries ve

-- Join with vouchers (transaction header)
INNER JOIN vouchers v ON ve.voucher_id = v.id

-- Join with chart of accounts to filter for Cash
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id

-- Join with voucher types for transaction type name
LEFT JOIN voucher_types vt ON v.voucher_type_id = vt.id

-- Join with patients for patient transactions
LEFT JOIN patients p ON v.patient_id = p.id

-- Join with users to get who created the entry
LEFT JOIN users u ON v.created_by = u.id

-- Join to get contra account (the other side of double entry)
LEFT JOIN voucher_entries ve_contra
  ON ve_contra.voucher_id = v.id
  AND ve_contra.id != ve.id
LEFT JOIN chart_of_accounts contra_coa
  ON ve_contra.account_id = contra_coa.id

WHERE
  -- Filter for Cash account only
  coa.account_name = 'Cash'

  -- Date range filter (replace with actual dates)
  AND v.voucher_date BETWEEN '2025-10-01' AND '2025-10-31'

  -- Only show authorized transactions
  AND v.status = 'AUTHORISED'

ORDER BY
  v.voucher_date ASC,
  v.created_at ASC;


-- =====================================================
-- 3. GET OPENING BALANCE
-- =====================================================
-- Get the opening balance for Cash account
SELECT
  opening_balance,
  opening_balance_type,
  CASE
    WHEN opening_balance_type = 'DR' THEN opening_balance
    ELSE -opening_balance
  END as balance_amount
FROM chart_of_accounts
WHERE account_name = 'Cash in Hand'
  AND is_active = true;


-- =====================================================
-- 4. CALCULATE RUNNING BALANCE
-- =====================================================
-- Calculate closing balance up to a specific date
SELECT
  coa.account_name,
  coa.opening_balance,
  coa.opening_balance_type,

  -- Total debits
  COALESCE(SUM(ve.debit_amount), 0) as total_debit,

  -- Total credits
  COALESCE(SUM(ve.credit_amount), 0) as total_credit,

  -- Calculate closing balance
  CASE
    WHEN coa.opening_balance_type = 'DR' THEN
      coa.opening_balance + COALESCE(SUM(ve.debit_amount), 0) - COALESCE(SUM(ve.credit_amount), 0)
    ELSE
      coa.opening_balance - COALESCE(SUM(ve.debit_amount), 0) + COALESCE(SUM(ve.credit_amount), 0)
  END as closing_balance

FROM chart_of_accounts coa

LEFT JOIN voucher_entries ve ON ve.account_id = coa.id
LEFT JOIN vouchers v ON ve.voucher_id = v.id
  AND v.voucher_date <= '2025-10-31'
  AND v.status = 'AUTHORISED'

WHERE coa.account_name = 'Cash in Hand'
  AND coa.is_active = true

GROUP BY
  coa.id,
  coa.account_name,
  coa.opening_balance,
  coa.opening_balance_type;


-- =====================================================
-- 5. FILTER BY USER (CREATED BY)
-- =====================================================
-- Get transactions created by specific user
SELECT
  v.voucher_date,
  v.voucher_number,
  ve.debit_amount,
  ve.credit_amount,
  u.full_name as entered_by,
  u.email as user_email
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
LEFT JOIN users u ON v.created_by = u.id
WHERE coa.account_name = 'Cash in Hand'
  AND v.created_by = 'USER_UUID_HERE'
  AND v.status = 'AUTHORISED'
ORDER BY v.voucher_date;


-- =====================================================
-- 6. FILTER BY VOUCHER TYPE
-- =====================================================
-- Get only specific type of transactions (e.g., only Receipts)
SELECT
  v.voucher_date,
  v.voucher_number,
  vt.voucher_type_name,
  vt.voucher_category,
  ve.debit_amount,
  ve.credit_amount
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
LEFT JOIN voucher_types vt ON v.voucher_type_id = vt.id
WHERE coa.account_name = 'Cash in Hand'
  AND vt.voucher_category = 'RECEIPT'  -- Can be: RECEIPT, PAYMENT, JOURNAL, etc.
  AND v.status = 'AUTHORISED'
ORDER BY v.voucher_date;


-- =====================================================
-- 7. SEARCH BY NARRATION
-- =====================================================
-- Search transactions by narration text
SELECT
  v.voucher_date,
  v.voucher_number,
  v.narration as voucher_narration,
  ve.narration as entry_narration,
  ve.debit_amount,
  ve.credit_amount
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE coa.account_name = 'Cash in Hand'
  AND (
    v.narration ILIKE '%search_text%'
    OR ve.narration ILIKE '%search_text%'
  )
  AND v.status = 'AUTHORISED'
ORDER BY v.voucher_date;


-- =====================================================
-- 8. GET DAILY SUMMARY
-- =====================================================
-- Get total debits and credits for each day
SELECT
  v.voucher_date,
  COUNT(*) as transaction_count,
  SUM(ve.debit_amount) as total_debit,
  SUM(ve.credit_amount) as total_credit,
  SUM(ve.debit_amount) - SUM(ve.credit_amount) as net_change
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE coa.account_name = 'Cash in Hand'
  AND v.voucher_date BETWEEN '2025-10-01' AND '2025-10-31'
  AND v.status = 'AUTHORISED'
GROUP BY v.voucher_date
ORDER BY v.voucher_date;


-- =====================================================
-- 9. GET ALL USERS (FOR FILTER DROPDOWN)
-- =====================================================
-- Get list of users who have created cash transactions
SELECT DISTINCT
  u.id,
  u.full_name,
  u.email
FROM vouchers v
INNER JOIN voucher_entries ve ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
LEFT JOIN users u ON v.created_by = u.id
WHERE coa.account_name = 'Cash in Hand'
  AND u.id IS NOT NULL
ORDER BY u.full_name;


-- =====================================================
-- 10. GET ALL VOUCHER TYPES (FOR FILTER DROPDOWN)
-- =====================================================
-- Get list of voucher types used in cash transactions
SELECT DISTINCT
  vt.id,
  vt.voucher_type_name,
  vt.voucher_category,
  vt.voucher_type_code
FROM vouchers v
INNER JOIN voucher_entries ve ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
LEFT JOIN voucher_types vt ON v.voucher_type_id = vt.id
WHERE coa.account_name = 'Cash in Hand'
  AND vt.id IS NOT NULL
ORDER BY vt.voucher_type_name;


-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Replace date ranges ('2025-10-01', '2025-10-31') with actual parameters
-- 2. Replace 'USER_UUID_HERE' with actual user UUID when filtering
-- 3. All queries filter for status = 'AUTHORISED' to show only approved transactions
-- 4. Use ILIKE for case-insensitive search in PostgreSQL
-- 5. Opening balance type: 'DR' = Debit (asset), 'CR' = Credit (liability)
-- =====================================================
