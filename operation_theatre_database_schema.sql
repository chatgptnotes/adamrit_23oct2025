-- Operation Theatre Module Database Schema
-- Execute this script in your Supabase SQL Editor to create all tables and sample data

-- ============================================================================
-- STEP 1: CREATE TABLES
-- ============================================================================

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

-- ============================================================================
-- STEP 2: CREATE INDEXES
-- ============================================================================

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

-- ============================================================================
-- STEP 3: CREATE TRIGGERS
-- ============================================================================

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

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================================

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

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================================================

-- Operation Theatres policies
CREATE POLICY "Allow authenticated users to view operation theatres" ON operation_theatres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify operation theatres" ON operation_theatres FOR ALL TO authenticated USING (true);

-- Equipment policies
CREATE POLICY "Allow authenticated users to view equipment" ON equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify equipment" ON equipment FOR ALL TO authenticated USING (true);

-- Staff policies
CREATE POLICY "Allow authenticated users to view staff" ON staff_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify staff" ON staff_members FOR ALL TO authenticated USING (true);

-- OT Patients policies
CREATE POLICY "Allow authenticated users to view ot patients" ON ot_patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify ot patients" ON ot_patients FOR ALL TO authenticated USING (true);

-- Pre-op checklist policies
CREATE POLICY "Allow authenticated users to view pre op checklist" ON pre_op_checklist FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify pre op checklist" ON pre_op_checklist FOR ALL TO authenticated USING (true);

-- Intra-op notes policies
CREATE POLICY "Allow authenticated users to view intra op notes" ON intra_op_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify intra op notes" ON intra_op_notes FOR ALL TO authenticated USING (true);

-- Post-op notes policies
CREATE POLICY "Allow authenticated users to view post op notes" ON post_op_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify post op notes" ON post_op_notes FOR ALL TO authenticated USING (true);

-- Resource allocations policies
CREATE POLICY "Allow authenticated users to view resource allocations" ON resource_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify resource allocations" ON resource_allocations FOR ALL TO authenticated USING (true);

-- Inventory policies
CREATE POLICY "Allow authenticated users to view inventory" ON inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify inventory" ON inventory_items FOR ALL TO authenticated USING (true);

-- Stock transactions policies
CREATE POLICY "Allow authenticated users to view stock transactions" ON stock_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify stock transactions" ON stock_transactions FOR ALL TO authenticated USING (true);

-- Workflow transitions policies
CREATE POLICY "Allow authenticated users to view workflow transitions" ON workflow_transitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to modify workflow transitions" ON workflow_transitions FOR ALL TO authenticated USING (true);

-- ============================================================================
-- STEP 6: CREATE VIEWS
-- ============================================================================

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

-- ============================================================================
-- STEP 7: INSERT SAMPLE DATA
-- ============================================================================

