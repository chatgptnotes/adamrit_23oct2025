-- Create visit_complications junction table for tracking complications per visit
-- This enables many-to-many relationship between visits and complications

-- First, ensure the table doesn't exist
DROP TABLE IF EXISTS public.visit_complications;

-- Create visit_complications table with proper schema
CREATE TABLE public.visit_complications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  complication_id UUID NOT NULL REFERENCES public.complications(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  severity TEXT DEFAULT 'mild' CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
  onset_date TIMESTAMP WITH TIME ZONE,
  resolution_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ongoing', 'managed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(visit_id, complication_id)
);

-- Create indexes for better performance
CREATE INDEX idx_visit_complications_visit_id ON public.visit_complications(visit_id);
CREATE INDEX idx_visit_complications_complication_id ON public.visit_complications(complication_id);
CREATE INDEX idx_visit_complications_is_primary ON public.visit_complications(is_primary);
CREATE INDEX idx_visit_complications_status ON public.visit_complications(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.visit_complications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allowing all operations for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on visit_complications" ON public.visit_complications
  FOR ALL USING (true) WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.visit_complications IS 'Junction table linking visits to complications with tracking details';
COMMENT ON COLUMN public.visit_complications.is_primary IS 'Indicates if this is the primary complication for the visit';
COMMENT ON COLUMN public.visit_complications.severity IS 'Severity level of the complication';
COMMENT ON COLUMN public.visit_complications.onset_date IS 'Date when complication was first observed';
COMMENT ON COLUMN public.visit_complications.resolution_date IS 'Date when complication was resolved (if applicable)';
COMMENT ON COLUMN public.visit_complications.status IS 'Current status of the complication';
