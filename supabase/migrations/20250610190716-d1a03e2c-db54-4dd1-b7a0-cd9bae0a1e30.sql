
-- Create complications master table
CREATE TABLE public.complications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create CGHS surgery master table
CREATE TABLE public.cghs_surgery (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  code text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create lab master table
CREATE TABLE public.lab (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create radiology master table
CREATE TABLE public.radiology (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create medication master table
CREATE TABLE public.medication (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  generic_name text,
  category text,
  dosage text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert some sample data for complications
INSERT INTO public.complications (name, description) VALUES
('None', 'No complications'),
('Post-operative infection', 'Infection occurring after surgical procedure'),
('Bleeding', 'Excessive bleeding during or after procedure'),
('Deep vein thrombosis', 'Blood clot formation in deep veins'),
('Pneumonia', 'Lung infection'),
('Wound dehiscence', 'Surgical wound reopening');

-- Insert some sample data for CGHS surgery
INSERT INTO public.cghs_surgery (name, code, description) VALUES
('Appendectomy', 'APX001', 'Surgical removal of appendix'),
('Cholecystectomy', 'CHO001', 'Surgical removal of gallbladder'),
('Hernia Repair', 'HER001', 'Surgical repair of hernia'),
('Knee Replacement', 'KNE001', 'Total knee joint replacement'),
('Cataract Surgery', 'CAT001', 'Surgical removal of cataract');

-- Insert some sample data for lab tests
INSERT INTO public.lab (name, category, description) VALUES
('Complete Blood Count', 'Hematology', 'CBC with differential'),
('Basic Metabolic Panel', 'Chemistry', 'BMP including electrolytes'),
('Liver Function Tests', 'Chemistry', 'ALT, AST, Bilirubin'),
('Lipid Panel', 'Chemistry', 'Cholesterol and triglycerides'),
('Thyroid Function Tests', 'Endocrinology', 'TSH, T3, T4'),
('Blood Culture', 'Microbiology', 'Bacterial culture from blood');

-- Insert some sample data for radiology
INSERT INTO public.radiology (name, category, description) VALUES
('Chest X-ray', 'Plain Film', 'Chest radiograph'),
('CT Scan Head', 'CT Scan', 'Computed tomography of head'),
('MRI Brain', 'MRI', 'Magnetic resonance imaging of brain'),
('Ultrasound Abdomen', 'Ultrasound', 'Abdominal ultrasound'),
('Mammography', 'Mammography', 'Breast imaging'),
('Bone Scan', 'Nuclear Medicine', 'Bone scintigraphy');

-- Insert some sample data for medications
INSERT INTO public.medication (name, generic_name, category, dosage, description) VALUES
('Paracetamol', 'Acetaminophen', 'Analgesic', '500mg', 'Pain reliever and fever reducer'),
('Amoxicillin', 'Amoxicillin', 'Antibiotic', '500mg', 'Penicillin antibiotic'),
('Metformin', 'Metformin HCl', 'Antidiabetic', '500mg', 'Type 2 diabetes medication'),
('Amlodipine', 'Amlodipine besylate', 'Antihypertensive', '5mg', 'Calcium channel blocker'),
('Omeprazole', 'Omeprazole', 'PPI', '20mg', 'Proton pump inhibitor'),
('Aspirin', 'Acetylsalicylic acid', 'Antiplatelet', '75mg', 'Blood thinner and pain reliever');
