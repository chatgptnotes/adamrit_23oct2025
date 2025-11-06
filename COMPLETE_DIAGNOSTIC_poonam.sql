-- ============================================================================
-- COMPLETE DIAGNOSTIC: Why Poonam Entries Not Showing
-- This will trace EVERY step and find the exact failure point
-- ============================================================================

-- STEP 1: Show poonam's final_payments with ALL details
SELECT
  '1. POONAM FINAL PAYMENTS' as step,
  fp.id,
  fp.visit_id,
  fp.amount,
  fp.mode_of_payment,
  fp.payment_date,
  fp.patient_id,
  fp.bank_account_id,
  fp.bank_account_name,
  fp.created_at,
  p.name as patient_name,
  p.patients_id as mrn
FROM final_payments fp
LEFT JOIN patients p ON fp.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
  OR fp.visit_id IN (SELECT visit_id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE name ILIKE '%poonam%'))
ORDER BY fp.created_at DESC;

-- STEP 2: Show vouchers for poonam (if any exist)
SELECT
  '2. POONAM VOUCHERS' as step,
  v.id as voucher_id,
  v.voucher_number,
  v.voucher_date,
  v.patient_id,
  v.narration,
  v.created_at as voucher_created,
  p.name as patient_name
FROM vouchers v
INNER JOIN patients p ON v.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
ORDER BY v.voucher_date DESC;

-- STEP 3: Show voucher_entries for poonam's vouchers
SELECT
  '3. POONAM VOUCHER ENTRIES' as step,
  v.voucher_number,
  v.voucher_date,
  ve.id as entry_id,
  coa.account_name,
  coa.account_group,
  ve.debit_amount,
  ve.credit_amount,
  p.name as patient_name
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
INNER JOIN patients p ON v.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
ORDER BY v.voucher_date DESC, ve.id;

-- STEP 4: Check date matching between final_payments and vouchers
SELECT
  '4. DATE MATCHING CHECK' as step,
  fp.id as final_payment_id,
  fp.payment_date,
  fp.mode_of_payment,
  v.voucher_date,
  fp.payment_date = v.voucher_date as dates_match,
  v.voucher_number,
  p.name as patient_name
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
LEFT JOIN vouchers v ON v.patient_id = fp.patient_id
WHERE p.name ILIKE '%poonam%'
ORDER BY fp.created_at DESC;

-- STEP 5: Check bank account names in voucher_entries
SELECT
  '5. BANK ACCOUNTS IN ENTRIES' as step,
  DISTINCT coa.account_name,
  coa.account_group,
  COUNT(*) as entry_count
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
INNER JOIN patients p ON v.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
  AND ve.debit_amount > 0
GROUP BY coa.account_name, coa.account_group;

-- STEP 6: Simulate EXACT ledger function logic for poonam
SELECT
  '6. LEDGER SIMULATION FOR POONAM' as step,
  v.voucher_date,
  v.voucher_number,
  p.name as patient_name,
  coa.account_name as bank_account,
  ve.debit_amount,
  fp.id as final_payment_linked,
  CASE
    WHEN fp.id IS NOT NULL THEN 'FINAL_PAYMENT'
    ELSE 'NO_MATCH'
  END as payment_type,
  fp.mode_of_payment
FROM voucher_entries ve
INNER JOIN vouchers v ON ve.voucher_id = v.id
INNER JOIN chart_of_accounts coa ON ve.account_id = coa.id
INNER JOIN patients p ON v.patient_id = p.id
LEFT JOIN final_payments fp ON (
  fp.patient_id = v.patient_id
  AND fp.payment_date = v.voucher_date
)
WHERE p.name ILIKE '%poonam%'
  AND ve.debit_amount > 0
ORDER BY v.voucher_date DESC;

-- STEP 7: Test ledger function for STATE BANK without filter
SELECT
  '7. LEDGER FUNCTION - STATE BANK (NO FILTER)' as step,
  *
FROM get_ledger_statement_with_patients(
  'STATE BANK OF INDIA (DRM)',
  '2025-11-01',
  '2025-11-30',
  NULL,
  NULL
)
WHERE patient_name ILIKE '%poonam%';

-- STEP 8: Test ledger function for SARASWAT BANK without filter
SELECT
  '8. LEDGER FUNCTION - SARASWAT BANK (NO FILTER)' as step,
  *
FROM get_ledger_statement_with_patients(
  'SARASWAT BANK',
  '2025-11-01',
  '2025-11-30',
  NULL,
  NULL
)
WHERE patient_name ILIKE '%poonam%';

-- STEP 9: Check if poonam has patient_id properly set
SELECT
  '9. PATIENT_ID CHECK' as step,
  fp.id,
  fp.patient_id,
  CASE
    WHEN fp.patient_id IS NULL THEN 'ERROR: patient_id is NULL'
    WHEN p.id IS NULL THEN 'ERROR: patient_id points to non-existent patient'
    ELSE 'OK'
  END as status,
  p.name as patient_name
FROM final_payments fp
LEFT JOIN patients p ON fp.patient_id = p.id
WHERE fp.visit_id IN (SELECT visit_id FROM visits WHERE patient_id IN (SELECT id FROM patients WHERE name ILIKE '%poonam%'))
ORDER BY fp.created_at DESC;

-- STEP 10: Full detailed trace
SELECT
  '10. COMPLETE TRACE' as step,
  'Final Payment ID' as field,
  fp.id::TEXT as value
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
UNION ALL
SELECT
  '10. COMPLETE TRACE',
  'Payment Date',
  fp.payment_date::TEXT
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
UNION ALL
SELECT
  '10. COMPLETE TRACE',
  'Mode of Payment',
  fp.mode_of_payment::TEXT
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
UNION ALL
SELECT
  '10. COMPLETE TRACE',
  'Bank Account',
  fp.bank_account_name::TEXT
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
WHERE p.name ILIKE '%poonam%'
UNION ALL
SELECT
  '10. COMPLETE TRACE',
  'Voucher Exists?',
  CASE WHEN COUNT(v.id) > 0 THEN 'YES (' || COUNT(v.id)::TEXT || ' vouchers)' ELSE 'NO - THIS IS THE PROBLEM!' END
FROM final_payments fp
INNER JOIN patients p ON fp.patient_id = p.id
LEFT JOIN vouchers v ON (v.patient_id = fp.patient_id AND v.voucher_date = fp.payment_date)
WHERE p.name ILIKE '%poonam%';
