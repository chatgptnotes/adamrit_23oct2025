-- Daily Allocation Saves: track which days' allocations have been saved/finalized
CREATE TABLE IF NOT EXISTS daily_allocation_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  save_date DATE NOT NULL,
  hospital_name TEXT NOT NULL DEFAULT 'hope',
  total_due NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  total_available NUMERIC NOT NULL DEFAULT 0,
  surplus NUMERIC NOT NULL DEFAULT 0,
  schedule_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  saved_by TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'finalized', 'revised')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(save_date, hospital_name)
);

-- RLS
ALTER TABLE daily_allocation_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous access to daily_allocation_saves"
  ON daily_allocation_saves FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access to daily_allocation_saves"
  ON daily_allocation_saves FOR ALL TO authenticated USING (true) WITH CHECK (true);
