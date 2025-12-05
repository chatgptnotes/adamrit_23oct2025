-- Insert all corporate options into the corporate table
-- This script populates the corporate table with all available options from the patient registration form

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE corporate;

-- Basic Corporate Options
INSERT INTO corporate (name, description) VALUES
('Private', 'Private patients without insurance'),
('ESIC', 'Employees State Insurance Corporation'),
('CGHS', 'Central Government Health Scheme'),
('ECHS', 'Ex-servicemen Contributory Health Scheme'),
('Insurance', 'General Insurance');

-- TPA Companies
INSERT INTO corporate (name, description) VALUES
('MD India Health Insurance Pvt. Ltd.', 'Third Party Administrator for health insurance'),
('Family Health Plan Insurance (TPA) Ltd.', 'Third Party Administrator for health insurance'),
('Raksha Health Insurance TPA Ltd.', 'Third Party Administrator for health insurance'),
('Health India Insurance TPA Pvt. Ltd.', 'Third Party Administrator for health insurance'),
('Paramount Health Services and Insurance TPA Pvt. Ltd.', 'Third Party Administrator for health insurance'),
('United Health Care Parekh Insurance TPA Pvt. Ltd.', 'Third Party Administrator for health insurance'),
('Vidal Health TPA Pvt. Ltd.', 'Third Party Administrator for health insurance'),
('Vision Emedi TPA Pvt. Ltd.', 'Third Party Administrator for health insurance'),
('Vision Health TPA Ltd.', 'Third Party Administrator for health insurance'),
('Unique Healthcare & Medical Services Pvt. Ltd. (Generis TPA)', 'Third Party Administrator for health insurance'),
('NVGT Care Services Pvt Ltd', 'Third Party Administrator for health insurance'),
('VOLO HEALTH INSURANCE TPA PVT. LTD.', 'Third Party Administrator for health insurance'),
('AKNA HEALTH INSURANCE TPA', 'Third Party Administrator for health insurance'),
('Generis TPA', 'Third Party Administrator for health insurance');

-- Government Healthcare Schemes
INSERT INTO corporate (name, description) VALUES
('Mahatma Jyotirao Phule jan Arogya Yojana (MJPJAY)', 'Maharashtra state government health scheme'),
('Ayushman Bharat - Pradhan Mantri Jan Arogya Yojna (PM-JAY)', 'Central government health insurance scheme'),
('Rashtriya Bal Swasthya Karyakram (RBSK)', 'National child health program'),
('Central Government Health Scheme (CGHS)', 'Health scheme for central government employees'),
('Ex Serviceman Contributory Health Scheme (ECHS)', 'Health scheme for ex-servicemen'),
('Maharashtra Police Kutumb Arogya Yojana (MPKAY)', 'Health scheme for Maharashtra police families'),
('MIKSSKAY - Maharashtra Karagruh Va Sudhar Sevabal Kutumb Arogya Yojana', 'Maharashtra prison staff health scheme'),
('Maharashtra Dharmadaya Karmachari Kutumbe Seashya Yojana (MDKKSY)', 'Maharashtra religious endowment employees health scheme');

-- Corporate/Government Organizations
INSERT INTO corporate (name, description) VALUES
('Coal India Limited (CIL)', 'Central public sector undertaking'),
('Central Railways (C.Rly)', 'Indian Railways - Central Zone'),
('South Eastern Central Railway (SECR)', 'Indian Railways - South Eastern Central Zone'),
('Western Coalfield Limited (WCL)', 'Coal India subsidiary'),
('MP State Government Employees-OST empanelled hospital', 'Madhya Pradesh government employees health scheme'),
('MP Police (Swasthya Suraksha Nyas)', 'Madhya Pradesh police health scheme'),
('Ordnance Factories (Ambazari, Chanda, Jawaher Nagar, Itarsi)', 'Defence ordnance factories'),
('Maharashtra Metro Rail Corporation', 'State metro rail corporation'),
('ITD Cementation Ltd (Nagpur Metro Work)', 'Infrastructure company - Nagpur Metro project'),
('AFCON Ltd (Nagpur Metro Work)', 'Infrastructure company - Nagpur Metro project'),
('Gun Factory', 'Defence ordnance factory'),
('RBI (Reserve Bank of India)', 'Central banking institution'),
('MECL (Mineral Exploration Corporation Ltd)', 'Public sector mineral exploration company'),
('Maharashtra State Electricity Board (MSEB)', 'State electricity board');

-- Private Insurance Companies
INSERT INTO corporate (name, description) VALUES
('ICICI Lombard General Insurance Pvt. Ltd.', 'Private general insurance company'),
('Reliance Health Insurance Pvt. Ltd.', 'Private health insurance company'),
('Reliance General Insurance Co. Ltd.', 'Private general insurance company'),
('United Healthcare India Pvt. Ltd.', 'Private health insurance company'),
('MaxBupa Health Insurance Co. Ltd.', 'Private health insurance company'),
('TATA AIG General Insurance Co. Ltd.', 'Private general insurance company'),
('Star Heath An Allied Insurance Company', 'Private health insurance company'),
('HDFC ERGO Insurance Co Ltd.', 'Private general insurance company'),
('Royal Sundaram Alliance Insurance Co. Ltd', 'Private general insurance company'),
('CHOLA MS HEALTH INSURANCE', 'Private health insurance company'),
('Acko Insurance India', 'Digital insurance company'),
('Go Digit Health Insurance', 'Digital health insurance company'),
('Universal Sompo general insurance', 'Private general insurance company'),
('Bajaj Allianz General Insurance', 'Private general insurance company');

-- Verify the data was inserted
SELECT COUNT(*) as total_corporates FROM corporate;
SELECT name, description FROM corporate ORDER BY name;