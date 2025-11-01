-- ============================================================================
-- Verify SARASWAT BANK Vouchers Were Created
-- ============================================================================

-- 1. Check if SARASWAT BANK payments exist
SELECT
  'SARASWAT BANK Payments' as check_type,
  COUNT(*) as count,
  SUM(advance_amount) as total_amount
FROM advance_payment
WHERE bank_account_name = 'SARASWAT BANK'
  AND payment_mode IN ('ONLINE', 'Online', 'online', 'Bank Transfer', 'BANK TRANSFER')
  AND is_refund = FALSE;

-- 2. Check if vouchers exist for SARASWAT BANK account
SELECT
  'Vouchers for SARASWAT BANK' as check_type,
  COUNT(*) as voucher_count,
  SUM(v.total_amount) as total_amount
FROM vouchers v
JOIN voucher_entries ve ON ve.voucher_id = v.id
JOIN chart_of_accounts ca ON ca.id = ve.account_id
WHERE ca.account_name = 'SARASWAT BANK'
  AND v.voucher_date >= '2025-10-27';

-- 3. Show recent vouchers with SARASWAT BANK
SELECT
  v.voucher_number,
  v.voucher_date,
  v.total_amount,
  v.narration,
  ca.account_name as bank_account
FROM vouchers v
JOIN voucher_entries ve ON ve.voucher_id = v.id
JOIN chart_of_accounts ca ON ca.id = ve.account_id
WHERE ca.account_name = 'SARASWAT BANK'
  AND v.voucher_date >= '2025-10-27'
ORDER BY v.voucher_date DESC
LIMIT 10;

-- 4. Test ledger function for SARASWAT BANK
SELECT * FROM get_ledger_statement_with_patients(
  'SARASWAT BANK',
  '2025-10-27',
  '2025-11-01',
  NULL
);