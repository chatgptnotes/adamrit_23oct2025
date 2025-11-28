-- =====================================================
-- DIRECT SALE BILLS TABLE (SINGLE TABLE DESIGN)
-- =====================================================
-- This schema stores direct sale bills for patients (both hospital and external) and employees
-- Each medicine item is stored as a separate row with complete bill and patient information

-- Direct Sale Bills Table (Combined Bill + Items)
CREATE TABLE IF NOT EXISTS direct_sale_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Bill Information
  bill_number VARCHAR(50) NOT NULL,
  bill_date TIMESTAMP DEFAULT NOW(),

  -- Patient/Customer Information
  is_hope_employee BOOLEAN DEFAULT FALSE,
  patient_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  age INTEGER,
  gender VARCHAR(20),
  address TEXT,
  doctor_name VARCHAR(255),

  -- Hospital Information
  hospital_name VARCHAR(100),

  -- Payment Information
  payment_mode VARCHAR(50) DEFAULT 'Cash',
  total_amount DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,

  -- Medicine/Item Information (per row)
  item_code VARCHAR(100),
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  quantity_unit VARCHAR(20) DEFAULT 'MSU',
  pack VARCHAR(100),
  batch_no VARCHAR(100),
  stock VARCHAR(100),
  expiry_date DATE,
  mrp DECIMAL(10, 2),
  price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,

  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_sale_bills_bill_number ON direct_sale_bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_direct_sale_bills_patient_name ON direct_sale_bills(patient_name);
CREATE INDEX IF NOT EXISTS idx_direct_sale_bills_bill_date ON direct_sale_bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_direct_sale_bills_hospital_name ON direct_sale_bills(hospital_name);
CREATE INDEX IF NOT EXISTS idx_direct_sale_bills_item_name ON direct_sale_bills(item_name);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_direct_sale_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_direct_sale_bills_updated_at_trigger
  BEFORE UPDATE ON direct_sale_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_direct_sale_bills_updated_at();

-- Example: Insert a sample direct sale bill with 2 medicines
/*
-- First medicine item
INSERT INTO direct_sale_bills (
  bill_number,
  is_hope_employee,
  patient_name,
  date_of_birth,
  age,
  gender,
  address,
  doctor_name,
  hospital_name,
  payment_mode,
  total_amount,
  net_amount,
  item_code,
  item_name,
  quantity,
  quantity_unit,
  pack,
  batch_no,
  stock,
  expiry_date,
  mrp,
  price,
  amount,
  created_by
) VALUES (
  'DSB-2025-0001',
  FALSE,
  'John Doe',
  '1990-05-15',
  35,
  'Male',
  '123 Main Street, City',
  'Dr. Smith',
  'hope',
  'Cash',
  100.00,
  100.00,
  'MED001',
  'Paracetamol 500mg',
  10,
  'MSU',
  '10 tablets',
  'BATCH-001',
  '100',
  '2026-12-31',
  5.00,
  5.00,
  50.00,
  'admin@hospital.com'
);

-- Second medicine item (same bill, patient info repeated)
INSERT INTO direct_sale_bills (
  bill_number,
  is_hope_employee,
  patient_name,
  date_of_birth,
  age,
  gender,
  address,
  doctor_name,
  hospital_name,
  payment_mode,
  total_amount,
  net_amount,
  item_code,
  item_name,
  quantity,
  quantity_unit,
  pack,
  batch_no,
  stock,
  expiry_date,
  mrp,
  price,
  amount,
  created_by
) VALUES (
  'DSB-2025-0001',
  FALSE,
  'John Doe',
  '1990-05-15',
  35,
  'Male',
  '123 Main Street, City',
  'Dr. Smith',
  'hope',
  'Cash',
  100.00,
  100.00,
  'MED002',
  'Amoxicillin 250mg',
  5,
  'MSU',
  '5 capsules',
  'BATCH-002',
  '50',
  '2026-11-30',
  10.00,
  10.00,
  50.00,
  'admin@hospital.com'
);
*/

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON direct_sale_bills TO authenticated;
