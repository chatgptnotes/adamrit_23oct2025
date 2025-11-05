-- ============================================================================
-- FIX: Change created_by column from UUID to TEXT
-- Issue: Frontend passes 'system' string but column expects UUID
-- Solution: Change column type to TEXT to match migration definitions
-- ============================================================================

-- Check current column type
DO $$
DECLARE
  v_data_type TEXT;
BEGIN
  SELECT data_type INTO v_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'final_payments'
    AND column_name = 'created_by';

  RAISE NOTICE 'Current created_by column type: %', v_data_type;
END $$;

-- Fix the column type if it's UUID
DO $$
DECLARE
  v_data_type TEXT;
BEGIN
  -- Get current column type
  SELECT data_type INTO v_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'final_payments'
    AND column_name = 'created_by';

  -- If column is UUID, convert it to TEXT
  IF v_data_type = 'uuid' THEN
    RAISE NOTICE '⚠️  Column is UUID type, converting to TEXT...';

    -- Convert column to text (any existing UUIDs will be converted to text representation)
    ALTER TABLE public.final_payments
    ALTER COLUMN created_by TYPE text
    USING created_by::text;

    RAISE NOTICE '✅ Successfully converted created_by from UUID to TEXT';
  ELSIF v_data_type = 'text' OR v_data_type = 'character varying' THEN
    RAISE NOTICE '✓ Column is already TEXT type, no changes needed';
  ELSE
    RAISE NOTICE '⚠️  Unexpected column type: %. Manual review needed.', v_data_type;
  END IF;
END $$;

-- Verify the fix
DO $$
DECLARE
  v_data_type TEXT;
BEGIN
  SELECT data_type INTO v_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'final_payments'
    AND column_name = 'created_by';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CREATED_BY COLUMN FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Final column type: %', v_data_type;
  RAISE NOTICE 'Frontend can now pass text values like "system"';
  RAISE NOTICE '========================================';
END $$;
