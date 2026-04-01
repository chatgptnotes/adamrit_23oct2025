-- Sub-allocations: break a single obligation into multiple named payees
-- e.g. "RMO Salary" → Dr. A: 5000, Dr. B: 5000, Dr. C: 5000

CREATE TABLE IF NOT EXISTS payment_sub_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES daily_payment_schedule(id) ON DELETE CASCADE,
  payee_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  voucher_id UUID REFERENCES vouchers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sub_alloc_schedule ON payment_sub_allocations(schedule_id);

-- RLS
ALTER TABLE payment_sub_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON payment_sub_allocations
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE payment_sub_allocations IS 'Individual payee breakdowns within a daily payment obligation (e.g., 3 RMOs under RMO Salary)';
