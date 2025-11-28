-- Insert sample data for Operation Theatre Module
-- This migration adds sample data to demonstrate the operation theatre functionality

-- Insert Operation Theatres
INSERT INTO operation_theatres (id, name, status, capacity, specialty_type, last_cleaned, next_maintenance) VALUES
(1, 'OT-1 (General Surgery)', 'available', 1, 'General Surgery', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '7 days'),
(2, 'OT-2 (Cardiac Surgery)', 'occupied', 1, 'Cardiac Surgery', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '14 days'),
(3, 'OT-3 (Orthopedic)', 'cleaning', 1, 'Orthopedic Surgery', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '10 days'),
(4, 'OT-4 (Emergency)', 'available', 1, 'Emergency Surgery', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '5 days'),
(5, 'OT-5 (Neurosurgery)', 'maintenance', 1, 'Neurosurgery', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days');

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

-- Insert Pre-Op Checklists for scheduled patients
INSERT INTO pre_op_checklist (ot_patient_id, consent_obtained, fasting_confirmed, allergies_checked, medications_reviewed, vital_signs_recorded, lab_results_available, imaging_available, surgical_site_marked, patient_identity_verified, anesthesia_clearance, completed_by)
SELECT 
  id,
  CASE WHEN status IN ('pre_op_preparation', 'ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('pre_op_preparation', 'ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('pre_op_preparation', 'ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('pre_op_preparation', 'ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN true ELSE false END,
  CASE WHEN status IN ('pre_op_preparation', 'ready_for_surgery', 'in_theatre', 'surgery_in_progress') THEN 'Nurse Meera Singh' ELSE NULL END
FROM ot_patients;

-- Insert Intra-Op Notes for surgery in progress
INSERT INTO intra_op_notes (ot_patient_id, start_time, procedure_performed, surgeon, assistants, anesthesia_type, anesthesiologist, notes)
SELECT 
  id,
  NOW() - INTERVAL '45 minutes',
  surgery,
  surgeon,
  ARRAY['Nurse Kavitha Nair', 'Dr. Junior Resident'],
  'General Anesthesia',
  anesthesiologist,
  'Surgery proceeding as planned. Patient stable.'
FROM ot_patients 
WHERE status = 'surgery_in_progress';

-- Insert Inventory Items
INSERT INTO inventory_items (name, category, current_stock, min_stock_level, max_stock_level, unit_cost, supplier, expiry_date, batch_number, sterilization_required, usage_per_day) VALUES
-- Surgical Instruments
('Forceps (Straight)', 'surgical_instruments', 25, 10, 50, 150.00, 'Surgical Instruments Ltd', NULL, NULL, true, 5),
('Forceps (Curved)', 'surgical_instruments', 20, 8, 40, 175.00, 'Surgical Instruments Ltd', NULL, NULL, true, 3),
('Scalpel Handles', 'surgical_instruments', 15, 5, 30, 125.00, 'Medical Tools Inc', NULL, NULL, true, 2),
('Hemostats', 'surgical_instruments', 30, 12, 60, 200.00, 'Surgical Instruments Ltd', NULL, NULL, true, 6),
('Needle Holders', 'surgical_instruments', 18, 8, 35, 250.00, 'Quality Surgical', NULL, NULL, true, 4),

-- Consumables
('Surgical Gloves (Sterile)', 'consumables', 500, 100, 1000, 15.00, 'Ansell Healthcare', '2025-12-31', 'SG2024001', false, 50),
('Gauze Pads (4x4)', 'consumables', 200, 50, 500, 5.00, 'Medical Supplies Co', '2026-06-30', 'GP2024002', false, 25),
('Surgical Sutures (Vicryl)', 'consumables', 75, 20, 150, 45.00, 'Ethicon Inc', '2026-03-15', 'VS2024003', false, 8),
('Bandages (Elastic)', 'consumables', 150, 30, 300, 12.00, 'Medical Supplies Co', '2027-01-20', 'BE2024004', false, 15),
('Surgical Masks (N95)', 'consumables', 1000, 200, 2000, 8.00, '3M Medical', '2025-08-10', 'SM2024005', false, 100),
('Disposable Syringes (10ml)', 'consumables', 800, 150, 1500, 3.50, 'BD Medical', '2026-11-25', 'DS2024006', false, 80),

-- Implants
('Hip Joint Implant (Titanium)', 'implants', 5, 2, 10, 45000.00, 'Orthopedic Implants Ltd', '2030-01-01', 'HI2024001', true, 1),
('Cardiac Stent (Drug Eluting)', 'implants', 8, 3, 15, 85000.00, 'Cardio Medical', '2028-06-30', 'CS2024002', true, 2),
('Bone Screws (Titanium)', 'implants', 50, 15, 100, 2500.00, 'Orthopedic Implants Ltd', '2029-12-31', 'BS2024003', true, 5),

-- Medications
('Propofol (50ml)', 'medications', 30, 10, 60, 350.00, 'Pharma Solutions', '2025-09-15', 'PR2024001', false, 3),
('Midazolam (5ml)', 'medications', 25, 8, 50, 125.00, 'Pharma Solutions', '2025-07-20', 'MD2024002', false, 2),
('Fentanyl (10ml)', 'medications', 20, 5, 40, 275.00, 'Controlled Pharma', '2025-11-30', 'FE2024003', false, 2),
('Atropine (1ml)', 'medications', 40, 12, 80, 85.00, 'Emergency Meds', '2026-02-28', 'AT2024004', false, 4),

-- Anesthesia Supplies
('Endotracheal Tubes (Size 7)', 'anesthesia_supplies', 50, 15, 100, 35.00, 'Airway Medical', '2027-05-15', 'ET2024001', false, 5),
('Laryngeal Masks (Size 4)', 'anesthesia_supplies', 30, 10, 60, 125.00, 'Airway Medical', '2026-08-20', 'LM2024002', false, 3),
('Breathing Circuits', 'anesthesia_supplies', 25, 8, 50, 175.00, 'Anesthesia Equipment Co', '2025-12-10', 'BC2024003', false, 2),
('CO2 Absorber (Soda Lime)', 'anesthesia_supplies', 40, 12, 80, 85.00, 'Anesthesia Equipment Co', '2026-04-30', 'CA2024004', false, 4);

-- Insert some sample resource allocations
INSERT INTO resource_allocations (ot_patient_id, resource_id, resource_name, resource_type, quantity_allocated, allocated_by, status)
SELECT 
  op.id,
  e.id,
  e.name,
  'equipment',
  1,
  'Nurse Meera Singh',
  CASE WHEN op.status IN ('in_theatre', 'surgery_in_progress') THEN 'in_use' ELSE 'allocated' END
FROM ot_patients op
CROSS JOIN equipment e
WHERE op.status IN ('pre_op_preparation', 'ready_for_surgery', 'in_theatre', 'surgery_in_progress')
AND e.type IN ('surgical', 'monitoring')
AND e.theatre_id = op.theatre_number
LIMIT 10;

-- Insert some sample stock transactions
INSERT INTO stock_transactions (inventory_item_id, transaction_type, quantity_change, previous_stock, new_stock, unit_cost, total_cost, notes, performed_by)
SELECT 
  id,
  'consumption',
  -usage_per_day,
  current_stock + usage_per_day,
  current_stock,
  unit_cost,
  unit_cost * usage_per_day,
  'Daily consumption',
  'System Auto'
FROM inventory_items
WHERE usage_per_day IS NOT NULL AND usage_per_day > 0
LIMIT 15;

-- Insert some workflow transitions
INSERT INTO workflow_transitions (ot_patient_id, from_status, to_status, performed_by, notes, duration_in_previous_status)
SELECT 
  id,
  'scheduled',
  status,
  'Nurse Meera Singh',
  'Status updated as per workflow',
  CASE 
    WHEN status = 'pre_op_preparation' THEN 30
    WHEN status = 'surgery_in_progress' THEN 90
    ELSE 15
  END
FROM ot_patients
WHERE status != 'scheduled';

-- Update some equipment to show realistic status
UPDATE equipment SET status = 'in_use' WHERE name IN ('Ventilator', 'Electrocautery Unit') AND theatre_id = 2;
UPDATE equipment SET status = 'maintenance' WHERE name = 'Anesthesia Machine' AND theatre_id = 5;

-- Update some inventory items to show low stock scenarios
UPDATE inventory_items SET current_stock = min_stock_level - 5 WHERE name IN ('Surgical Gloves (Sterile)', 'Hip Joint Implant (Titanium)');
UPDATE inventory_items SET current_stock = min_stock_level WHERE name IN ('Forceps (Curved)', 'Propofol (50ml)');

-- Update some items to show expiring soon
UPDATE inventory_items SET expiry_date = CURRENT_DATE + INTERVAL '15 days' WHERE name IN ('Surgical Masks (N95)', 'Midazolam (5ml)');

-- Set some staff as busy for active surgeries
UPDATE staff_members SET availability_status = 'busy', current_assignment = 'OT-2 Cardiac Surgery' 
WHERE name IN ('Dr. Priya Sharma', 'Dr. Sunita Reddy');

UPDATE staff_members SET availability_status = 'busy', current_assignment = 'OT-4 Emergency Surgery' 
WHERE name = 'Dr. Rajesh Kumar';

-- Update pre-op checklist completion for patients ready for surgery
UPDATE pre_op_checklist SET 
  completed_at = NOW() - INTERVAL '1 hour',
  consent_obtained = true,
  fasting_confirmed = true,
  allergies_checked = true,
  medications_reviewed = true,
  vital_signs_recorded = true,
  lab_results_available = true,
  imaging_available = true,
  surgical_site_marked = true,
  patient_identity_verified = true,
  anesthesia_clearance = true
WHERE ot_patient_id IN (
  SELECT id FROM ot_patients WHERE status IN ('ready_for_surgery', 'in_theatre', 'surgery_in_progress')
);