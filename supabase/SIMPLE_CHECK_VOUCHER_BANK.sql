-- Which bank account are the Nov 3 vouchers linked to?
SELECT
  v.voucher_date,
  v.voucher_number,
  coa.account_name as voucher_entry_bank_account,
  ve.credit_amount,
  ve.debit_amount
FROM vouchers v
JOIN voucher_entries ve ON v.id = ve.voucher_id
JOIN chart_of_accounts coa ON ve.account_id = coa.id
WHERE v.voucher_date = '2025-11-03'
  AND coa.account_name ILIKE '%bank%'
ORDER BY v.voucher_number;
