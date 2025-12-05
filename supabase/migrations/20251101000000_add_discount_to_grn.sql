-- Migration: Add discount column to goods_received_notes table
-- Description: Adds a discount field to track discounts applied to GRNs
-- Date: 2025-11-01

-- Add discount column to goods_received_notes table
ALTER TABLE public.goods_received_notes
ADD COLUMN discount NUMERIC(15, 2);

-- Add comment for documentation
COMMENT ON COLUMN public.goods_received_notes.discount IS 'Discount amount applied to the GRN (optional)';
