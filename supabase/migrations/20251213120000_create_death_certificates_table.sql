-- Create death_certificates table
CREATE TABLE IF NOT EXISTS death_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name VARCHAR(255),
  registration_id VARCHAR(100),
  address TEXT,
  age_sex VARCHAR(50),
  consultant VARCHAR(255),
  expired_on TIMESTAMP,
  cause_of_death TEXT,
  certificate_date TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_death_cert_visit_id ON death_certificates(visit_id);
CREATE INDEX IF NOT EXISTS idx_death_cert_patient_id ON death_certificates(patient_id);

-- Enable RLS
ALTER TABLE death_certificates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (same pattern as other tables)
CREATE POLICY "Allow all operations on death_certificates" ON death_certificates
  FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_death_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_death_certificates_updated_at
  BEFORE UPDATE ON death_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_death_certificates_updated_at();
