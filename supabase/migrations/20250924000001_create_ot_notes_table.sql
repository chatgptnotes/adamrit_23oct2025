-- Create OT Notes table for storing operation theatre notes
CREATE TABLE IF NOT EXISTS ot_notes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to patient/visit
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  patient_name VARCHAR(500),

  -- Surgery Details Section
  surgery_name VARCHAR(500),
  surgery_code VARCHAR(100),
  surgery_rate DECIMAL(10,2),
  surgery_status VARCHAR(50) DEFAULT 'Sanctioned',

  -- Main Form Fields
  date TIMESTAMPTZ NOT NULL,
  procedure_performed TEXT NOT NULL,
  surgeon VARCHAR(500) NOT NULL,
  anaesthetist VARCHAR(500),
  anaesthesia VARCHAR(200),
  implant TEXT,

  -- Description/Notes Section
  description TEXT,

  -- For AI Generate functionality
  ai_generated BOOLEAN DEFAULT FALSE,

  -- For Save and Print functionality
  is_saved BOOLEAN DEFAULT FALSE,
  saved_at TIMESTAMPTZ,
  is_printed BOOLEAN DEFAULT FALSE,
  printed_at TIMESTAMPTZ,

  -- Basic timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ot_notes_visit_id ON ot_notes(visit_id);
CREATE INDEX IF NOT EXISTS idx_ot_notes_patient_id ON ot_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_ot_notes_date ON ot_notes(date);

-- Add RLS policies
ALTER TABLE ot_notes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on ot_notes"
  ON ot_notes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE ot_notes IS 'Stores Operation Theatre notes and surgical details for patient visits';