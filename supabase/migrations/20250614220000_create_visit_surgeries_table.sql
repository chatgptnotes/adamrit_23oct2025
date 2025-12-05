-- Create visit_surgeries junction table for individual surgery tracking
-- This enables many-to-many relationship between visits and surgeries
-- Each surgery can have individual sanction status tracking

-- First, ensure the table doesn't exist
DROP TABLE IF EXISTS public.visit_surgeries;

-- Create visit_surgeries table with proper schema
CREATE TABLE public.visit_surgeries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  surgery_id UUID NOT NULL REFERENCES cghs_surgery(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  sanction_status TEXT DEFAULT 'Not Sanctioned' CHECK (sanction_status IN ('Sanctioned', 'Not Sanctioned')),
  notes TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  performed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(visit_id, surgery_id)
);

-- Create indexes for better performance
CREATE INDEX idx_visit_surgeries_visit_id ON public.visit_surgeries(visit_id);
CREATE INDEX idx_visit_surgeries_surgery_id ON public.visit_surgeries(surgery_id);
CREATE INDEX idx_visit_surgeries_sanction_status ON public.visit_surgeries(sanction_status);

-- Add RLS policies
ALTER TABLE public.visit_surgeries ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all visit surgeries
CREATE POLICY "Allow authenticated users to read visit surgeries" ON public.visit_surgeries
  FOR SELECT TO authenticated USING (true);

-- Policy for authenticated users to insert visit surgeries
CREATE POLICY "Allow authenticated users to insert visit surgeries" ON public.visit_surgeries
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policy for authenticated users to update visit surgeries
CREATE POLICY "Allow authenticated users to update visit surgeries" ON public.visit_surgeries
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Policy for authenticated users to delete visit surgeries
CREATE POLICY "Allow authenticated users to delete visit surgeries" ON public.visit_surgeries
  FOR DELETE TO authenticated USING (true);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_visit_surgeries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_visit_surgeries_updated_at
  BEFORE UPDATE ON public.visit_surgeries
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_surgeries_updated_at();

-- Insert sample data for testing (if there are existing visits)
-- This will help with development and testing
DO $$
DECLARE
  sample_visit_id TEXT;
  sample_surgery_id UUID;
BEGIN
  -- Get a sample visit ID (first one available)
  SELECT id INTO sample_visit_id FROM visits LIMIT 1;
  
  -- Get a sample surgery ID (appendectomy if available)
  SELECT id INTO sample_surgery_id FROM cghs_surgery 
  WHERE name ILIKE '%appendectomy%' OR name ILIKE '%hernia%' 
  LIMIT 1;
  
  -- Insert sample data only if both visit and surgery exist
  IF sample_visit_id IS NOT NULL AND sample_surgery_id IS NOT NULL THEN
    INSERT INTO public.visit_surgeries (visit_id, surgery_id, status, sanction_status)
    VALUES (sample_visit_id, sample_surgery_id, 'planned', 'Not Sanctioned')
    ON CONFLICT (visit_id, surgery_id) DO NOTHING;
  END IF;
END $$;

-- Add comment to the table
COMMENT ON TABLE public.visit_surgeries IS 'Junction table for tracking individual surgeries per visit with sanction status';
COMMENT ON COLUMN public.visit_surgeries.visit_id IS 'References visits.id - supports TEXT format visit IDs';
COMMENT ON COLUMN public.visit_surgeries.surgery_id IS 'References cghs_surgery.id for surgery master data';
COMMENT ON COLUMN public.visit_surgeries.status IS 'Surgery workflow status: planned, in_progress, completed, cancelled';
COMMENT ON COLUMN public.visit_surgeries.sanction_status IS 'Administrative sanction status: Sanctioned or Not Sanctioned';
COMMENT ON COLUMN public.visit_surgeries.notes IS 'Additional notes about the surgery';
COMMENT ON COLUMN public.visit_surgeries.scheduled_date IS 'When the surgery is scheduled';
COMMENT ON COLUMN public.visit_surgeries.performed_date IS 'When the surgery was actually performed';