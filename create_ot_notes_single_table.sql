-- ============================================================================
-- OT NOTES SINGLE TABLE MIGRATION
-- This script removes the old multi-table structure and creates a single
-- comprehensive table for storing all OT Notes data
-- ============================================================================

-- STEP 1: DROP OLD TABLES (if they exist)
-- ============================================================================
-- Drop dependent objects first
DROP TABLE IF EXISTS intra_op_notes CASCADE;
DROP TABLE IF EXISTS post_op_notes CASCADE;
DROP TABLE IF EXISTS pre_op_checklist CASCADE;
DROP TABLE IF EXISTS resource_allocations CASCADE;
DROP TABLE IF EXISTS workflow_transitions CASCADE;
DROP TABLE IF EXISTS ot_patients CASCADE;

-- Drop views that depend on these tables
DROP VIEW IF EXISTS active_ot_patients CASCADE;
DROP VIEW IF EXISTS resource_allocation_summary CASCADE;

-- ============================================================================
-- STEP 2: CREATE NEW SINGLE OT_NOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ot_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Patient/Visit Reference
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  patient_name VARCHAR(500),

  -- Surgery Basic Information
  date TIMESTAMPTZ NOT NULL,
  procedure_performed TEXT NOT NULL,
  surgery_code VARCHAR(100), -- For insurance/billing codes
  surgery_status VARCHAR(30) DEFAULT 'scheduled' CHECK (surgery_status IN (
    'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'
  )),

  -- Medical Team
  surgeon VARCHAR(500) NOT NULL,
  anaesthetist VARCHAR(500),
  assistant_surgeon VARCHAR(500),
  scrub_nurse VARCHAR(500),
  circulating_nurse VARCHAR(500),

  -- Anesthesia Details
  anaesthesia_type VARCHAR(200),
  anaesthesia_start_time TIMESTAMPTZ,
  anaesthesia_end_time TIMESTAMPTZ,

  -- Surgery Timing
  surgery_start_time TIMESTAMPTZ,
  surgery_end_time TIMESTAMPTZ,
  actual_duration INTEGER, -- in minutes
  estimated_duration INTEGER, -- in minutes

  -- Implants and Equipment
  implant_details TEXT, -- Single text field for implant information
  implants_used JSONB, -- Structured JSON for multiple implants if needed
  equipment_used TEXT[],

  -- Clinical Details
  pre_operative_diagnosis TEXT,
  post_operative_diagnosis TEXT,
  operative_findings TEXT,
  complications TEXT,
  blood_loss INTEGER, -- in ml
  blood_transfusion_given BOOLEAN DEFAULT FALSE,
  blood_units_transfused INTEGER,

  -- Specimens
  specimens_collected TEXT[],
  specimens_sent_for TEXT, -- histopathology, culture, etc.

  -- Complete Notes/Description
  description TEXT, -- Main OT notes content
  operative_notes TEXT, -- Additional detailed operative notes
  post_op_instructions TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,

  -- Theatre Information
  theatre_number INTEGER,
  theatre_name VARCHAR(100),

  -- Priority and Classification
  priority VARCHAR(20) DEFAULT 'Routine' CHECK (priority IN (
    'Emergency', 'Urgent', 'Routine', 'Elective'
  )),
  surgery_type VARCHAR(50) CHECK (surgery_type IN (
    'Major', 'Minor', 'Day Care', 'Emergency'
  )),

  -- Billing/Insurance Information
  surgery_package_amount DECIMAL(10,2),
  implant_cost DECIMAL(10,2),
  total_ot_charges DECIMAL(10,2),
  insurance_approved BOOLEAN DEFAULT FALSE,
  insurance_approval_number VARCHAR(100),

  -- Audit Fields
  created_by VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(200),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Additional Fields for Integration
  esic_uh_id VARCHAR(100), -- For ESIC integration
  hospital_name VARCHAR(200),
  department VARCHAR(100),

  -- Document References
  consent_form_uploaded BOOLEAN DEFAULT FALSE,
  pre_anaesthetic_checkup_done BOOLEAN DEFAULT FALSE,
  fitness_certificate_uploaded BOOLEAN DEFAULT FALSE,

  -- Status Tracking
  is_printed BOOLEAN DEFAULT FALSE,
  printed_at TIMESTAMPTZ,
  printed_by VARCHAR(200),

  -- AI Generated Content Flag
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_generated_at TIMESTAMPTZ,

  -- Signature Fields
  surgeon_signature TEXT, -- Base64 encoded signature or reference
  anaesthetist_signature TEXT,

  -- Additional metadata as JSONB for flexibility
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ot_notes_visit_id ON ot_notes(visit_id);
CREATE INDEX IF NOT EXISTS idx_ot_notes_patient_id ON ot_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_ot_notes_date ON ot_notes(date);
CREATE INDEX IF NOT EXISTS idx_ot_notes_surgeon ON ot_notes(surgeon);
CREATE INDEX IF NOT EXISTS idx_ot_notes_procedure ON ot_notes(procedure_performed);
CREATE INDEX IF NOT EXISTS idx_ot_notes_surgery_status ON ot_notes(surgery_status);
CREATE INDEX IF NOT EXISTS idx_ot_notes_priority ON ot_notes(priority);
CREATE INDEX IF NOT EXISTS idx_ot_notes_created_at ON ot_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_ot_notes_hospital_name ON ot_notes(hospital_name);

