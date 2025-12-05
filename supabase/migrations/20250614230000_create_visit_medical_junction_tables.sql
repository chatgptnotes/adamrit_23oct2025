-- Create junction tables for visit medical data tracking
-- This enables many-to-many relationships between visits and medical items
-- Each item can have individual status tracking

-- 1. Visit Labs Junction Table
DROP TABLE IF EXISTS public.visit_labs;
CREATE TABLE public.visit_labs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES lab(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ordered' CHECK (status IN ('ordered', 'collected', 'in_progress', 'completed', 'cancelled')),
  ordered_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  collected_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  result_value TEXT,
  normal_range TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(visit_id, lab_id)
);

-- 2. Visit Radiology Junction Table  
DROP TABLE IF EXISTS public.visit_radiology;
CREATE TABLE public.visit_radiology (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  radiology_id UUID NOT NULL REFERENCES radiology(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ordered' CHECK (status IN ('ordered', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  ordered_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  findings TEXT,
  impression TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(visit_id, radiology_id)
);

-- 3. Visit Medications Junction Table
DROP TABLE IF EXISTS public.visit_medications;
CREATE TABLE public.visit_medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES medication(id) ON DELETE CASCADE,
  medication_type TEXT DEFAULT 'other' CHECK (medication_type IN ('antibiotic', 'other')),
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  route TEXT DEFAULT 'oral' CHECK (route IN ('oral', 'iv', 'im', 'topical', 'other')),
  status TEXT DEFAULT 'prescribed' CHECK (status IN ('prescribed', 'dispensed', 'completed', 'discontinued')),
  prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(visit_id, medication_id, medication_type)
);

-- Create indexes for better performance
CREATE INDEX idx_visit_labs_visit_id ON public.visit_labs(visit_id);
CREATE INDEX idx_visit_labs_lab_id ON public.visit_labs(lab_id);
CREATE INDEX idx_visit_labs_status ON public.visit_labs(status);

CREATE INDEX idx_visit_radiology_visit_id ON public.visit_radiology(visit_id);
CREATE INDEX idx_visit_radiology_radiology_id ON public.visit_radiology(radiology_id);
CREATE INDEX idx_visit_radiology_status ON public.visit_radiology(status);

CREATE INDEX idx_visit_medications_visit_id ON public.visit_medications(visit_id);
CREATE INDEX idx_visit_medications_medication_id ON public.visit_medications(medication_id);
CREATE INDEX idx_visit_medications_type ON public.visit_medications(medication_type);
CREATE INDEX idx_visit_medications_status ON public.visit_medications(status);

-- Add RLS policies for all tables
ALTER TABLE public.visit_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_radiology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_medications ENABLE ROW LEVEL SECURITY;

-- Visit Labs policies
CREATE POLICY "Allow authenticated users to read visit labs" ON public.visit_labs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert visit labs" ON public.visit_labs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update visit labs" ON public.visit_labs
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete visit labs" ON public.visit_labs
  FOR DELETE TO authenticated USING (true);

-- Visit Radiology policies
CREATE POLICY "Allow authenticated users to read visit radiology" ON public.visit_radiology
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert visit radiology" ON public.visit_radiology
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update visit radiology" ON public.visit_radiology
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete visit radiology" ON public.visit_radiology
  FOR DELETE TO authenticated USING (true);

-- Visit Medications policies
CREATE POLICY "Allow authenticated users to read visit medications" ON public.visit_medications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert visit medications" ON public.visit_medications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update visit medications" ON public.visit_medications
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete visit medications" ON public.visit_medications
  FOR DELETE TO authenticated USING (true);

-- Create triggers to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_visit_medical_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visit_labs_updated_at
  BEFORE UPDATE ON public.visit_labs
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_medical_updated_at();

CREATE TRIGGER trigger_update_visit_radiology_updated_at
  BEFORE UPDATE ON public.visit_radiology
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_medical_updated_at();

CREATE TRIGGER trigger_update_visit_medications_updated_at
  BEFORE UPDATE ON public.visit_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_medical_updated_at();

-- Add comments to tables
COMMENT ON TABLE public.visit_labs IS 'Junction table for tracking individual lab tests per visit';
COMMENT ON TABLE public.visit_radiology IS 'Junction table for tracking individual radiology studies per visit';
COMMENT ON TABLE public.visit_medications IS 'Junction table for tracking individual medications per visit';

COMMENT ON COLUMN public.visit_labs.visit_id IS 'References visits.id - supports TEXT format visit IDs';
COMMENT ON COLUMN public.visit_labs.lab_id IS 'References lab.id for lab test master data';
COMMENT ON COLUMN public.visit_labs.status IS 'Lab test workflow status';

COMMENT ON COLUMN public.visit_radiology.visit_id IS 'References visits.id - supports TEXT format visit IDs';
COMMENT ON COLUMN public.visit_radiology.radiology_id IS 'References radiology.id for radiology study master data';
COMMENT ON COLUMN public.visit_radiology.status IS 'Radiology study workflow status';

COMMENT ON COLUMN public.visit_medications.visit_id IS 'References visits.id - supports TEXT format visit IDs';
COMMENT ON COLUMN public.visit_medications.medication_id IS 'References medication.id for medication master data';
COMMENT ON COLUMN public.visit_medications.medication_type IS 'Whether this is an antibiotic or other medication';
COMMENT ON COLUMN public.visit_medications.status IS 'Medication prescription and dispensing status';