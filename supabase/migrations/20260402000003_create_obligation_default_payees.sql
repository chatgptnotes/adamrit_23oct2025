-- Default payees for payment obligations
-- These get auto-copied to daily sub-allocations when schedule is generated

CREATE TABLE IF NOT EXISTS obligation_default_payees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id UUID NOT NULL REFERENCES payment_obligations(id) ON DELETE CASCADE,
  payee_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_default_payees_obligation ON obligation_default_payees(obligation_id);

-- RLS
ALTER TABLE obligation_default_payees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON obligation_default_payees
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE obligation_default_payees IS 'Default payee list for obligations — auto-populates daily sub-allocations';
