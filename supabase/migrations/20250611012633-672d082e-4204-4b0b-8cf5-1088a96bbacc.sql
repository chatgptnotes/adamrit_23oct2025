
-- Create Bills table
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id),
  bill_no TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'GENERAL',
  total_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Bill_Items table
CREATE TABLE public.bill_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  sr_no INTEGER NOT NULL,
  item TEXT NOT NULL,
  esic_nabh_code TEXT,
  esic_nabh_rate DECIMAL(10,2),
  qty INTEGER DEFAULT 1,
  amount DECIMAL(10,2) DEFAULT 0,
  treatment_period TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Doctor_Assignments table
CREATE TABLE public.doctor_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  specialization TEXT,
  consultation_start DATE NOT NULL,
  consultation_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create NABH_Rates table for ESIC rates
CREATE TABLE public.nabh_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  item_name TEXT NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Audit_Trail table
CREATE TABLE public.audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changed_by TEXT,
  changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert some sample NABH rates
INSERT INTO public.nabh_rates (code, item_name, rate, category) VALUES
('PRE-SURG-001', 'Pre-Surgical Conservative Treatment (Per Day)', 1500.00, 'PRE_SURGICAL'),
('SURG-PKG-001', 'Surgical Package (5 Days)', 25000.00, 'SURGICAL'),
('POST-SURG-001', 'Post-Surgical Conservative Treatment (Per Day)', 1800.00, 'POST_SURGICAL'),
('CONSULT-001', 'Specialist Consultation', 500.00, 'CONSULTATION'),
('ROOM-001', 'General Ward (Per Day)', 800.00, 'ACCOMMODATION'),
('LAB-001', 'Basic Laboratory Tests', 300.00, 'LABORATORY'),
('RAD-001', 'Basic Radiology', 1200.00, 'RADIOLOGY');

-- Enable RLS on all tables
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nabh_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bills
CREATE POLICY "Bills are viewable by everyone" ON public.bills FOR SELECT USING (true);
CREATE POLICY "Bills can be created by everyone" ON public.bills FOR INSERT WITH CHECK (true);
CREATE POLICY "Bills can be updated by everyone" ON public.bills FOR UPDATE USING (true);
CREATE POLICY "Bills can be deleted by everyone" ON public.bills FOR DELETE USING (true);

-- Create RLS policies for bill_items
CREATE POLICY "Bill items are viewable by everyone" ON public.bill_items FOR SELECT USING (true);
CREATE POLICY "Bill items can be created by everyone" ON public.bill_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Bill items can be updated by everyone" ON public.bill_items FOR UPDATE USING (true);
CREATE POLICY "Bill items can be deleted by everyone" ON public.bill_items FOR DELETE USING (true);

-- Create RLS policies for doctor_assignments
CREATE POLICY "Doctor assignments are viewable by everyone" ON public.doctor_assignments FOR SELECT USING (true);
CREATE POLICY "Doctor assignments can be created by everyone" ON public.doctor_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Doctor assignments can be updated by everyone" ON public.doctor_assignments FOR UPDATE USING (true);
CREATE POLICY "Doctor assignments can be deleted by everyone" ON public.doctor_assignments FOR DELETE USING (true);

-- Create RLS policies for nabh_rates
CREATE POLICY "NABH rates are viewable by everyone" ON public.nabh_rates FOR SELECT USING (true);
CREATE POLICY "NABH rates can be created by everyone" ON public.nabh_rates FOR INSERT WITH CHECK (true);
CREATE POLICY "NABH rates can be updated by everyone" ON public.nabh_rates FOR UPDATE USING (true);
CREATE POLICY "NABH rates can be deleted by everyone" ON public.nabh_rates FOR DELETE USING (true);

-- Create RLS policies for audit_trail
CREATE POLICY "Audit trail is viewable by everyone" ON public.audit_trail FOR SELECT USING (true);
CREATE POLICY "Audit trail can be created by everyone" ON public.audit_trail FOR INSERT WITH CHECK (true);
CREATE POLICY "Audit trail can be updated by everyone" ON public.audit_trail FOR UPDATE USING (true);
CREATE POLICY "Audit trail can be deleted by everyone" ON public.audit_trail FOR DELETE USING (true);
