-- ========================================
-- MIGRATION: Fix missing clinical_info column in lab_orders table
-- This fixes the immediate error: "Could not find the 'clinical_info' column of 'lab_orders'"
-- ========================================

-- Add the missing clinical_info column to the existing lab_orders table
ALTER TABLE public.lab_orders 
ADD COLUMN IF NOT EXISTS clinical_info TEXT;

-- Add a comment to explain what this column is for
COMMENT ON COLUMN public.lab_orders.clinical_info IS 'Clinical information and indication for the lab order';

-- Update existing records to copy data from clinical_history if available
UPDATE public.lab_orders 
SET clinical_info = clinical_history 
WHERE clinical_info IS NULL AND clinical_history IS NOT NULL;

-- Set a default value for any remaining NULL values
UPDATE public.lab_orders 
SET clinical_info = 'No clinical information provided' 
WHERE clinical_info IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.lab_orders 
ALTER COLUMN clinical_info SET NOT NULL;

-- Create an index on the new column for better performance
CREATE INDEX IF NOT EXISTS idx_lab_orders_clinical_info ON public.lab_orders(clinical_info);

-- Verify the column was added successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lab_orders' 
        AND column_name = 'clinical_info'
    ) THEN
        RAISE NOTICE 'Successfully added clinical_info column to lab_orders table';
    ELSE
        RAISE EXCEPTION 'Failed to add clinical_info column to lab_orders table';
    END IF;
END $$;
