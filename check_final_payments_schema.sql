-- ============================================================================
-- CHECK final_payments TABLE SCHEMA
-- Run this in Supabase Dashboard to see what columns exist
-- ============================================================================

-- ============================================================================
-- 1. List all columns in final_payments table
-- ============================================================================
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'final_payments'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. Check for UNIQUE constraint on visit_id
-- ============================================================================
SELECT
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    ELSE contype::TEXT
  END as type_description
FROM pg_constraint
WHERE conrelid = 'final_payments'::regclass
ORDER BY conname;

-- ============================================================================
-- 3. Check for triggers on final_payments
-- ============================================================================
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  CASE tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA'
    WHEN 'A' THEN 'ALWAYS'
    ELSE tgenabled::TEXT
  END as status,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'final_payments'::regclass
  AND tgisinternal = false
ORDER BY tgname;

-- ============================================================================
-- 4. Check if trigger function exists with SECURITY DEFINER
-- ============================================================================
SELECT
  proname as function_name,
  prosecdef as has_security_definer,
  CASE
    WHEN prosecdef THEN '✅ HAS SECURITY DEFINER'
    ELSE '❌ NO SECURITY DEFINER'
  END as security_status
FROM pg_proc
WHERE proname = 'record_final_payment_to_transactions';

-- ============================================================================
-- 5. Expected vs Actual Columns
-- ============================================================================
DO $$
DECLARE
  v_has_bank_account_id BOOLEAN;
  v_has_bank_account_name BOOLEAN;
  v_has_unique_constraint BOOLEAN;
BEGIN
  -- Check for bank_account_id column
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'final_payments'
      AND column_name = 'bank_account_id'
  ) INTO v_has_bank_account_id;

  -- Check for bank_account_name column
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'final_payments'
      AND column_name = 'bank_account_name'
  ) INTO v_has_bank_account_name;

  -- Check for UNIQUE constraint
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'final_payments_visit_id_unique'
      AND conrelid = 'final_payments'::regclass
  ) INTO v_has_unique_constraint;

  -- Report results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SCHEMA CHECK RESULTS';
  RAISE NOTICE '========================================';

  IF v_has_bank_account_id THEN
    RAISE NOTICE '✅ bank_account_id column EXISTS';
  ELSE
    RAISE NOTICE '❌ bank_account_id column MISSING';
  END IF;

  IF v_has_bank_account_name THEN
    RAISE NOTICE '✅ bank_account_name column EXISTS';
  ELSE
    RAISE NOTICE '❌ bank_account_name column MISSING';
  END IF;

  IF v_has_unique_constraint THEN
    RAISE NOTICE '✅ UNIQUE constraint EXISTS';
  ELSE
    RAISE NOTICE '❌ UNIQUE constraint MISSING';
  END IF;

  RAISE NOTICE '========================================';

  -- Summary
  IF v_has_bank_account_id AND v_has_bank_account_name AND v_has_unique_constraint THEN
    RAISE NOTICE 'RESULT: ✅ Schema is complete!';
  ELSE
    RAISE NOTICE 'RESULT: ❌ Schema is incomplete - migration needed';
  END IF;
END $$;
