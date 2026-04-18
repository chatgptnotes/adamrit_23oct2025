-- RMO (Resident Medical Officer) master tables for Hope and Ayushman hospitals

CREATE TABLE IF NOT EXISTS hope_rmos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  department TEXT,
  contact_info TEXT,
  tpa_rate NUMERIC(12,2),
  non_nabh_rate NUMERIC(12,2),
  nabh_rate NUMERIC(12,2),
  private_rate NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ayushman_rmos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  department TEXT,
  contact_info TEXT,
  tpa_rate NUMERIC(12,2),
  non_nabh_rate NUMERIC(12,2),
  nabh_rate NUMERIC(12,2),
  private_rate NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE hope_rmos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ayushman_rmos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON hope_rmos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON ayushman_rmos FOR ALL USING (true) WITH CHECK (true);
