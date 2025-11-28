-- Insert sample data for Lab Management System

-- Insert Test Categories
INSERT INTO test_categories (category_name, category_code, description) VALUES
('Hematology', 'HEM', 'Blood-related tests including CBC, coagulation studies'),
('Clinical Chemistry', 'CHEM', 'Biochemical analysis including metabolic panels'),
('Immunology', 'IMMUNO', 'Immune system and antibody tests'),
('Microbiology', 'MICRO', 'Bacterial, viral, and fungal cultures'),
('Molecular Biology', 'MOLBIO', 'DNA/RNA based testing and genetic analysis'),
('Urinalysis', 'URINE', 'Urine analysis and microscopy'),
('Endocrinology', 'ENDO', 'Hormone and endocrine function tests'),
('Cardiology', 'CARDIO', 'Cardiac markers and heart-related tests'),
('Toxicology', 'TOX', 'Drug testing and toxin detection'),
('Histopathology', 'HISTO', 'Tissue examination and biopsy analysis');

-- Insert Lab Departments
INSERT INTO lab_departments (department_name, department_code, description, head_of_department, location, phone, email) VALUES
('Hematology Department', 'HEM-DEPT', 'Complete blood count and coagulation studies', 'Dr. Sarah Mitchell', 'Building A, Floor 2', '+1-555-0101', 'hematology@hospital.com'),
('Clinical Chemistry', 'CHEM-DEPT', 'Biochemical analysis and metabolic testing', 'Dr. James Rodriguez', 'Building A, Floor 3', '+1-555-0102', 'chemistry@hospital.com'),
('Microbiology Department', 'MICRO-DEPT', 'Culture and sensitivity testing', 'Dr. Emily Chen', 'Building B, Floor 1', '+1-555-0103', 'microbiology@hospital.com'),
('Immunology Department', 'IMMUNO-DEPT', 'Immune system and autoimmune testing', 'Dr. Michael Johnson', 'Building A, Floor 4', '+1-555-0104', 'immunology@hospital.com'),
('Molecular Diagnostics', 'MOLBIO-DEPT', 'Genetic and molecular testing', 'Dr. Lisa Wang', 'Building C, Floor 2', '+1-555-0105', 'molecular@hospital.com');

-- Insert Lab Tests
INSERT INTO lab_tests (test_name, test_code, short_name, category_id, department_id, test_type, sample_type, sample_volume, container_type, processing_time_hours, test_price, reference_ranges, critical_values) VALUES
-- Hematology Tests
('Complete Blood Count with Differential', 'CBC-DIFF', 'CBC with Diff', (SELECT id FROM test_categories WHERE category_code = 'HEM'), (SELECT id FROM lab_departments WHERE department_code = 'HEM-DEPT'), 'QUANTITATIVE', 'Blood', '3-5 mL', 'EDTA Tube', 2, 45.00,
'{"WBC": {"min": 4.0, "max": 11.0, "unit": "x10³/μL"}, "RBC": {"male": {"min": 4.5, "max": 5.9}, "female": {"min": 4.1, "max": 5.1}, "unit": "x10⁶/μL"}, "Hemoglobin": {"male": {"min": 14.0, "max": 17.5}, "female": {"min": 12.0, "max": 15.5}, "unit": "g/dL"}}',
'{"WBC": {"low": 2.0, "high": 30.0}, "Hemoglobin": {"low": 7.0, "high": 20.0}}'),

('Prothrombin Time', 'PT', 'PT/INR', (SELECT id FROM test_categories WHERE category_code = 'HEM'), (SELECT id FROM lab_departments WHERE department_code = 'HEM-DEPT'), 'QUANTITATIVE', 'Blood', '2.7 mL', 'Citrate Tube', 1, 35.00,
'{"PT": {"min": 11.0, "max": 13.0, "unit": "seconds"}, "INR": {"min": 0.8, "max": 1.2, "unit": "ratio"}}',
'{"INR": {"high": 5.0}}'),

