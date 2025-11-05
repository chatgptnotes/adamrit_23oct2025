-- ============================================================================
-- DIAGNOSTIC QUERY: Check Final Payment System State
-- Run this in Supabase Dashboard SQL Editor to diagnose the issue
-- ============================================================================

-- ============================================================================
-- 1. Check if UNIQUE constraint exists on final_payments.visit_id
-- ============================================================================
SELECT
  'UNIQUE Constraint Check' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'final_payments_visit_id_unique'
        AND conrelid = 'final_payments'::regclass
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'final_payments_visit_id_unique'
        AND conrelid = 'final_payments'::regclass
    ) THEN 'UNIQUE constraint is present'
    ELSE 'UNIQUE constraint is MISSING - upsert will fail'
  END as notes;

-- ============================================================================
-- 2. Check if trigger function exists and has SECURITY DEFINER
-- ============================================================================
SELECT
  'Trigger Function Check' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_proc
      WHERE proname = 'record_final_payment_to_transactions'
    ) THEN
      CASE
        WHEN prosecdef THEN '✅ EXISTS with SECURITY DEFINER'
        ELSE '⚠️ EXISTS but NO SECURITY DEFINER'
      END
    ELSE '❌ FUNCTION MISSING'
  END as status,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_proc
      WHERE proname = 'record_final_payment_to_transactions'
    ) THEN
      CASE
        WHEN prosecdef THEN 'Function has elevated privileges - RLS bypass OK'
        ELSE 'Function lacks SECURITY DEFINER - RLS will block INSERT'
      END
    ELSE 'Trigger function does not exist'
  END as notes
FROM pg_proc
WHERE proname = 'record_final_payment_to_transactions'
UNION ALL
SELECT
  'Trigger Function Check' as check_name,
  '❌ FUNCTION MISSING' as status,
  'Trigger function does not exist' as notes
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_proc
  WHERE proname = 'record_final_payment_to_transactions'
);

-- ============================================================================
-- 3. Check if trigger exists on final_payments table
-- ============================================================================
SELECT
  'Trigger Check' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'trg_final_payment_record_transaction'
        AND tgrelid = 'final_payments'::regclass
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'trg_final_payment_record_transaction'
        AND tgrelid = 'final_payments'::regclass
    ) THEN 'Trigger is active on final_payments'
    ELSE 'Trigger is MISSING - payments wont be recorded'
  END as notes;

-- ============================================================================
-- 4. Check RLS policies on patient_payment_transactions
-- ============================================================================
SELECT
  'RLS Policy Check' as check_name,
  '✅ INFO' as status,
  'RLS is ' ||
  CASE
    WHEN relrowsecurity THEN 'ENABLED'
    ELSE 'DISABLED'
  END ||
  ' on patient_payment_transactions' as notes
FROM pg_class
WHERE relname = 'patient_payment_transactions';

-- ============================================================================
-- 5. List all policies on patient_payment_transactions
-- ============================================================================
SELECT
  'RLS Policies' as check_name,
  polname as policy_name,
  polcmd as command,
  CASE polpermissive
    WHEN TRUE THEN 'PERMISSIVE'
    ELSE 'RESTRICTIVE'
  END as type
FROM pg_policy
WHERE polrelid = 'patient_payment_transactions'::regclass;

-- ============================================================================
-- 6. Test if we can INSERT into patient_payment_transactions
-- This will show the actual error if INSERT fails
-- ============================================================================
DO $$
BEGIN
  -- Try a test insert (will rollback)
  BEGIN
    INSERT INTO patient_payment_transactions (
      patient_id,
      visit_id,
      payment_source,
      source_table_name,
      source_reference_id,
      payment_date,
      payment_mode,
      amount,
      narration,
      created_by,
      created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000'::UUID, -- Dummy patient_id
      'TEST_VISIT_ID',
      'FINAL_BILL',
      'final_payments',
      '00000000-0000-0000-0000-000000000000'::TEXT,
      CURRENT_DATE,
      'CASH',
      100.00,
      'Test insert',
      'diagnostic',
      NOW()
    );

    RAISE NOTICE '✅ INSERT Test: SUCCESS - Inserts are allowed';
    ROLLBACK; -- Rollback the test insert

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ INSERT Test: FAILED - Error: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- 7. Summary
-- ============================================================================
SELECT
  '==================' as separator,
  'DIAGNOSTIC COMPLETE' as message,
  '==================' as separator2;
