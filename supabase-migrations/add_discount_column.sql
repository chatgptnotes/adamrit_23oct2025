-- =====================================================
-- Add discount column to purchase_orders table
-- =====================================================
-- Run this in Supabase SQL Editor

ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS discount NUMERIC(15, 2) NULL DEFAULT 0.00;

-- Add comment to document the column
COMMENT ON COLUMN public.purchase_orders.discount IS 'Discount amount applied to the purchase order';