-- Chemistry Tests
('Basic Metabolic Panel', 'BMP', 'BMP', (SELECT id FROM test_categories WHERE category_code = 'CHEM'), (SELECT id FROM lab_departments WHERE department_code = 'CHEM-DEPT'), 'QUANTITATIVE', 'Blood', '3-5 mL', 'SST Tube', 4, 65.00,
'{"Glucose": {"min": 70, "max": 100, "unit": "mg/dL"}, "BUN": {"min": 7, "max": 20, "unit": "mg/dL"}, "Creatinine": {"male": {"min": 0.7, "max": 1.3}, "female": {"min": 0.6, "max": 1.1}, "unit": "mg/dL"}}',
'{"Glucose": {"low": 40, "high": 400}, "Creatinine": {"high": 4.0}}'),

('Comprehensive Metabolic Panel', 'CMP', 'CMP', (SELECT id FROM test_categories WHERE category_code = 'CHEM'), (SELECT id FROM lab_departments WHERE department_code = 'CHEM-DEPT'), 'QUANTITATIVE', 'Blood', '3-5 mL', 'SST Tube', 4, 85.00,
'{"Glucose": {"min": 70, "max": 100, "unit": "mg/dL"}, "ALT": {"min": 7, "max": 56, "unit": "U/L"}, "AST": {"min": 10, "max": 40, "unit": "U/L"}}',
'{"Glucose": {"low": 40, "high": 400}, "ALT": {"high": 300}, "AST": {"high": 300}}'),

('Lipid Panel', 'LIPID', 'Lipids', (SELECT id FROM test_categories WHERE category_code = 'CHEM'), (SELECT id FROM lab_departments WHERE department_code = 'CHEM-DEPT'), 'QUANTITATIVE', 'Blood', '3-5 mL', 'SST Tube', 6, 55.00,
'{"Total_Cholesterol": {"min": 0, "max": 200, "unit": "mg/dL"}, "HDL": {"male": {"min": 40, "max": 999}, "female": {"min": 50, "max": 999}, "unit": "mg/dL"}, "LDL": {"min": 0, "max": 100, "unit": "mg/dL"}}',
'{"Total_Cholesterol": {"high": 300}}'),

-- Immunology Tests
('Thyroid Stimulating Hormone', 'TSH', 'TSH', (SELECT id FROM test_categories WHERE category_code = 'ENDO'), (SELECT id FROM lab_departments WHERE department_code = 'IMMUNO-DEPT'), 'QUANTITATIVE', 'Blood', '3-5 mL', 'SST Tube', 8, 75.00,
'{"TSH": {"min": 0.4, "max": 4.0, "unit": "mIU/L"}}',
'{"TSH": {"low": 0.01, "high": 20.0}}'),

-- Microbiology Tests
('Blood Culture', 'BLDCX', 'Blood Culture', (SELECT id FROM test_categories WHERE category_code = 'MICRO'), (SELECT id FROM lab_departments WHERE department_code = 'MICRO-DEPT'), 'QUALITATIVE', 'Blood', '8-10 mL', 'Blood Culture Bottle', 72, 95.00,
'{"Result": "No growth"}',
'{"Result": "Positive growth"}'),

('Urine Culture', 'URICX', 'Urine Culture', (SELECT id FROM test_categories WHERE category_code = 'MICRO'), (SELECT id FROM lab_departments WHERE department_code = 'MICRO-DEPT'), 'QUALITATIVE', 'Urine', '5 mL', 'Sterile Container', 48, 65.00,
'{"Colony_Count": {"max": 10000, "unit": "CFU/mL"}}',
'{"Colony_Count": {"high": 100000}}'),

-- Urinalysis
('Urinalysis Complete', 'UA', 'Urinalysis', (SELECT id FROM test_categories WHERE category_code = 'URINE'), (SELECT id FROM lab_departments WHERE department_code = 'CHEM-DEPT'), 'SEMI_QUANTITATIVE', 'Urine', '10 mL', 'Urine Container', 2, 35.00,
'{"Specific_Gravity": {"min": 1.003, "max": 1.035}, "Protein": "Negative", "Glucose": "Negative"}',
'{"Protein": "3+", "Glucose": "3+"}'),

