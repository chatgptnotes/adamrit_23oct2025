
-- Create diagnoses table
CREATE TABLE public.diagnoses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnosis_id UUID REFERENCES public.diagnoses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  primary_diagnosis TEXT NOT NULL,
  complications TEXT DEFAULT 'None',
  surgery TEXT,
  labs_radiology TEXT,
  antibiotics TEXT,
  other_medications TEXT,
  surgeon TEXT,
  consultant TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policies for diagnoses (public read access for now)
CREATE POLICY "Anyone can view diagnoses" 
  ON public.diagnoses 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert diagnoses" 
  ON public.diagnoses 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update diagnoses" 
  ON public.diagnoses 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete diagnoses" 
  ON public.diagnoses 
  FOR DELETE 
  USING (true);

-- Create policies for patients (public access for now)
CREATE POLICY "Anyone can view patients" 
  ON public.patients 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert patients" 
  ON public.patients 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update patients" 
  ON public.patients 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete patients" 
  ON public.patients 
  FOR DELETE 
  USING (true);

-- Insert initial diagnosis categories
INSERT INTO public.diagnoses (name, description) VALUES
('Inguinal Hernia', 'Hernias occurring in the inguinal region'),
('Hypospadias', 'Congenital condition where urethral opening is not at tip of penis'),
('Undescended Testis', 'Condition where one or both testicles fail to descend'),
('Appendicitis', 'Inflammation of the appendix'),
('Gallbladder Disease', 'Various conditions affecting the gallbladder'),
('Thyroid Disorders', 'Conditions affecting the thyroid gland');
