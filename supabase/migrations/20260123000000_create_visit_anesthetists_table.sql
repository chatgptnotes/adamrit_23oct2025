-- Create visit_anesthetists junction table
CREATE TABLE IF NOT EXISTS visit_anesthetists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  anesthetist_name TEXT NOT NULL,
  anesthetist_type TEXT,
  rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visit_anesthetists_visit_id ON visit_anesthetists(visit_id);

-- Enable RLS
ALTER TABLE visit_anesthetists ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for anonymous access
CREATE POLICY "Allow anonymous access to visit_anesthetists"
  ON visit_anesthetists
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
