CREATE TABLE IF NOT EXISTS ward_shiftings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES visits(id),
  patient_name TEXT NOT NULL,
  shifting_date TIMESTAMPTZ DEFAULT now(),
  from_ward TEXT,
  shifting_ward TEXT NOT NULL,
  remark TEXT,
  hospital_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ward_shiftings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON ward_shiftings FOR ALL USING (true) WITH CHECK (true);