-- Insert Operation Theatres
INSERT INTO operation_theatres (id, name, status, capacity, specialty_type, last_cleaned, next_maintenance) VALUES
(1, 'OT-1 (General Surgery)', 'available', 1, 'General Surgery', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '7 days'),
(2, 'OT-2 (Cardiac Surgery)', 'occupied', 1, 'Cardiac Surgery', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '14 days'),
(3, 'OT-3 (Orthopedic)', 'cleaning', 1, 'Orthopedic Surgery', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '10 days'),
(4, 'OT-4 (Emergency)', 'available', 1, 'Emergency Surgery', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '5 days'),
(5, 'OT-5 (Neurosurgery)', 'maintenance', 1, 'Neurosurgery', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Equipment
INSERT INTO equipment (name, type, status, quantity_available, manufacturer, model, theatre_id) VALUES
('Anesthesia Machine', 'anesthesia', 'available', 1, 'Draeger', 'Fabius GS Premium', 1),
('Ventilator', 'anesthesia', 'in_use', 1, 'Hamilton Medical', 'C6', 2),
('ECG Monitor', 'monitoring', 'available', 1, 'Philips', 'IntelliVue MX800', 1),
('Pulse Oximeter', 'monitoring', 'available', 3, 'Masimo', 'Radical-7', NULL),
('Surgical Table', 'surgical', 'available', 1, 'Maquet', 'Alphastar', 1),
('Electrocautery Unit', 'surgical', 'in_use', 1, 'Medtronic', 'ForceTriad', 2),
('Suction Unit', 'surgical', 'available', 2, 'Allied Healthcare', 'Gomco 6000', NULL),
('Defibrillator', 'monitoring', 'available', 1, 'ZOLL', 'R Series Plus', 4),
('Surgical Lights', 'surgical', 'available', 2, 'Skytron', 'Epic LED', 1),
('Surgical Gloves (Box)', 'disposable', 'available', 50, 'Ansell', 'Gammex', NULL),
('Surgical Masks (Box)', 'disposable', 'available', 100, '3M', 'Procedure Mask', NULL),
('Disposable Gowns', 'disposable', 'available', 75, 'Halyard', 'AAMI Level 3', NULL);

-- Insert Staff Members
INSERT INTO staff_members (name, role, specialization, availability_status, shift_start, shift_end) VALUES
('Dr. Rajesh Kumar', 'surgeon', 'General Surgery', 'available', '08:00', '16:00'),
('Dr. Priya Sharma', 'surgeon', 'Cardiac Surgery', 'busy', '07:00', '15:00'),
('Dr. Amit Patel', 'anesthesiologist', 'General Anesthesia', 'available', '08:00', '16:00'),
('Dr. Sunita Reddy', 'anesthesiologist', 'Cardiac Anesthesia', 'busy', '07:00', '15:00'),
('Nurse Meera Singh', 'nurse', 'OR Nurse', 'available', '08:00', '16:00'),
('Nurse Kavitha Nair', 'nurse', 'Scrub Nurse', 'available', '08:00', '16:00'),
('Nurse Ravi Kumar', 'nurse', 'Circulating Nurse', 'on_break', '08:00', '16:00'),
('Tech. Suresh Babu', 'technician', 'Biomedical', 'available', '08:00', '16:00'),
('Tech. Lakshmi Devi', 'technician', 'Equipment Specialist', 'available', '09:00', '17:00'),
('Dr. Arun Krishnan', 'surgeon', 'Orthopedic Surgery', 'available', '09:00', '17:00'),
('Dr. Deepa Menon', 'anesthesiologist', 'Pediatric Anesthesia', 'off_duty', '16:00', '00:00'),
('Nurse Pooja Gupta', 'nurse', 'Recovery Nurse', 'available', '08:00', '16:00');

-- Insert Sample OT Patients
INSERT INTO ot_patients (patient_name, surgery, surgeon, anesthesiologist, scheduled_time, estimated_duration, priority, status, theatre_number) VALUES
('John Doe', 'Appendectomy', 'Dr. Rajesh Kumar', 'Dr. Amit Patel', NOW() + INTERVAL '2 hours', 90, 'Urgent', 'scheduled', 1),
('Mary Johnson', 'Coronary Bypass Surgery', 'Dr. Priya Sharma', 'Dr. Sunita Reddy', NOW() + INTERVAL '1 hour', 240, 'Emergency', 'pre_op_preparation', 2),
('Robert Smith', 'Knee Replacement', 'Dr. Arun Krishnan', 'Dr. Amit Patel', NOW() + INTERVAL '4 hours', 180, 'Routine', 'scheduled', 3),
('Sarah Wilson', 'Gallbladder Removal', 'Dr. Rajesh Kumar', 'Dr. Amit Patel', NOW() + INTERVAL '6 hours', 120, 'Routine', 'scheduled', 1),
('Michael Brown', 'Emergency Trauma Surgery', 'Dr. Rajesh Kumar', 'Dr. Amit Patel', NOW() - INTERVAL '30 minutes', 150, 'Emergency', 'surgery_in_progress', 4);

-- Insert Inventory Items
INSERT INTO inventory_items (name, category, current_stock, min_stock_level, max_stock_level, unit_cost, supplier, expiry_date, batch_number, sterilization_required, usage_per_day) VALUES
-- Surgical Instruments
('Forceps (Straight)', 'surgical_instruments', 25, 10, 50, 150.00, 'Surgical Instruments Ltd', NULL, NULL, true, 5),
('Forceps (Curved)', 'surgical_instruments', 20, 8, 40, 175.00, 'Surgical Instruments Ltd', NULL, NULL, true, 3),
('Scalpel Handles', 'surgical_instruments', 15, 5, 30, 125.00, 'Medical Tools Inc', NULL, NULL, true, 2),
('Hemostats', 'surgical_instruments', 30, 12, 60, 200.00, 'Surgical Instruments Ltd', NULL, NULL, true, 6),
('Needle Holders', 'surgical_instruments', 18, 8, 35, 250.00, 'Quality Surgical', NULL, NULL, true, 4),

-- Consumables
('Surgical Gloves (Sterile)', 'consumables', 95, 100, 1000, 15.00, 'Ansell Healthcare', '2025-12-31', 'SG2024001', false, 50),
('Gauze Pads (4x4)', 'consumables', 200, 50, 500, 5.00, 'Medical Supplies Co', '2026-06-30', 'GP2024002', false, 25),
('Surgical Sutures (Vicryl)', 'consumables', 75, 20, 150, 45.00, 'Ethicon Inc', '2026-03-15', 'VS2024003', false, 8),
('Bandages (Elastic)', 'consumables', 150, 30, 300, 12.00, 'Medical Supplies Co', '2027-01-20', 'BE2024004', false, 15),
('Surgical Masks (N95)', 'consumables', 1000, 200, 2000, 8.00, '3M Medical', '2024-07-28', 'SM2024005', false, 100),
('Disposable Syringes (10ml)', 'consumables', 800, 150, 1500, 3.50, 'BD Medical', '2026-11-25', 'DS2024006', false, 80),

-- Implants
('Hip Joint Implant (Titanium)', 'implants', 2, 5, 15, 45000.00, 'Orthopedic Implants Ltd', '2030-01-01', 'HI2024001', true, 1),
('Cardiac Stent (Drug Eluting)', 'implants', 8, 3, 15, 85000.00, 'Cardio Medical', '2028-06-30', 'CS2024002', true, 2),
('Bone Screws (Titanium)', 'implants', 50, 15, 100, 2500.00, 'Orthopedic Implants Ltd', '2029-12-31', 'BS2024003', true, 5),

-- Medications
('Propofol (50ml)', 'medications', 10, 10, 60, 350.00, 'Pharma Solutions', '2025-09-15', 'PR2024001', false, 3),
('Midazolam (5ml)', 'medications', 25, 8, 50, 125.00, 'Pharma Solutions', '2024-07-28', 'MD2024002', false, 2),
('Fentanyl (10ml)', 'medications', 20, 5, 40, 275.00, 'Controlled Pharma', '2025-11-30', 'FE2024003', false, 2),
('Atropine (1ml)', 'medications', 40, 12, 80, 85.00, 'Emergency Meds', '2026-02-28', 'AT2024004', false, 4),

-- Anesthesia Supplies
('Endotracheal Tubes (Size 7)', 'anesthesia_supplies', 50, 15, 100, 35.00, 'Airway Medical', '2027-05-15', 'ET2024001', false, 5),
('Laryngeal Masks (Size 4)', 'anesthesia_supplies', 30, 10, 60, 125.00, 'Airway Medical', '2026-08-20', 'LM2024002', false, 3),
('Breathing Circuits', 'anesthesia_supplies', 25, 8, 50, 175.00, 'Anesthesia Equipment Co', '2025-12-10', 'BC2024003', false, 2),
('CO2 Absorber (Soda Lime)', 'anesthesia_supplies', 40, 12, 80, 85.00, 'Anesthesia Equipment Co', '2026-04-30', 'CA2024004', false, 4);

COMMIT;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

-- If you see this message, the Operation Theatre schema has been successfully created!
-- Tables created: 11 main tables + 3 views
-- Sample data inserted: 5 theatres, 12 equipment items, 12 staff members, 5 patients, 20 inventory items
-- Features: RLS enabled, triggers for auto-updating timestamps, indexes for performance