-- Molecular Biology
('COVID-19 PCR', 'COVID-PCR', 'COVID PCR', (SELECT id FROM test_categories WHERE category_code = 'MOLBIO'), (SELECT id FROM lab_departments WHERE department_code = 'MOLBIO-DEPT'), 'QUALITATIVE', 'Nasopharyngeal Swab', '1 Swab', 'Viral Transport Medium', 24, 150.00,
'{"Result": "Not Detected"}',
'{"Result": "Detected"}');

-- Insert Test Panels
INSERT INTO test_panels (panel_name, panel_code, description, category_id, department_id, panel_price) VALUES
('Annual Health Checkup', 'AHC', 'Comprehensive annual health screening panel', (SELECT id FROM test_categories WHERE category_code = 'CHEM'), (SELECT id FROM lab_departments WHERE department_code = 'CHEM-DEPT'), 250.00),
('Diabetes Monitoring', 'DM-MON', 'Tests for diabetes management and monitoring', (SELECT id FROM test_categories WHERE category_code = 'CHEM'), (SELECT id FROM lab_departments WHERE department_code = 'CHEM-DEPT'), 180.00),
('Cardiac Risk Assessment', 'CARDIAC', 'Cardiovascular risk evaluation panel', (SELECT id FROM test_categories WHERE category_code = 'CARDIO'), (SELECT id FROM lab_departments WHERE department_code = 'CHEM-DEPT'), 220.00),
('Pre-operative Panel', 'PRE-OP', 'Standard pre-surgical testing panel', (SELECT id FROM test_categories WHERE category_code = 'HEM'), (SELECT id FROM lab_departments WHERE department_code = 'HEM-DEPT'), 150.00);

-- Insert Panel Tests mapping
INSERT INTO panel_tests (panel_id, test_id, is_mandatory, display_order) VALUES
-- Annual Health Checkup Panel
((SELECT id FROM test_panels WHERE panel_code = 'AHC'), (SELECT id FROM lab_tests WHERE test_code = 'CBC-DIFF'), true, 1),
((SELECT id FROM test_panels WHERE panel_code = 'AHC'), (SELECT id FROM lab_tests WHERE test_code = 'CMP'), true, 2),
((SELECT id FROM test_panels WHERE panel_code = 'AHC'), (SELECT id FROM lab_tests WHERE test_code = 'LIPID'), true, 3),
((SELECT id FROM test_panels WHERE panel_code = 'AHC'), (SELECT id FROM lab_tests WHERE test_code = 'TSH'), true, 4),
((SELECT id FROM test_panels WHERE panel_code = 'AHC'), (SELECT id FROM lab_tests WHERE test_code = 'UA'), true, 5),

-- Diabetes Monitoring Panel
((SELECT id FROM test_panels WHERE panel_code = 'DM-MON'), (SELECT id FROM lab_tests WHERE test_code = 'BMP'), true, 1),
((SELECT id FROM test_panels WHERE panel_code = 'DM-MON'), (SELECT id FROM lab_tests WHERE test_code = 'UA'), true, 2),

-- Cardiac Risk Assessment Panel
((SELECT id FROM test_panels WHERE panel_code = 'CARDIAC'), (SELECT id FROM lab_tests WHERE test_code = 'LIPID'), true, 1),
((SELECT id FROM test_panels WHERE panel_code = 'CARDIAC'), (SELECT id FROM lab_tests WHERE test_code = 'BMP'), true, 2),

-- Pre-operative Panel
((SELECT id FROM test_panels WHERE panel_code = 'PRE-OP'), (SELECT id FROM lab_tests WHERE test_code = 'CBC-DIFF'), true, 1),
((SELECT id FROM test_panels WHERE panel_code = 'PRE-OP'), (SELECT id FROM lab_tests WHERE test_code = 'PT'), true, 2),
((SELECT id FROM test_panels WHERE panel_code = 'PRE-OP'), (SELECT id FROM lab_tests WHERE test_code = 'BMP'), true, 3);

