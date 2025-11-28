-- ============================================================================
-- Remove Duplicate SARASWAT BANK Entries
-- Date: 2025-11-19
-- Purpose: Delete duplicate SARASWAT BANK account, keep the one in use
-- ============================================================================

DO $$
DECLARE
  v_saraswat_to_keep UUID;
  v_saraswat_to_delete UUID;
  v_keep_usage_count INT;
  v_delete_usage_count INT;
  v_bank_account_id_exists BOOLEAN;
  v_voucher_entries_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 Checking for Duplicate SARASWAT BANK Entries';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Check if bank_account_id column exists in advance_payment table
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'advance_payment'
      AND column_name = 'bank_account_id'
  ) INTO v_bank_account_id_exists;

  IF NOT v_bank_account_id_exists THEN
    RAISE NOTICE '⚠️  WARNING: advance_payment.bank_account_id column does not exist';
    RAISE NOTICE '   Run migration 20251110160052_fix_advance_payment_bank_accounts.sql first';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '⏭️  MIGRATION SKIPPED';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RETURN;
  END IF;

  -- Find all SARASWAT BANK entries
  WITH saraswat_accounts AS (
    SELECT
      coa.id,
      coa.account_code,
      coa.created_at,
      COUNT(DISTINCT ap.id) as advance_payment_count,
      COUNT(DISTINCT ve.id) as voucher_entry_count,
      SUM(COALESCE(ve.debit_amount, 0)) + SUM(COALESCE(ve.credit_amount, 0)) as total_transactions
    FROM chart_of_accounts coa
    LEFT JOIN advance_payment ap ON ap.bank_account_id = coa.id
    LEFT JOIN voucher_entries ve ON ve.account_id = coa.id
    WHERE coa.account_name = 'SARASWAT BANK'
    GROUP BY coa.id, coa.account_code, coa.created_at
    ORDER BY total_transactions DESC, created_at ASC
  )
  SELECT
    id INTO v_saraswat_to_keep
  FROM saraswat_accounts
  LIMIT 1;

  -- Check if any SARASWAT BANK account was found
  IF v_saraswat_to_keep IS NULL THEN
    RAISE NOTICE '⚠️  No SARASWAT BANK account found in chart_of_accounts';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '⏭️  MIGRATION SKIPPED';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RETURN;
  END IF;

  -- Find the duplicate to delete
  SELECT id INTO v_saraswat_to_delete
  FROM chart_of_accounts
  WHERE account_name = 'SARASWAT BANK'
    AND id != v_saraswat_to_keep
  LIMIT 1;

  IF v_saraswat_to_delete IS NULL THEN
    RAISE NOTICE '✓ No duplicate found - only one SARASWAT BANK account exists';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION COMPLETE (Nothing to do)';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RETURN;
  END IF;

  -- Check usage counts
  SELECT COUNT(*) INTO v_keep_usage_count
  FROM advance_payment
  WHERE bank_account_id = v_saraswat_to_keep;

  SELECT COUNT(*) INTO v_delete_usage_count
  FROM advance_payment
  WHERE bank_account_id = v_saraswat_to_delete;

  RAISE NOTICE 'Found duplicate SARASWAT BANK entries:';
  RAISE NOTICE '  - ID to KEEP: % (used in % advance_payment transactions)', v_saraswat_to_keep, v_keep_usage_count;
  RAISE NOTICE '  - ID to DELETE: % (used in % advance_payment transactions)', v_saraswat_to_delete, v_delete_usage_count;
  RAISE NOTICE '';

  -- If the one we're deleting has transactions, migrate them first
  IF v_delete_usage_count > 0 THEN
    RAISE NOTICE '⚠️  Migrating % advance_payment transactions from duplicate to main account...', v_delete_usage_count;

    UPDATE advance_payment
    SET bank_account_id = v_saraswat_to_keep
    WHERE bank_account_id = v_saraswat_to_delete;

    RAISE NOTICE '✓ advance_payment transactions migrated successfully';
  END IF;

  -- Migrate voucher_entries
  SELECT COUNT(*) INTO v_voucher_entries_count
  FROM voucher_entries
  WHERE account_id = v_saraswat_to_delete;

  IF v_voucher_entries_count > 0 THEN
    RAISE NOTICE '⚠️  Migrating % voucher_entries from duplicate to main account...', v_voucher_entries_count;

    UPDATE voucher_entries
    SET account_id = v_saraswat_to_keep
    WHERE account_id = v_saraswat_to_delete;

    RAISE NOTICE '✓ voucher_entries migrated successfully';
  END IF;

  -- Delete the duplicate
  DELETE FROM chart_of_accounts
  WHERE id = v_saraswat_to_delete;

  RAISE NOTICE '✓ Duplicate SARASWAT BANK account deleted';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ DUPLICATE REMOVAL COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '❌ ERROR: Cannot delete SARASWAT BANK account';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Foreign key constraint violated. There are other tables';
    RAISE NOTICE 'referencing this account that need to be migrated first.';
    RAISE NOTICE '';
    RAISE NOTICE 'Account ID: %', v_saraswat_to_delete;
    RAISE NOTICE '';
    RAISE EXCEPTION 'Foreign key violation: %', SQLERRM;
END $$;
