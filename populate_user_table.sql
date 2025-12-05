-- Populate User table with test data for both hospitals
-- Add hospital_type column if not exists
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS hospital_type text DEFAULT 'hope';

-- Insert test users for Hope Hospital
INSERT INTO "User" (email, password, role, hospital_type) VALUES
-- Hope Hospital Users
('admin@hopehospital.com', 'admin123', 'admin', 'hope'),
('doctor@hopehospital.com', 'doctor123', 'doctor', 'hope'), 
('nurse@hopehospital.com', 'nurse123', 'nurse', 'hope'),
('user@hopehospital.com', 'user123', 'user', 'hope'),
('hope@hospital.com', 'hope123', 'user', 'hope'),

-- Ayushman Hospital Users  
('admin@ayushmanhospital.com', 'admin123', 'admin', 'ayushman'),
('doctor@ayushmanhospital.com', 'doctor123', 'doctor', 'ayushman'),
('nurse@ayushmanhospital.com', 'nurse123', 'nurse', 'ayushman'), 
('user@ayushmanhospital.com', 'user123', 'user', 'ayushman'),
('ayushman@hospital.com', 'ayushman123', 'user', 'ayushman'),

-- Additional test users
('rajesh@hopehospital.com', 'rajesh123', 'doctor', 'hope'),
('sunita@ayushmanhospital.com', 'sunita123', 'nurse', 'ayushman'),
('admin@test.com', 'test123', 'admin', 'hope'),
('demo@hope.com', 'demo123', 'user', 'hope'),
('demo@ayushman.com', 'demo123', 'user', 'ayushman')

ON CONFLICT (email) DO NOTHING;

-- Verify the data
SELECT 
  email,
  role,
  hospital_type,
  created_at
FROM "User" 
ORDER BY hospital_type, role, email;

-- Count by hospital and role
SELECT 
  hospital_type,
  role,
  COUNT(*) as user_count
FROM "User"
GROUP BY hospital_type, role
ORDER BY hospital_type, role;