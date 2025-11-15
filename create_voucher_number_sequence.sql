-- ============================================================================
-- CREATE: Voucher Number Sequence
-- Date: 2025-11-08
-- Purpose: Fix "relation 'voucher_number_seq' does not exist" error
--
-- ROOT CAUSE:
--   Voucher creation function uses NEXTVAL('voucher_number_seq')
--   This sequence was never created in the database
--
-- SOLUTION:
--   Create the missing sequence
-- ============================================================================

-- ============================================================================
-- Check if sequence already exists
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'voucher_number_seq') THEN
    RAISE NOTICE '✓ voucher_number_seq already exists';
  ELSE
    RAISE NOTICE '✗ voucher_number_seq does not exist - will create';
  END IF;
END $$;

-- ============================================================================
-- Create the sequence if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'voucher_number_seq') THEN
    CREATE SEQUENCE voucher_number_seq
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;

    RAISE NOTICE '✅ Created voucher_number_seq sequence';
  END IF;
END $$;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT USAGE, SELECT ON SEQUENCE voucher_number_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE voucher_number_seq TO service_role;

-- ============================================================================
-- Verify sequence is working
-- ============================================================================

DO $$
DECLARE
  v_test_number BIGINT;
BEGIN
  -- Test the sequence
  SELECT NEXTVAL('voucher_number_seq') INTO v_test_number;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEQUENCE VERIFICATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Test voucher number: %', v_test_number;
  RAISE NOTICE 'Sequence is working correctly!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅✅✅ VOUCHER NUMBER SEQUENCE CREATED ✅✅✅';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. ✓ Created voucher_number_seq sequence';
  RAISE NOTICE '  2. ✓ Granted permissions to authenticated users';
  RAISE NOTICE '  3. ✓ Verified sequence is working';
  RAISE NOTICE '';
  RAISE NOTICE 'Result:';
  RAISE NOTICE '  → Voucher numbers will be auto-generated!';
  RAISE NOTICE '  → Final payments can now save successfully!';
  RAISE NOTICE '  → Format: REC-YYYYMMDD-XXXXXX';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