-- Insert Lab Equipment
INSERT INTO lab_equipment (equipment_name, equipment_code, manufacturer, model, department_id, equipment_status, last_maintenance_date, next_maintenance_date) VALUES
('Hematology Analyzer', 'HEM-001', 'Sysmex', 'XN-1000', (SELECT id FROM lab_departments WHERE department_code = 'HEM-DEPT'), 'Active', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '75 days'),
('Chemistry Analyzer', 'CHEM-001', 'Roche', 'Cobas 6000', (SELECT id FROM lab_departments WHERE department_code = 'CHEM-DEPT'), 'Active', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '70 days'),
('Immunoassay Analyzer', 'IMMUNO-001', 'Abbott', 'ARCHITECT i2000SR', (SELECT id FROM lab_departments WHERE department_code = 'IMMUNO-DEPT'), 'Active', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '80 days'),
('Blood Culture System', 'MICRO-001', 'BD', 'BACTEC FX', (SELECT id FROM lab_departments WHERE department_code = 'MICRO-DEPT'), 'Active', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '85 days'),
('PCR System', 'MOLBIO-001', 'Thermo Fisher', 'QuantStudio 5', (SELECT id FROM lab_departments WHERE department_code = 'MOLBIO-DEPT'), 'Active', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE + INTERVAL '65 days');

-- Insert Sample Lab Orders (for demonstration)
INSERT INTO lab_orders (order_number, patient_name, patient_age, patient_gender, ordering_doctor, order_date, priority, order_type, total_amount, final_amount, order_status) VALUES
('LAB-2025-001', 'John Smith', 45, 'Male', 'Dr. Emily Davis', NOW() - INTERVAL '2 hours', 'Normal', 'Routine', 250.00, 250.00, 'Sample_Collected'),
('LAB-2025-002', 'Sarah Johnson', 32, 'Female', 'Dr. Michael Brown', NOW() - INTERVAL '1 day', 'High', 'Urgent', 180.00, 180.00, 'In_Progress'),
('LAB-2025-003', 'Robert Wilson', 58, 'Male', 'Dr. Jennifer Lee', NOW() - INTERVAL '30 minutes', 'Critical', 'STAT', 150.00, 150.00, 'Sample_Received'),
('LAB-2025-004', 'Maria Garcia', 28, 'Female', 'Dr. David Kim', NOW() - INTERVAL '3 hours', 'Normal', 'Routine', 85.00, 85.00, 'Results_Ready'),
('LAB-2025-005', 'Thomas Anderson', 67, 'Male', 'Dr. Susan Taylor', NOW() - INTERVAL '2 days', 'Normal', 'Routine', 220.00, 220.00, 'Completed');

-- Insert Order Test Items
INSERT INTO order_test_items (order_id, test_id, item_type, item_name, item_code, sample_type, unit_price, total_price, item_status) VALUES
-- Order 1 - Annual Health Checkup
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-001'), (SELECT id FROM lab_tests WHERE test_code = 'CBC-DIFF'), 'Test', 'Complete Blood Count with Differential', 'CBC-DIFF', 'Blood', 45.00, 45.00, 'Sample_Collected'),
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-001'), (SELECT id FROM lab_tests WHERE test_code = 'CMP'), 'Test', 'Comprehensive Metabolic Panel', 'CMP', 'Blood', 85.00, 85.00, 'Sample_Collected'),
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-001'), (SELECT id FROM lab_tests WHERE test_code = 'LIPID'), 'Test', 'Lipid Panel', 'LIPID', 'Blood', 55.00, 55.00, 'Sample_Collected'),
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-001'), (SELECT id FROM lab_tests WHERE test_code = 'TSH'), 'Test', 'Thyroid Stimulating Hormone', 'TSH', 'Blood', 75.00, 75.00, 'Sample_Collected'),

-- Order 2 - Diabetes Monitoring
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-002'), (SELECT id FROM lab_tests WHERE test_code = 'BMP'), 'Test', 'Basic Metabolic Panel', 'BMP', 'Blood', 65.00, 65.00, 'In_Progress'),
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-002'), (SELECT id FROM lab_tests WHERE test_code = 'UA'), 'Test', 'Urinalysis Complete', 'UA', 'Urine', 35.00, 35.00, 'In_Progress'),

-- Order 3 - Emergency
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-003'), (SELECT id FROM lab_tests WHERE test_code = 'CBC-DIFF'), 'Test', 'Complete Blood Count with Differential', 'CBC-DIFF', 'Blood', 45.00, 45.00, 'Sample_Received'),
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-003'), (SELECT id FROM lab_tests WHERE test_code = 'BMP'), 'Test', 'Basic Metabolic Panel', 'BMP', 'Blood', 65.00, 65.00, 'Sample_Received'),

