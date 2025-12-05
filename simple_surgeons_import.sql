-- Simple surgeon import for Ayushman hospital
-- Execute this in Supabase SQL Editor after creating the table

-- Import extracted surgeon data from doctors.sql
INSERT INTO public.ayushman_surgeons (name, specialty, department, tpa_rate, non_nabh_rate, nabh_rate, private_rate) VALUES
('First Surgeon', 'General Surgery', 'Department 15', 800.0, 1000.0, 1200.0, 1500.0),
('B K Murali', 'Orthopedics', 'Department 12', 800.0, 1000.0, 1200.0, 1500.0),
('Satish Das', 'General Surgery', 'Department 3', 800.0, 1000.0, 1200.0, 1500.0),
('Monali Sahu', 'General Surgery', 'Department 659', 800.0, 1000.0, 1200.0, 1500.0),
('Dr. Amol Deshmukh', 'Radiology', 'Department 19', 800.0, 1000.0, 1200.0, 1500.0),
('Naved Sheikh', 'Orthopedics', 'Department 22', 800.0, 1000.0, 1200.0, 1500.0),
('Sandip Deshmukh', 'Urology', 'Department 20', 800.0, 1000.0, 1200.0, 1500.0),
('Prashant Parate', 'Neurosurgery', 'Department 558', 800.0, 1000.0, 1200.0, 1500.0),
('Dr. Amit Agrawal', 'Neurosurgery', 'Department 6', 800.0, 1000.0, 1200.0, 1500.0),
('Vinit Niranjane', 'General Surgery', 'Department 6', 800.0, 1000.0, 1200.0, 1500.0),
('Nakade CVTS', 'Cardiothoracic Surgery', 'Department 3', 800.0, 1000.0, 1200.0, 1500.0);

-- Verify the import
SELECT COUNT(*) as total_surgeons FROM public.ayushman_surgeons;
SELECT name, specialty, department FROM public.ayushman_surgeons ORDER BY name;