-- Full text search index for notes
CREATE INDEX IF NOT EXISTS idx_ot_notes_description_fts
  ON ot_notes USING gin(to_tsvector('english', description));

-- ============================================================================
-- STEP 4: CREATE TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_ot_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ot_notes_updated_at_trigger
  BEFORE UPDATE ON ot_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_ot_notes_updated_at();

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE ot_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================
-- Allow authenticated users to view all OT notes
CREATE POLICY "Allow authenticated users to view ot notes"
  ON ot_notes FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert OT notes
CREATE POLICY "Allow authenticated users to insert ot notes"
  ON ot_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update OT notes
CREATE POLICY "Allow authenticated users to update ot notes"
  ON ot_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete their own OT notes (optional, can be restricted)
CREATE POLICY "Allow authenticated users to delete ot notes"
  ON ot_notes FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- STEP 7: CREATE USEFUL VIEWS
-- ============================================================================

-- View for active/recent OT notes
CREATE OR REPLACE VIEW recent_ot_notes AS
SELECT
  on.*,
  p.name as patient_full_name,
  p.uhid,
  v.visit_date,
  v.visit_type
FROM ot_notes on
LEFT JOIN patients p ON on.patient_id = p.id
LEFT JOIN visits v ON on.visit_id = v.id
WHERE on.date >= NOW() - INTERVAL '30 days'
ORDER BY on.date DESC;

-- View for pending surgeries
CREATE OR REPLACE VIEW pending_surgeries AS
SELECT
  on.*,
  p.name as patient_full_name,
  p.uhid,
  p.phone
FROM ot_notes on
LEFT JOIN patients p ON on.patient_id = p.id
WHERE on.surgery_status IN ('scheduled', 'postponed')
  AND on.date >= NOW()
ORDER BY on.date ASC;

-- View for completed surgeries summary
CREATE OR REPLACE VIEW completed_surgeries_summary AS
SELECT
  DATE(date) as surgery_date,
  COUNT(*) as total_surgeries,
  COUNT(CASE WHEN priority = 'Emergency' THEN 1 END) as emergency_surgeries,
  COUNT(CASE WHEN priority = 'Routine' THEN 1 END) as routine_surgeries,
  COUNT(CASE WHEN complications IS NOT NULL THEN 1 END) as surgeries_with_complications,
  AVG(actual_duration) as avg_duration_minutes
FROM ot_notes
WHERE surgery_status = 'completed'
GROUP BY DATE(date)
ORDER BY surgery_date DESC;

-- ============================================================================
-- STEP 8: GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON ot_notes TO authenticated;
GRANT ALL ON ot_notes TO service_role;
GRANT SELECT ON recent_ot_notes TO authenticated;
GRANT SELECT ON pending_surgeries TO authenticated;
GRANT SELECT ON completed_surgeries_summary TO authenticated;

-- ============================================================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get next available theatre
CREATE OR REPLACE FUNCTION get_next_available_theatre()
RETURNS INTEGER AS $$
DECLARE
  next_theatre INTEGER;
BEGIN
  -- Simple rotation between theatres 1-5
  SELECT COALESCE(MAX(theatre_number), 0) + 1 INTO next_theatre
  FROM ot_notes
  WHERE date::date = CURRENT_DATE
    AND surgery_status != 'cancelled';

  -- Reset to 1 if exceeds 5
  IF next_theatre > 5 THEN
    next_theatre := 1;
  END IF;

  RETURN next_theatre;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate surgery duration
CREATE OR REPLACE FUNCTION calculate_surgery_duration(
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
) RETURNS INTEGER AS $$
BEGIN
  IF start_time IS NULL OR end_time IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN EXTRACT(EPOCH FROM (end_time - start_time)) / 60;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This creates a single comprehensive ot_notes table that stores all OT-related data
-- The table includes all fields from your form plus additional fields for future expansion
-- All necessary indexes, triggers, and RLS policies are in place