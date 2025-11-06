-- ============================================================================
-- Add Database Constraint for Bank Account Requirement
-- Date: 2025-11-06
-- Purpose: Prevent NULL bank_account_id for non-CASH payment modes
--
-- ISSUE: Payments can be saved without bank_account_id for ONLINE/UPI/etc
--        This prevents vouchers from being created automatically
--        Results in missing ledger entries
--
-- FIX: Add CHECK constraint to enforce bank_account_id is NOT NULL
--      for all payment modes except CASH and CREDIT
-- ============================================================================

-- Add check constraint to advance_payment table
ALTER TABLE advance_payment
ADD CONSTRAINT chk_bank_account_required
CHECK (
  -- CASH and CREDIT modes don't require bank_account_id
  payment_mode IN ('CASH', 'CREDIT')
  OR
  -- All other modes MUST have bank_account_id
  (
    payment_mode IN ('ONLINE', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'DD')
    AND bank_account_id IS NOT NULL
  )
);

-- Add helpful comment
COMMENT ON CONSTRAINT chk_bank_account_required ON advance_payment IS
'Ensures bank_account_id is provided for all non-CASH payment modes to enable automatic voucher creation';

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ BANK ACCOUNT CONSTRAINT ADDED';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Constraint Details:';
  RAISE NOTICE '  - Name: chk_bank_account_required';
  RAISE NOTICE '  - Table: advance_payment';
  RAISE NOTICE '';
  RAISE NOTICE 'Rules:';
  RAISE NOTICE '  ✓ CASH payments: bank_account_id is optional';
  RAISE NOTICE '  ✓ CREDIT payments: bank_account_id is optional';
  RAISE NOTICE '  ✗ ONLINE/UPI/NEFT/RTGS/CHEQUE/CARD/DD: bank_account_id REQUIRED';
  RAISE NOTICE '';
  RAISE NOTICE 'Result:';
  RAISE NOTICE '  - Database will reject payments without bank_account_id';
  RAISE NOTICE '  - Prevents missing vouchers in future';
  RAISE NOTICE '  - Enforces data integrity at database level';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
