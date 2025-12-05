-- Operation Theatre Module Tables
-- This migration creates all tables needed for the enterprise operation theatre module

-- 1. Operation Theatres Table
CREATE TABLE IF NOT EXISTS operation_theatres (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance')),
  capacity INTEGER NOT NULL DEFAULT 1,
  specialty_type VARCHAR(100),
  last_cleaned TIMESTAMPTZ,
  next_maintenance TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('surgical', 'anesthesia', 'monitoring', 'disposable')),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'out_of_stock')),
  quantity_available INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  last_sterilized TIMESTAMPTZ,
  manufacturer VARCHAR(200),
  model VARCHAR(200),
  theatre_id INTEGER REFERENCES operation_theatres(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staff Members Table
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('surgeon', 'anesthesiologist', 'nurse', 'technician')),
  specialization VARCHAR(200),
  availability_status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'on_break', 'off_duty')),
  current_assignment VARCHAR(200),
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Operation Theatre Patients Table
CREATE TABLE IF NOT EXISTS ot_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  patient_name VARCHAR(200) NOT NULL,
  surgery VARCHAR(500) NOT NULL,
  surgeon VARCHAR(200) NOT NULL,
  anesthesiologist VARCHAR(200),
  scheduled_time TIMESTAMPTZ NOT NULL,
  estimated_duration INTEGER NOT NULL, -- in minutes
  priority VARCHAR(20) NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Emergency', 'Urgent', 'Routine')),
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'pre_op_preparation', 'ready_for_surgery', 'in_theatre', 'surgery_in_progress', 'surgery_completed', 'post_op_recovery', 'discharged_from_ot', 'cancelled')),
  theatre_number INTEGER NOT NULL REFERENCES operation_theatres(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pre-Op Checklist Table
CREATE TABLE IF NOT EXISTS pre_op_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_patient_id UUID REFERENCES ot_patients(id) ON DELETE CASCADE,
  consent_obtained BOOLEAN DEFAULT FALSE,
  fasting_confirmed BOOLEAN DEFAULT FALSE,
  allergies_checked BOOLEAN DEFAULT FALSE,
  medications_reviewed BOOLEAN DEFAULT FALSE,
  vital_signs_recorded BOOLEAN DEFAULT FALSE,
  lab_results_available BOOLEAN DEFAULT FALSE,
  imaging_available BOOLEAN DEFAULT FALSE,
  surgical_site_marked BOOLEAN DEFAULT FALSE,
  patient_identity_verified BOOLEAN DEFAULT FALSE,
  anesthesia_clearance BOOLEAN DEFAULT FALSE,
  completed_by VARCHAR(200),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Intra-Op Notes Table
CREATE TABLE IF NOT EXISTS intra_op_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_patient_id UUID REFERENCES ot_patients(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  procedure_performed TEXT NOT NULL,
  surgeon VARCHAR(200) NOT NULL,
  assistants TEXT[], -- Array of assistant names
  anesthesia_type VARCHAR(200) NOT NULL,
  anesthesiologist VARCHAR(200) NOT NULL,
  complications TEXT,
  blood_loss INTEGER, -- in ml
  fluids_given TEXT,
  specimens_collected TEXT[],
  implants_used TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Post-Op Notes Table
CREATE TABLE IF NOT EXISTS post_op_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_patient_id UUID REFERENCES ot_patients(id) ON DELETE CASCADE,
  recovery_start_time TIMESTAMPTZ NOT NULL,
  vital_signs_stable BOOLEAN DEFAULT FALSE,
  pain_score INTEGER CHECK (pain_score >= 0 AND pain_score <= 10),
  nausea_vomiting BOOLEAN DEFAULT FALSE,
  bleeding_check BOOLEAN DEFAULT FALSE,
  drain_output TEXT,
  instructions TEXT,
  medications_prescribed TEXT[],
  follow_up_required BOOLEAN DEFAULT FALSE,
  discharge_time TIMESTAMPTZ,
  discharge_condition TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Resource Allocations Table
CREATE TABLE IF NOT EXISTS resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_patient_id UUID REFERENCES ot_patients(id) ON DELETE CASCADE,
  resource_id UUID, -- Can reference equipment, staff, or other resources
  resource_name VARCHAR(200) NOT NULL,
  resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('equipment', 'staff', 'consumable')),
  quantity_allocated INTEGER NOT NULL DEFAULT 1,
  allocated_at TIMESTAMPTZ DEFAULT NOW(),
  allocated_by VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'allocated' CHECK (status IN ('allocated', 'in_use', 'returned', 'consumed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(300) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('surgical_instruments', 'consumables', 'implants', 'medications', 'anesthesia_supplies')),
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 0,
  max_stock_level INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier VARCHAR(200) NOT NULL,
  expiry_date DATE,
  batch_number VARCHAR(100),
  sterilization_required BOOLEAN DEFAULT FALSE,
  last_sterilized TIMESTAMPTZ,
  last_restocked TIMESTAMPTZ,
  usage_per_day INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Stock Transactions Table
CREATE TABLE IF NOT EXISTS stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('addition', 'consumption', 'adjustment', 'expiry', 'return')),
  quantity_change INTEGER NOT NULL, -- Positive for additions, negative for consumption
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  notes TEXT,
  performed_by VARCHAR(200) NOT NULL,
  reference_id UUID, -- Can reference ot_patient_id or other related entities
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Workflow Transitions Table
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ot_patient_id UUID REFERENCES ot_patients(id) ON DELETE CASCADE,
  from_status VARCHAR(30) NOT NULL,
  to_status VARCHAR(30) NOT NULL,
  transition_time TIMESTAMPTZ DEFAULT NOW(),
  performed_by VARCHAR(200) NOT NULL,
  notes TEXT,
  duration_in_previous_status INTEGER, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ot_patients_status ON ot_patients(status);
CREATE INDEX IF NOT EXISTS idx_ot_patients_scheduled_time ON ot_patients(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_ot_patients_theatre ON ot_patients(theatre_number);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_staff_availability ON staff_members(availability_status);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff_members(role);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_levels ON inventory_items(current_stock, min_stock_level);
CREATE INDEX IF NOT EXISTS idx_resource_allocations_patient ON resource_allocations(ot_patient_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item ON stock_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_workflow_transitions_patient ON workflow_transitions(ot_patient_id);

-- Create triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_operation_theatres_updated_at BEFORE UPDATE ON operation_theatres FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ot_patients_updated_at BEFORE UPDATE ON ot_patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pre_op_checklist_updated_at BEFORE UPDATE ON pre_op_checklist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intra_op_notes_updated_at BEFORE UPDATE ON intra_op_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_post_op_notes_updated_at BEFORE UPDATE ON post_op_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resource_allocations_updated_at BEFORE UPDATE ON resource_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE operation_theatres ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ot_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_op_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE intra_op_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_op_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing authenticated users to access all records for now)
-- In production, you may want more restrictive policies based on user roles

CREATE POLICY "Allow authenticated users to view operation theatres" ON operation_theatres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify operation theatres" ON operation_theatres FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view equipment" ON equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify equipment" ON equipment FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view staff" ON staff_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify staff" ON staff_members FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view ot patients" ON ot_patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify ot patients" ON ot_patients FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view pre op checklist" ON pre_op_checklist FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify pre op checklist" ON pre_op_checklist FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view intra op notes" ON intra_op_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify intra op notes" ON intra_op_notes FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view post op notes" ON post_op_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify post op notes" ON post_op_notes FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view resource allocations" ON resource_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify resource allocations" ON resource_allocations FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view inventory" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify inventory" ON inventory_items FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view stock transactions" ON stock_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify stock transactions" ON stock_transactions FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to view workflow transitions" ON workflow_transitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify workflow transitions" ON workflow_transitions FOR ALL TO authenticated USING (true);

-- Create views for common queries

-- Active OT Patients View
CREATE OR REPLACE VIEW active_ot_patients AS
SELECT 
  op.*,
  ot.name as theatre_name,
  pc.completed_at as checklist_completed_at,
  CASE 
    WHEN pc.consent_obtained AND pc.fasting_confirmed AND pc.allergies_checked 
         AND pc.medications_reviewed AND pc.vital_signs_recorded 
         AND pc.lab_results_available AND pc.imaging_available 
         AND pc.surgical_site_marked AND pc.patient_identity_verified 
         AND pc.anesthesia_clearance 
    THEN true 
    ELSE false 
  END as checklist_complete
FROM ot_patients op
LEFT JOIN operation_theatres ot ON op.theatre_number = ot.id
LEFT JOIN pre_op_checklist pc ON op.id = pc.ot_patient_id
WHERE op.status NOT IN ('discharged_from_ot', 'cancelled')
ORDER BY op.scheduled_time;

-- Inventory Status View
CREATE OR REPLACE VIEW inventory_status AS
SELECT 
  *,
  CASE 
    WHEN current_stock <= min_stock_level THEN 'critical'
    WHEN current_stock <= min_stock_level * 1.5 THEN 'low'
    WHEN current_stock >= max_stock_level THEN 'overstock'
    ELSE 'normal'
  END as stock_status,
  current_stock * unit_cost as total_value,
  CASE 
    WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' 
    THEN true 
    ELSE false 
  END as expiring_soon
FROM inventory_items
ORDER BY 
  CASE 
    WHEN current_stock <= min_stock_level THEN 1
    WHEN current_stock <= min_stock_level * 1.5 THEN 2
    ELSE 3
  END,
  name;

-- Resource Allocation Summary View
CREATE OR REPLACE VIEW resource_allocation_summary AS
SELECT 
  ra.*,
  op.patient_name,
  op.surgery,
  op.status as patient_status,
  ot.name as theatre_name
FROM resource_allocations ra
LEFT JOIN ot_patients op ON ra.ot_patient_id = op.id
LEFT JOIN operation_theatres ot ON op.theatre_number = ot.id
WHERE ra.status IN ('allocated', 'in_use')
ORDER BY ra.allocated_at DESC;