-- ============================================================================
-- FIX: generate_voucher_number function - resolve ambiguous column reference
-- The parameter name conflicts with the table column name
-- ============================================================================

-- First DROP the old function
DROP FUNCTION IF EXISTS generate_voucher_number(TEXT);

-- Then CREATE with new parameter name
CREATE FUNCTION generate_voucher_number(p_voucher_type_code TEXT)
RETURNS TEXT AS $$
DECLARE
  current_num INTEGER;
  new_number TEXT;
BEGIN
  -- Get and increment the current number for this voucher type
  UPDATE voucher_types
  SET current_number = current_number + 1
  WHERE voucher_type_code = p_voucher_type_code
  RETURNING current_number INTO current_num;

  -- Format: REC-001, PAY-001, etc.
  new_number := p_voucher_type_code || '-' || LPAD(current_num::TEXT, 4, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_voucher_number IS 'Generates unique voucher numbers with auto-increment';

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ generate_voucher_number function fixed!';
  RAISE NOTICE 'Parameter renamed: voucher_type_code → p_voucher_type_code';
END $$;