-- Order 4 - Single Test
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-004'), (SELECT id FROM lab_tests WHERE test_code = 'CMP'), 'Test', 'Comprehensive Metabolic Panel', 'CMP', 'Blood', 85.00, 85.00, 'Completed'),

-- Order 5 - Cardiac Panel
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-005'), (SELECT id FROM lab_tests WHERE test_code = 'LIPID'), 'Test', 'Lipid Panel', 'LIPID', 'Blood', 55.00, 55.00, 'Completed'),
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-005'), (SELECT id FROM lab_tests WHERE test_code = 'BMP'), 'Test', 'Basic Metabolic Panel', 'BMP', 'Blood', 65.00, 65.00, 'Completed');

-- Insert Sample Tracking
INSERT INTO lab_samples (sample_barcode, order_id, sample_type, container_type, collection_datetime, received_datetime, sample_quality, processing_status) VALUES
('BAR2025001001', (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-001'), 'Blood', 'EDTA Tube', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 30 minutes', 'Acceptable', 'Processing'),
('BAR2025001002', (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-001'), 'Blood', 'SST Tube', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 30 minutes', 'Acceptable', 'Processing'),
('BAR2025002001', (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-002'), 'Blood', 'SST Tube', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'Acceptable', 'Processing'),
('BAR2025002002', (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-002'), 'Urine', 'Urine Container', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'Acceptable', 'Processing'),
('BAR2025003001', (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-003'), 'Blood', 'EDTA Tube', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '15 minutes', 'Acceptable', 'Received'),
('BAR2025004001', (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-004'), 'Blood', 'SST Tube', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 30 minutes', 'Acceptable', 'Completed'),
('BAR2025005001', (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-005'), 'Blood', 'SST Tube', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 23 hours', 'Acceptable', 'Completed');

-- Insert Sample Test Results
INSERT INTO test_results (order_id, test_id, sample_id, result_value, result_unit, result_type, reference_range, is_abnormal, result_status, performed_by, result_datetime) VALUES
-- Results for Order 4 (Completed)
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-004'), (SELECT id FROM lab_tests WHERE test_code = 'CMP'), (SELECT id FROM lab_samples WHERE sample_barcode = 'BAR2025004001'), '85', 'mg/dL', 'Numeric', '70-100 mg/dL', false, 'Final', 'Tech. Sarah Johnson', NOW() - INTERVAL '1 hour'),

-- Results for Order 5 (Completed)
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-005'), (SELECT id FROM lab_tests WHERE test_code = 'LIPID'), (SELECT id FROM lab_samples WHERE sample_barcode = 'BAR2025005001'), '185', 'mg/dL', 'Numeric', '<200 mg/dL', false, 'Final', 'Tech. Michael Chen', NOW() - INTERVAL '6 hours'),
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-005'), (SELECT id FROM lab_tests WHERE test_code = 'BMP'), (SELECT id FROM lab_samples WHERE sample_barcode = 'BAR2025005001'), '92', 'mg/dL', 'Numeric', '70-100 mg/dL', false, 'Final', 'Tech. Michael Chen', NOW() - INTERVAL '6 hours');

-- Insert Quality Control Records
INSERT INTO quality_controls (qc_type, equipment_id, test_id, qc_material, level, expected_value, expected_unit, actual_value, qc_status, performed_by, performed_datetime) VALUES
('Daily', (SELECT id FROM lab_equipment WHERE equipment_code = 'HEM-001'), (SELECT id FROM lab_tests WHERE test_code = 'CBC-DIFF'), 'QC Material Level 1', 'Normal', 12.5, 'g/dL', 12.3, 'Pass', 'Tech. Sarah Johnson', NOW() - INTERVAL '2 hours'),
('Daily', (SELECT id FROM lab_equipment WHERE equipment_code = 'CHEM-001'), (SELECT id FROM lab_tests WHERE test_code = 'BMP'), 'QC Material Level 1', 'Normal', 90.0, 'mg/dL', 89.5, 'Pass', 'Tech. Michael Chen', NOW() - INTERVAL '3 hours'),
('Daily', (SELECT id FROM lab_equipment WHERE equipment_code = 'CHEM-001'), (SELECT id FROM lab_tests WHERE test_code = 'LIPID'), 'QC Material Level 2', 'High', 250.0, 'mg/dL', 248.5, 'Pass', 'Tech. Michael Chen', NOW() - INTERVAL '3 hours');

-- Insert External Labs
INSERT INTO external_labs (lab_name, lab_code, contact_person, phone, email, speciality_areas, turnaround_time_hours) VALUES
('Reference Lab Services', 'RLS-001', 'Dr. Patricia Williams', '+1-555-0201', 'contact@referencelab.com', ARRAY['Molecular Diagnostics', 'Genetic Testing', 'Specialized Immunology'], 48),
('Specialty Diagnostics Inc', 'SDI-001', 'Dr. Robert Taylor', '+1-555-0202', 'info@specialtydiag.com', ARRAY['Endocrinology', 'Oncology Markers', 'Therapeutic Drug Monitoring'], 72),
('Advanced Pathology Lab', 'APL-001', 'Dr. Linda Martinez', '+1-555-0203', 'service@advancedpath.com', ARRAY['Histopathology', 'Cytogenetics', 'Flow Cytometry'], 96);

-- Insert Lab Reports
INSERT INTO lab_reports (order_id, report_number, report_type, report_status, prepared_by, approved_by, prepared_datetime, approved_datetime) VALUES
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-004'), 'RPT-2025-004', 'Standard', 'Final', 'Tech. Sarah Johnson', 'Dr. Emily Chen', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes'),
((SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-005'), 'RPT-2025-005', 'Standard', 'Final', 'Tech. Michael Chen', 'Dr. James Rodriguez', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours 30 minutes');

-- Insert Lab Worklists
INSERT INTO lab_worklists (worklist_name, department_id, worklist_type, worklist_date, assigned_technician, worklist_status, total_samples, completed_samples) VALUES
('Morning Hematology', (SELECT id FROM lab_departments WHERE department_code = 'HEM-DEPT'), 'Daily', CURRENT_DATE, 'Tech. Sarah Johnson', 'In_Progress', 8, 5),
('Chemistry Routine', (SELECT id FROM lab_departments WHERE department_code = 'CHEM-DEPT'), 'Daily', CURRENT_DATE, 'Tech. Michael Chen', 'In_Progress', 12, 8),
('Microbiology Cultures', (SELECT id FROM lab_departments WHERE department_code = 'MICRO-DEPT'), 'Daily', CURRENT_DATE, 'Tech. Lisa Wong', 'Created', 6, 0);

-- Insert Worklist Items
INSERT INTO worklist_items (worklist_id, order_id, sample_id, test_name, sample_type, priority, item_status, sequence_number) VALUES
((SELECT id FROM lab_worklists WHERE worklist_name = 'Morning Hematology'), (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-001'), (SELECT id FROM lab_samples WHERE sample_barcode = 'BAR2025001001'), 'Complete Blood Count with Differential', 'Blood', 'Normal', 'In_Progress', 1),
((SELECT id FROM lab_worklists WHERE worklist_name = 'Morning Hematology'), (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-003'), (SELECT id FROM lab_samples WHERE sample_barcode = 'BAR2025003001'), 'Complete Blood Count with Differential', 'Blood', 'Critical', 'Pending', 2),

((SELECT id FROM lab_worklists WHERE worklist_name = 'Chemistry Routine'), (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-001'), (SELECT id FROM lab_samples WHERE sample_barcode = 'BAR2025001002'), 'Comprehensive Metabolic Panel', 'Blood', 'Normal', 'In_Progress', 1),
((SELECT id FROM lab_worklists WHERE worklist_name = 'Chemistry Routine'), (SELECT id FROM lab_orders WHERE order_number = 'LAB-2025-002'), (SELECT id FROM lab_samples WHERE sample_barcode = 'BAR2025002001'), 'Basic Metabolic Panel', 'Blood', 'High', 'Pending', 2);

COMMIT;