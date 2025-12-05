-- Create visit_discounts table for bill-level discount management
-- This replaces the problematic discount row in financial_summary table

CREATE TABLE IF NOT EXISTS public.visit_discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  discount_reason TEXT,
  applied_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure only one discount record per visit
  UNIQUE(visit_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visit_discounts_visit_id ON public.visit_discounts(visit_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.visit_discounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on visit_discounts" ON public.visit_discounts
  FOR ALL USING (true) WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.visit_discounts IS 'Stores bill-level discount information for visits';
COMMENT ON COLUMN public.visit_discounts.visit_id IS 'Reference to the visit this discount belongs to';
COMMENT ON COLUMN public.visit_discounts.discount_amount IS 'Discount amount to be subtracted from total bill';
COMMENT ON COLUMN public.visit_discounts.discount_reason IS 'Reason or notes for applying the discount';
COMMENT ON COLUMN public.visit_discounts.applied_by IS 'User who applied the discount';