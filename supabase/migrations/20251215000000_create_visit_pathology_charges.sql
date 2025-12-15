-- Create visit_pathology_charges table for storing pathology charges with date ranges
-- Similar to visit_accommodations but for pathology/lab charges

CREATE TABLE IF NOT EXISTS visit_pathology_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rate NUMERIC(10,2) DEFAULT 0,
  days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  amount NUMERIC(10,2) GENERATED ALWAYS AS ((end_date - start_date + 1) * rate) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by visit_id
CREATE INDEX IF NOT EXISTS idx_visit_pathology_charges_visit_id ON visit_pathology_charges(visit_id);

-- Enable Row Level Security
ALTER TABLE visit_pathology_charges ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow all operations (similar to other tables)
CREATE POLICY "Allow all operations on visit_pathology_charges" ON visit_pathology_charges
  FOR ALL USING (true) WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_visit_pathology_charges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visit_pathology_charges_updated_at
  BEFORE UPDATE ON visit_pathology_charges
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_pathology_charges_updated_at();
