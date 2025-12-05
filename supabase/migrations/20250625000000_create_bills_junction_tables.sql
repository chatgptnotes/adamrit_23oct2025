-- Create junction tables for bills to store diagnoses, surgeries, and pharmacy items
-- This migration creates bills_diagnoses, bills_surgeries, and bills_pharmacy junction tables

-- 1. Bills Diagnoses Junction Table
CREATE TABLE IF NOT EXISTS public.bills_diagnoses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bill_id, diagnosis_id)
);

-- 2. Bills Surgeries Junction Table  
CREATE TABLE IF NOT EXISTS public.bills_surgeries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  surgery_id UUID NOT NULL REFERENCES public.cghs_surgery(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  sanction_status TEXT DEFAULT 'Not Sanctioned' CHECK (sanction_status IN ('Sanctioned', 'Not Sanctioned')),
  notes TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  performed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bill_id, surgery_id)
);

-- 3. Bills Pharmacy Junction Table
CREATE TABLE IF NOT EXISTS public.bills_pharmacy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  medication_code TEXT,
  batch_no TEXT,
  expiry_date DATE,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  administration_date DATE,
  administration_time TIME,
  instructions TEXT,
  external_requisition TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_diagnoses_bill_id ON public.bills_diagnoses(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_diagnoses_diagnosis_id ON public.bills_diagnoses(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_bills_surgeries_bill_id ON public.bills_surgeries(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_surgeries_surgery_id ON public.bills_surgeries(surgery_id);
CREATE INDEX IF NOT EXISTS idx_bills_pharmacy_bill_id ON public.bills_pharmacy(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_pharmacy_medication_name ON public.bills_pharmacy(medication_name);
CREATE INDEX IF NOT EXISTS idx_bills_pharmacy_administration_date ON public.bills_pharmacy(administration_date);

-- Enable RLS (Row Level Security)
ALTER TABLE public.bills_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills_surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills_pharmacy ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on bills_diagnoses" ON public.bills_diagnoses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on bills_surgeries" ON public.bills_surgeries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on bills_pharmacy" ON public.bills_pharmacy
  FOR ALL USING (true) WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.bills_diagnoses IS 'Junction table linking bills to diagnoses';
COMMENT ON TABLE public.bills_surgeries IS 'Junction table linking bills to CGHS surgeries';
COMMENT ON TABLE public.bills_pharmacy IS 'Junction table storing pharmacy/medication items for bills';
COMMENT ON COLUMN public.bills_diagnoses.is_primary IS 'Indicates if this is the primary diagnosis for the bill';
COMMENT ON COLUMN public.bills_surgeries.is_primary IS 'Indicates if this is the primary surgery for the bill';
COMMENT ON COLUMN public.bills_pharmacy.administration_date IS 'Date when medication was administered';
COMMENT ON COLUMN public.bills_pharmacy.administration_time IS 'Time when medication was administered';
COMMENT ON COLUMN public.bills_pharmacy.total_amount IS 'Total cost for this medication (quantity * unit_price)';
