-- Sample data insertion for radiology module

-- Insert sample modalities
INSERT INTO radiology_modalities (name, code, description, manufacturer, model, location) VALUES
('Computed Tomography Scanner', 'CT', '64-slice CT scanner for routine and emergency imaging', 'Siemens', 'SOMATOM Definition Flash', 'Radiology Wing - Room 101'),
('Magnetic Resonance Imaging', 'MRI', '3T MRI system for detailed soft tissue imaging', 'GE Healthcare', 'SIGNA Pioneer', 'Radiology Wing - Room 102'),
('Digital Radiography', 'XR', 'Digital X-ray system for general radiography', 'Philips', 'DigitalDiagnost C90', 'Radiology Wing - Room 103'),
('Ultrasound Scanner', 'US', 'High-end ultrasound system for abdominal and obstetric imaging', 'Samsung', 'RS85', 'Radiology Wing - Room 104'),
('Mammography Unit', 'MG', 'Digital mammography system for breast cancer screening', 'Hologic', 'Selenia Dimensions', 'Radiology Wing - Room 105'),
('Fluoroscopy Unit', 'FL', 'C-arm fluoroscopy for interventional procedures', 'Philips', 'Azurion 7', 'Radiology Wing - Room 106')
ON CONFLICT (code) DO NOTHING;

-- Insert sample procedures
INSERT INTO radiology_procedures (name, code, modality_id, body_part, contrast_required, estimated_duration, price) VALUES
('CT Brain without contrast', 'CT-BR-NC', (SELECT id FROM radiology_modalities WHERE code = 'CT'), 'Brain', false, 15, 3500.00),
('CT Chest with contrast', 'CT-CH-WC', (SELECT id FROM radiology_modalities WHERE code = 'CT'), 'Chest', true, 25, 5500.00),
('MRI Brain with contrast', 'MRI-BR-WC', (SELECT id FROM radiology_modalities WHERE code = 'MRI'), 'Brain', true, 45, 8500.00),
('Chest X-ray PA view', 'XR-CH-PA', (SELECT id FROM radiology_modalities WHERE code = 'XR'), 'Chest', false, 10, 500.00),
('Abdominal Ultrasound', 'US-ABD', (SELECT id FROM radiology_modalities WHERE code = 'US'), 'Abdomen', false, 30, 1500.00),
('Screening Mammography', 'MG-SCR', (SELECT id FROM radiology_modalities WHERE code = 'MG'), 'Breast', false, 20, 2500.00)
ON CONFLICT (code) DO NOTHING;

-- Insert sample radiologists
INSERT INTO radiologists (employee_id, first_name, last_name, email, specializations) VALUES
('RAD001', 'Dr. Rajesh', 'Kumar', 'rajesh.kumar@hospital.com', ARRAY['Neuroradiology', 'Emergency Radiology']),
('RAD002', 'Dr. Priya', 'Sharma', 'priya.sharma@hospital.com', ARRAY['Musculoskeletal', 'Sports Medicine']),
('RAD003', 'Dr. Amit', 'Patel', 'amit.patel@hospital.com', ARRAY['Cardiac Imaging', 'Thoracic Radiology']),
('RAD004', 'Dr. Sunita', 'Reddy', 'sunita.reddy@hospital.com', ARRAY['Breast Imaging', 'Women''s Imaging'])
ON CONFLICT (employee_id) DO NOTHING;

-- Insert sample technologists
INSERT INTO radiology_technologists (employee_id, first_name, last_name, email, certified_modalities) VALUES
('TECH001', 'Ravi', 'Singh', 'ravi.singh@hospital.com', ARRAY['CT', 'XR']),
('TECH002', 'Meena', 'Joshi', 'meena.joshi@hospital.com', ARRAY['MRI']),
('TECH003', 'Suresh', 'Gupta', 'suresh.gupta@hospital.com', ARRAY['US', 'MG']),
('TECH004', 'Kavita', 'Rao', 'kavita.rao@hospital.com', ARRAY['CT', 'FL'])
ON CONFLICT (employee_id) DO NOTHING;

-- Insert sample report templates
INSERT INTO radiology_report_templates (name, modality, body_part, template_content) VALUES
('CT Brain Normal Template', 'CT', 'Brain', 
'CLINICAL INDICATION: 
[Clinical history]

TECHNIQUE:
Non-contrast axial CT images of the brain were obtained.

FINDINGS:
There is no evidence of acute intracranial hemorrhage, mass effect, or midline shift. The ventricular system is normal in size and configuration. The basal cisterns are patent. No focal areas of abnormal attenuation are identified. The gray-white matter differentiation is preserved. No extra-axial fluid collections are seen.

IMPRESSION:
Normal non-contrast CT brain study.'),

('Chest X-ray Normal Template', 'XR', 'Chest',
'CLINICAL INDICATION:
[Clinical history]

TECHNIQUE:
Frontal and lateral chest radiographs.

FINDINGS:
The heart size is normal. The mediastinal and hilar contours are within normal limits. The lungs are clear bilaterally without focal consolidation, pleural effusion, or pneumothorax. The bony thorax is intact.

IMPRESSION:
Normal chest radiograph.'),

('Abdominal US Normal Template', 'US', 'Abdomen',
'CLINICAL INDICATION:
[Clinical history]

TECHNIQUE:
Real-time ultrasound examination of the abdomen.

FINDINGS:
Liver: Normal echogenicity and contour. No focal lesions.
Gallbladder: Normal wall thickness, no stones or sludge.
Pancreas: Visualized portions appear normal.
Kidneys: Both kidneys are normal in size and echogenicity.
Spleen: Normal size and echogenicity.

IMPRESSION:
Normal abdominal ultrasound examination.')
ON CONFLICT DO NOTHING;