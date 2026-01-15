-- Create referee_doa_payments table for tracking payment history
CREATE TABLE IF NOT EXISTS referee_doa_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by visit_id
CREATE INDEX IF NOT EXISTS idx_referee_doa_payments_visit_id ON referee_doa_payments(visit_id);

-- Add comment for documentation
COMMENT ON TABLE referee_doa_payments IS 'Stores referee DOA payment history for IPD visits';
