-- Add missing fields to lab, radiology, and medication tables for billing functionality
-- This migration adds amount, code, and other required fields

-- Add missing fields to lab table
ALTER TABLE public.lab 
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0.00;

-- Add missing fields to radiology table  
ALTER TABLE public.radiology
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0.00;

-- Add missing fields to medication table
ALTER TABLE public.medication
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS mrp DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS pack TEXT,
ADD COLUMN IF NOT EXISTS batch_no TEXT,
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Update existing lab data with sample codes and amounts
UPDATE public.lab SET 
  code = CASE 
    WHEN name = 'Complete Blood Count' THEN 'CBC'
    WHEN name = 'Basic Metabolic Panel' THEN 'BMP'
    WHEN name = 'Liver Function Tests' THEN 'LFT'
    WHEN name = 'Lipid Panel' THEN 'LIPID'
    WHEN name = 'Thyroid Function Tests' THEN 'TFT'
    WHEN name = 'Blood Culture' THEN 'BC'
    ELSE UPPER(LEFT(name, 3))
  END,
  amount = CASE 
    WHEN name = 'Complete Blood Count' THEN 450.00
    WHEN name = 'Basic Metabolic Panel' THEN 350.00
    WHEN name = 'Liver Function Tests' THEN 500.00
    WHEN name = 'Lipid Panel' THEN 400.00
    WHEN name = 'Thyroid Function Tests' THEN 600.00
    WHEN name = 'Blood Culture' THEN 800.00
    ELSE 300.00
  END
WHERE code IS NULL OR amount = 0;

-- Update existing radiology data with sample codes and amounts
UPDATE public.radiology SET 
  code = CASE 
    WHEN name = 'Chest X-ray' THEN 'CXR'
    WHEN name = 'CT Scan Head' THEN 'CTH'
    WHEN name = 'MRI Brain' THEN 'MRIB'
    WHEN name = 'Ultrasound Abdomen' THEN 'USA'
    WHEN name = 'Mammography' THEN 'MMG'
    WHEN name = 'Bone Scan' THEN 'BS'
    ELSE UPPER(LEFT(name, 3))
  END,
  amount = CASE 
    WHEN name = 'Chest X-ray' THEN 500.00
    WHEN name = 'CT Scan Head' THEN 3500.00
    WHEN name = 'MRI Brain' THEN 8500.00
    WHEN name = 'Ultrasound Abdomen' THEN 1200.00
    WHEN name = 'Mammography' THEN 1500.00
    WHEN name = 'Bone Scan' THEN 4500.00
    ELSE 1000.00
  END
WHERE code IS NULL OR amount = 0;

-- Update existing medication data with sample codes and amounts
UPDATE public.medication SET 
  code = CASE 
    WHEN name = 'Paracetamol' THEN 'PCM500'
    WHEN name = 'Amoxicillin' THEN 'AMOX500'
    WHEN name = 'Metformin' THEN 'MET500'
    WHEN name = 'Amlodipine' THEN 'AML5'
    WHEN name = 'Omeprazole' THEN 'OME20'
    WHEN name = 'Aspirin' THEN 'ASP75'
    ELSE UPPER(LEFT(name, 3)) || '001'
  END,
  amount = CASE 
    WHEN name = 'Paracetamol' THEN 5.00
    WHEN name = 'Amoxicillin' THEN 25.00
    WHEN name = 'Metformin' THEN 8.00
    WHEN name = 'Amlodipine' THEN 12.00
    WHEN name = 'Omeprazole' THEN 15.00
    WHEN name = 'Aspirin' THEN 3.00
    ELSE 10.00
  END,
  mrp = CASE 
    WHEN name = 'Paracetamol' THEN 8.00
    WHEN name = 'Amoxicillin' THEN 35.00
    WHEN name = 'Metformin' THEN 12.00
    WHEN name = 'Amlodipine' THEN 18.00
    WHEN name = 'Omeprazole' THEN 22.00
    WHEN name = 'Aspirin' THEN 5.00
    ELSE 15.00
  END,
  pack = CASE 
    WHEN name = 'Paracetamol' THEN '10 tablets'
    WHEN name = 'Amoxicillin' THEN '10 capsules'
    WHEN name = 'Metformin' THEN '10 tablets'
    WHEN name = 'Amlodipine' THEN '10 tablets'
    WHEN name = 'Omeprazole' THEN '10 capsules'
    WHEN name = 'Aspirin' THEN '10 tablets'
    ELSE '10 units'
  END,
  batch_no = 'BATCH' || LPAD((RANDOM() * 9999)::INTEGER::TEXT, 4, '0'),
  stock = (RANDOM() * 100 + 50)::INTEGER,
  expiry_date = CURRENT_DATE + INTERVAL '1 year' + (RANDOM() * INTERVAL '2 years')
