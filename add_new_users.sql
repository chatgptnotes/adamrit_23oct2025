-- Add new users to the User table
-- Insert additional test users for both hospitals

INSERT INTO public."User" (email, password, role, hospital_type) VALUES 
-- Hope Hospital Staff
('doctor.hope@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'doctor', 'hope'),
('nurse.hope@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'nurse', 'hope'),
('receptionist.hope@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'user', 'hope'),
('pharmacy.hope@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'pharmacist', 'hope'),
('lab.hope@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'lab_technician', 'hope'),

-- Ayushman Hospital Staff  
('doctor.ayushman@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'doctor', 'ayushman'),
('nurse.ayushman@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'nurse', 'ayushman'),
('receptionist.ayushman@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'user', 'ayushman'),
('pharmacy.ayushman@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'pharmacist', 'ayushman'),
('lab.ayushman@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'lab_technician', 'ayushman'),

-- Additional Administrative Users
('superadmin@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'admin', NULL),
('manager.hope@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'manager', 'hope'),
('manager.ayushman@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'manager', 'ayushman'),

-- Test Users
('test.user@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'user', 'hope'),
('demo.user@gmail.com', '$2a$10$TcmyN8goVfUP99aXOdekML', 'user', 'ayushman')

ON CONFLICT (email) DO NOTHING;

-- Verify the inserted data
SELECT 
    email,
    role,
    hospital_type,
    created_at
FROM public."User" 
ORDER BY hospital_type, role, email;