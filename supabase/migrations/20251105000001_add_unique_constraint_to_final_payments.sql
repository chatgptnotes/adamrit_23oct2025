-- ============================================================================
-- Add UNIQUE Constraint to final_payments.visit_id
-- This migration fixes the "Failed to save final payment" error by adding
-- a UNIQUE constraint required for the upsert operation with onConflict
-- ============================================================================

-- ============================================================================
-- PROBLEM:
-- The frontend code uses: .upsert({ ... }, { onConflict: 'visit_id' })
-- PostgreSQL requires a UNIQUE constraint on the conflict column(s)
-- Without it, the upsert operation fails with an error
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if there are any duplicate visit_ids
-- (This will fail if duplicates exist - need to clean them first)
-- ============================================================================
DO $$
DECLARE
  v_duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT visit_id, COUNT(*) as cnt
    FROM final_payments
    GROUP BY visit_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF v_duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate visit_ids in final_payments table', v_duplicate_count;
    RAISE WARNING 'Duplicates will be handled by keeping the most recent payment per visit';
  ELSE
    RAISE NOTICE 'No duplicate visit_ids found. Proceeding with constraint addition.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Delete older duplicate records (keep only the most recent per visit)
-- This ensures the UNIQUE constraint can be added successfully
-- ============================================================================
DELETE FROM final_payments
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY visit_id ORDER BY created_at DESC, id DESC) as rn
    FROM final_payments
  ) ranked
  WHERE rn > 1
);

-- ============================================================================
-- STEP 3: Add UNIQUE constraint to visit_id
-- ============================================================================
ALTER TABLE public.final_payments
  ADD CONSTRAINT final_payments_visit_id_unique UNIQUE (visit_id);

-- ============================================================================
-- STEP 4: Add comment to document the constraint
-- ============================================================================
COMMENT ON CONSTRAINT final_payments_visit_id_unique ON public.final_payments IS
'Ensures only one final payment record exists per visit. Required for upsert operations using onConflict: visit_id';

-- ============================================================================
-- Success message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ UNIQUE constraint added to final_payments.visit_id';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. ✓ Removed any duplicate final payment records (kept most recent)';
  RAISE NOTICE '  2. ✓ Added UNIQUE constraint: final_payments_visit_id_unique';
  RAISE NOTICE '  3. ✓ Upsert operations will now work correctly';
  RAISE NOTICE '';
  RAISE NOTICE 'The "Failed to save final payment" error should now be resolved!';
  RAISE NOTICE '========================================';
END $$;