WHERE code IS NULL OR amount = 0;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_lab_code ON public.lab(code);
CREATE INDEX IF NOT EXISTS idx_lab_name_search ON public.lab USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_lab_description_search ON public.lab USING gin(to_tsvector('english', description));

CREATE INDEX IF NOT EXISTS idx_radiology_code ON public.radiology(code);
CREATE INDEX IF NOT EXISTS idx_radiology_name_search ON public.radiology USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_radiology_description_search ON public.radiology USING gin(to_tsvector('english', description));

CREATE INDEX IF NOT EXISTS idx_medication_code ON public.medication(code);
CREATE INDEX IF NOT EXISTS idx_medication_name_search ON public.medication USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_medication_description_search ON public.medication USING gin(to_tsvector('english', description));

-- Add some additional lab tests with CBC variations
INSERT INTO public.lab (name, category, description, code, amount) VALUES
('CBC with Differential', 'Hematology', 'Complete blood count with differential count', 'CBCD', 500.00),
('CBC without Differential', 'Hematology', 'Complete blood count without differential', 'CBCND', 400.00),
('Hemoglobin', 'Hematology', 'Hemoglobin level test', 'HB', 150.00),
('Platelet Count', 'Hematology', 'Platelet count test', 'PLT', 200.00),
('ESR', 'Hematology', 'Erythrocyte sedimentation rate', 'ESR', 100.00)
ON CONFLICT (name) DO NOTHING;

-- Add some additional radiology tests
INSERT INTO public.radiology (name, category, description, code, amount) VALUES
('X-ray Chest PA', 'Plain Film', 'Chest X-ray posteroanterior view', 'CXRPA', 450.00),
('X-ray Chest Lateral', 'Plain Film', 'Chest X-ray lateral view', 'CXRLAT', 450.00),
('CT Chest', 'CT Scan', 'Computed tomography of chest', 'CTC', 4500.00),
('MRI Spine', 'MRI', 'Magnetic resonance imaging of spine', 'MRIS', 9500.00),
('Ultrasound Pelvis', 'Ultrasound', 'Pelvic ultrasound', 'USP', 1000.00)
ON CONFLICT (name) DO NOTHING;

-- Add some additional medications
INSERT INTO public.medication (name, generic_name, category, dosage, description, code, amount, mrp, pack, batch_no, stock, expiry_date) VALUES
('Cefixime', 'Cefixime', 'Antibiotic', '200mg', 'Third generation cephalosporin', 'CEF200', 45.00, 65.00, '10 tablets', 'BATCH1234', 75, CURRENT_DATE + INTERVAL '18 months'),
('Azithromycin', 'Azithromycin', 'Antibiotic', '500mg', 'Macrolide antibiotic', 'AZI500', 85.00, 120.00, '3 tablets', 'BATCH5678', 60, CURRENT_DATE + INTERVAL '2 years'),
('Pantoprazole', 'Pantoprazole', 'PPI', '40mg', 'Proton pump inhibitor', 'PAN40', 18.00, 25.00, '10 tablets', 'BATCH9012', 90, CURRENT_DATE + INTERVAL '20 months')
ON CONFLICT (name) DO NOTHING;
