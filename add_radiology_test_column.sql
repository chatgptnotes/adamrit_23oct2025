-- ========================================
-- ADD RADIOLOGY TEST COLUMN TO REQUISITIONS TABLE
-- ========================================

-- Add radiology_test_names column for storing radiology test names
ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS radiology_test_names TEXT[];

-- Add radiology_test_costs column for storing radiology test costs
ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS radiology_test_costs DECIMAL(12,2)[];

-- Update existing radiology records to have empty arrays
UPDATE public.requisitions 
SET 
  radiology_test_names = ARRAY[]::TEXT[],
  radiology_test_costs = ARRAY[]::DECIMAL(12,2)[]
WHERE requisition_type = 'radiology' 
  AND (radiology_test_names IS NULL OR radiology_test_costs IS NULL);

-- Success message
SELECT 'Radiology test columns added successfully to requisitions table!' as status;
