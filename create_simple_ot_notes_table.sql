-- ============================================================================
-- SIMPLE OT NOTES TABLE - Only Form Fields
-- This creates a simple table with only the fields from your OT Notes form
-- ============================================================================

-- Drop the table if it exists (for clean creation)
DROP TABLE IF EXISTS ot_notes CASCADE;

-- Create the simplified OT Notes table
CREATE TABLE ot_notes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to patient/visit
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  patient_name VARCHAR(500),

  -- Surgery Details Section (from green box in form)
  surgery_name VARCHAR(500),  -- e.g., "Endoscopic aqueductoplasty"
  surgery_code VARCHAR(100),  -- e.g., "S61"
  surgery_rate DECIMAL(10,2), -- e.g., 10000
  surgery_status VARCHAR(50) DEFAULT 'Sanctioned', -- Sanctioned/Other status

  -- Main Form Fields
  date TIMESTAMPTZ NOT NULL,  -- Date and time field
  procedure_performed TEXT NOT NULL,  -- Procedure Performed field
  surgeon VARCHAR(500) NOT NULL,  -- Surgeon dropdown (e.g., "Dr. Vijay Sarwad")
  anaesthetist VARCHAR(500),  -- Anaesthetist dropdown (e.g., "Dr. Pranit Gumule")
  anaesthesia VARCHAR(200),  -- Anaesthesia dropdown (e.g., "General Anesthesia")
  implant TEXT,  -- Implant field (e.g., "aaa")

  -- Description/Notes Section
  description TEXT,  -- Main OT notes content (INSTRUCTIONS section from form)

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
CREATE INDEX idx_ot_notes_visit_id ON ot_notes(visit_id);
CREATE INDEX idx_ot_notes_patient_id ON ot_notes(patient_id);
CREATE INDEX idx_ot_notes_date ON ot_notes(date);
CREATE INDEX idx_ot_notes_surgeon ON ot_notes(surgeon);
CREATE INDEX idx_ot_notes_created_at ON ot_notes(created_at);

-- Create trigger to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ot_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ot_notes_timestamp
  BEFORE UPDATE ON ot_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_ot_notes_updated_at();

-- Enable Row Level Security
ALTER TABLE ot_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view all OT notes"
  ON ot_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert OT notes"
  ON ot_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update OT notes"
  ON ot_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete OT notes"
  ON ot_notes FOR DELETE
  TO authenticated
  USING (true);

-- Grant permissions
GRANT ALL ON ot_notes TO authenticated;
GRANT ALL ON ot_notes TO service_role;

-- ============================================================================
-- SAMPLE INSERT QUERY (for reference)
-- ============================================================================
/*
INSERT INTO ot_notes (
  visit_id,
  patient_id,
  patient_name,
  surgery_name,
  surgery_code,
  surgery_rate,
  surgery_status,
  date,
  procedure_performed,
  surgeon,
  anaesthetist,
  anaesthesia,
  implant,
  description,
  ai_generated
) VALUES (
  'visit-uuid-here',
  'patient-uuid-here',
  'Patient Name',
  'Endoscopic aqueductoplasty',
  'S61',
  10000,
  'Sanctioned',
  '2025-09-22 11:52:00',
  'Endoscopic aqueductoplasty (S61)',
  'Dr. Vijay Sarwad',
  'Dr. Pranit Gumule',
  'General Anesthesia',
  'aaa',
  'INSTRUCTIONS:
- Post-operative monitoring
- Appropriate pain management
- Follow-up as scheduled
...',
  false
);
*/

-- ============================================================================
-- TABLE CREATED SUCCESSFULLY
-- ============================================================================
-- This simple table contains only the fields from your OT Notes form:
-- - Surgery Details (name, code, rate, status)
-- - Date
-- - Procedure Performed
-- - Surgeon
-- - Anaesthetist
-- - Anaesthesia
-- - Implant
-- - Description (notes)
-- - Support for Save/Print/AI Generate functionality