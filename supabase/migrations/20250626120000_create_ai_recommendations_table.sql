-- Create AI Clinical Recommendations table for temporary storage
-- This table stores AI-generated clinical recommendations for visits

CREATE TABLE IF NOT EXISTS public.ai_clinical_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  
  -- AI Generation Info
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ai_model VARCHAR(50) DEFAULT 'gpt-4',
  prompt_version VARCHAR(20) DEFAULT 'v1.0',
  
  -- Input Context
  surgery_names TEXT[], -- Array of surgery names used for generation
  diagnosis_text TEXT, -- Diagnosis text used for generation
  
  -- Generated Recommendations (JSON format)
  complications JSONB, -- Array of complication names
  lab_tests JSONB, -- Array of lab test names
  radiology_procedures JSONB, -- Array of radiology procedure names
  medications JSONB, -- Array of medication names
  
  -- Status and Metadata
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'reviewed', 'applied', 'archived')),
  reviewed_by UUID, -- User who reviewed the recommendations
  reviewed_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE, -- When recommendations were applied to visit
  
  -- Additional Info
  confidence_score DECIMAL(3,2), -- AI confidence score (0.00-1.00)
  notes TEXT, -- Any additional notes about the recommendations
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_visit_id ON public.ai_clinical_recommendations(visit_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_generated_at ON public.ai_clinical_recommendations(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON public.ai_clinical_recommendations(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.ai_clinical_recommendations ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read their own recommendations
CREATE POLICY "Users can view ai_clinical_recommendations" ON public.ai_clinical_recommendations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow authenticated users to insert recommendations
CREATE POLICY "Users can insert ai_clinical_recommendations" ON public.ai_clinical_recommendations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow authenticated users to update recommendations
CREATE POLICY "Users can update ai_clinical_recommendations" ON public.ai_clinical_recommendations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_recommendations_updated_at
  BEFORE UPDATE ON public.ai_clinical_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_recommendations_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.ai_clinical_recommendations IS 'Stores AI-generated clinical recommendations for patient visits';
COMMENT ON COLUMN public.ai_clinical_recommendations.visit_id IS 'Reference to the visit for which recommendations were generated';
COMMENT ON COLUMN public.ai_clinical_recommendations.surgery_names IS 'Array of surgery names used as input for AI generation';
COMMENT ON COLUMN public.ai_clinical_recommendations.diagnosis_text IS 'Diagnosis text used as input for AI generation';
COMMENT ON COLUMN public.ai_clinical_recommendations.complications IS 'JSON array of AI-generated complication names';
COMMENT ON COLUMN public.ai_clinical_recommendations.lab_tests IS 'JSON array of AI-generated lab test names';
COMMENT ON COLUMN public.ai_clinical_recommendations.radiology_procedures IS 'JSON array of AI-generated radiology procedure names';
COMMENT ON COLUMN public.ai_clinical_recommendations.medications IS 'JSON array of AI-generated medication names';
COMMENT ON COLUMN public.ai_clinical_recommendations.confidence_score IS 'AI confidence score between 0.00 and 1.00';
