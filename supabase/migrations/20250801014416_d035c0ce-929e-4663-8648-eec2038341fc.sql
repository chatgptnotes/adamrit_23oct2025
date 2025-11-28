-- Add discharge workflow fields to visits table
ALTER TABLE visits 
ADD COLUMN discharge_summary_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN nurse_clearance BOOLEAN DEFAULT FALSE,
ADD COLUMN pharmacy_clearance BOOLEAN DEFAULT FALSE,
ADD COLUMN final_bill_printed BOOLEAN DEFAULT FALSE,
ADD COLUMN gate_pass_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN discharge_mode TEXT DEFAULT 'recovery',
ADD COLUMN bill_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN discharge_notes TEXT,
ADD COLUMN authorized_by TEXT,
ADD COLUMN gate_pass_id TEXT;

-- Create discharge_checklist table for detailed tracking
CREATE TABLE discharge_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  doctor_signature BOOLEAN DEFAULT FALSE,
  discharge_summary_uploaded BOOLEAN DEFAULT FALSE,
  nurse_clearance BOOLEAN DEFAULT FALSE,
  pharmacy_clearance BOOLEAN DEFAULT FALSE,
  final_bill_generated BOOLEAN DEFAULT FALSE,
  final_bill_printed BOOLEAN DEFAULT FALSE,
  payment_verified BOOLEAN DEFAULT FALSE,
  gate_pass_generated BOOLEAN DEFAULT FALSE,
  security_verification BOOLEAN DEFAULT FALSE,
  discharge_mode TEXT DEFAULT 'recovery',
  authorized_by TEXT,
  authorized_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gate_pass table for gate pass records
CREATE TABLE gate_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_pass_number TEXT UNIQUE NOT NULL,
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  discharge_date TIMESTAMP WITH TIME ZONE NOT NULL,
  discharge_mode TEXT NOT NULL DEFAULT 'recovery',
  bill_paid BOOLEAN DEFAULT FALSE,
  payment_amount NUMERIC DEFAULT 0,
  receptionist_signature TEXT,
  billing_officer_signature TEXT,
  security_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by TEXT,
  barcode_data TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discharge_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_passes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view discharge checklist" ON discharge_checklist FOR SELECT USING (true);
CREATE POLICY "Users can insert discharge checklist" ON discharge_checklist FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update discharge checklist" ON discharge_checklist FOR UPDATE USING (true);
CREATE POLICY "Users can delete discharge checklist" ON discharge_checklist FOR DELETE USING (true);

CREATE POLICY "Users can view gate passes" ON gate_passes FOR SELECT USING (true);
CREATE POLICY "Users can insert gate passes" ON gate_passes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update gate passes" ON gate_passes FOR UPDATE USING (true);
CREATE POLICY "Users can delete gate passes" ON gate_passes FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_discharge_checklist_visit_id ON discharge_checklist(visit_id);
CREATE INDEX idx_gate_passes_visit_id ON gate_passes(visit_id);
CREATE INDEX idx_gate_passes_patient_id ON gate_passes(patient_id);
CREATE INDEX idx_gate_passes_gate_pass_number ON gate_passes(gate_pass_number);

-- Create trigger for updating discharge_checklist
CREATE OR REPLACE FUNCTION update_discharge_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discharge_checklist_updated_at
  BEFORE UPDATE ON discharge_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_discharge_checklist_updated_at();

-- Create trigger for updating gate_passes
CREATE OR REPLACE FUNCTION update_gate_passes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gate_passes_updated_at
  BEFORE UPDATE ON gate_passes
  FOR EACH ROW
  EXECUTE FUNCTION update_gate_passes_updated_at();

-- Function to generate gate pass number
CREATE OR REPLACE FUNCTION generate_gate_pass_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get current date in YYMMDD format
  SELECT TO_CHAR(CURRENT_DATE, 'YYMMDD') INTO new_number;
  
  -- Get count of gate passes today
  SELECT COUNT(*) + 1 INTO counter
  FROM gate_passes 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: GP + YYMMDD + 001 (3-digit counter)
  new_number := 'GP' || new_number || LPAD(counter::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;