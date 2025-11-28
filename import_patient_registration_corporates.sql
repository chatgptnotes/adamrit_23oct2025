-- Import All Corporate Data from Patient Registration Dropdown
-- This script imports all corporate/insurance companies from the Patient Registration form
-- Run this in Supabase SQL Editor to populate the corporate table

-- First, ensure RLS is disabled (run fix_corporate_rls_immediate.sql first if needed)
-- ALTER TABLE corporate DISABLE ROW LEVEL SECURITY;

-- Clear existing data if needed (optional - uncomment if you want to start fresh)
-- DELETE FROM corporate;

-- Insert all corporate data from Patient Registration dropdown
INSERT INTO corporate (name, description) VALUES

-- Basic Categories
('Private', 'Private healthcare payment'),
('ESIC', 'Employee State Insurance Corporation'),
('CGHS', 'Central Government Health Scheme'),
('ECHS', 'Ex-Serviceman Contributory Health Scheme'),
('Insurance', 'General insurance category'),

-- TPA (Third Party Administrator) Companies
('MD India Health Insurance Pvt. Ltd.', 'Third Party Administrator for health insurance services'),
('Family Health Plan Insurance (TPA) Ltd.', 'Family health insurance TPA services'),
('Raksha Health Insurance TPA Ltd.', 'Health insurance third party administrator'),
('Health India Insurance TPA Pvt. Ltd.', 'Comprehensive health insurance TPA services'),
('Paramount Health Services and Insurance TPA Pvt. Ltd.', 'Premium health insurance and TPA services'),
('United Health Care Parekh Insurance TPA Pvt. Ltd.', 'Healthcare insurance third party administration'),
('Vidal Health TPA Pvt. Ltd.', 'Digital health insurance TPA solutions'),
('Vision Emedi TPA Pvt. Ltd.', 'Electronic medical insurance TPA services'),
('Vision Health TPA Ltd.', 'Vision and health insurance TPA services'),
('Unique Healthcare & Medical Services Pvt. Ltd. (Generis TPA)', 'Specialized healthcare and medical TPA services'),
('NVGT Care Services Pvt Ltd', 'Comprehensive care services and TPA'),
('VOLO HEALTH INSURANCE TPA PVT. LTD.', 'Modern health insurance TPA solutions'),
('AKNA HEALTH INSURANCE TPA', 'Dedicated health insurance third party administrator'),
('Generis TPA', 'General health insurance TPA services'),

-- Government Healthcare Schemes
('Mahatma Jyotirao Phule jan Arogya Yojana (MJPJAY)', 'Maharashtra state health insurance scheme'),
('Ayushman Bharat - Pradhan Mantri Jan Arogya Yojna (PM-JAY)', 'National health protection scheme'),
('Rashtriya Bal Swasthya Karyakram (RBSK)', 'National child health program'),
('Central Government Health Scheme (CGHS)', 'Central government employees health scheme'),
('Ex Serviceman Contributory Health Scheme (ECHS)', 'Defense personnel and families health scheme'),
('Maharashtra Police Kutumb Arogya Yojana (MPKAY)', 'Maharashtra police family health scheme'),
('MIKSSKAY - Maharashtra Karagruh Va Sudhar Sevabal Kutumb Arogya Yojana', 'Maharashtra correctional services family health scheme'),
('Maharashtra Dharmadaya Karmachari Kutumbe Seashya Yojana (MDKKSY)', 'Maharashtra charitable workers family health scheme'),

-- Corporate/Government Organizations
('Coal India Limited (CIL)', 'Public sector coal mining company'),
('Central Railways (C.Rly)', 'Indian Railways central zone'),
('South Eastern Central Railway (SECR)', 'Railway zone covering central India'),
('West Central Railway', 'Indian Railways west central zone'),
('Western Coalfield Limited (WCL)', 'Coal mining subsidiary of Coal India'),
('MP State Government Employees-OST empanelled hospital', 'Madhya Pradesh government employees healthcare'),
('MP Police (Swasthya Suraksha Nyas)', 'Madhya Pradesh police health security trust'),
('Ordnance Factories (Ambazari, Chanda, Jawaher Nagar, Itarsi)', 'Defense manufacturing facilities healthcare'),
('Maharashtra Metro Rail Corporation', 'Mumbai metro rail corporation'),
('ITD Cementation Ltd (Nagpur Metro Work)', 'Infrastructure company - Nagpur metro project'),
('AFCON Ltd (Nagpur Metro Work)', 'Construction company - Nagpur metro project'),
('Gun Factory', 'Defense ordnance manufacturing facility'),
('RBI (Reserve Bank of India)', 'Central banking institution of India'),
('MECL (Mineral Exploration Corporation Ltd)', 'Government mineral exploration company'),
('Maharashtra State Electricity Board (MSEB)', 'State electricity utility board'),

-- Private Insurance Companies
('ICICI Lombard General Insurance Pvt. Ltd.', 'Leading private general insurance company'),
('Reliance Health Insurance Pvt. Ltd.', 'Reliance group health insurance division'),
('Reliance General Insurance Co. Ltd.', 'Reliance group general insurance services'),
('United Healthcare India Pvt. Ltd.', 'Global healthcare insurance provider'),
('MaxBupa Health Insurance Co. Ltd.', 'Joint venture health insurance company'),
('TATA AIG General Insurance Co. Ltd.', 'TATA group general insurance services'),
('Star Heath An Allied Insurance Company', 'Specialized health insurance provider'),
('HDFC ERGO Insurance Co Ltd.', 'HDFC group general insurance services'),
('Royal Sundaram Alliance Insurance Co. Ltd', 'Comprehensive general insurance solutions'),
('CHOLA MS HEALTH INSURANCE', 'Murugappa group health insurance services'),
('Acko Insurance India', 'Digital-first general insurance company'),
('Go Digit Health Insurance', 'Technology-driven health insurance solutions'),
('Universal Sompo general insurance', 'Japanese-Indian joint venture insurance'),
('Bajaj Allianz General Insurance', 'Leading private general insurance company')

-- Handle conflicts (ignore duplicates)
ON CONFLICT (name) DO NOTHING;

-- Verification queries
SELECT 'Import completed successfully!' as status;

-- Count total records
SELECT COUNT(*) as total_corporate_records FROM corporate;

-- Show all corporate records by category
SELECT
    name,
    description,
    CASE
        WHEN name IN ('Private', 'Insurance') THEN 'Basic Categories'
        WHEN name IN ('ESIC', 'CGHS', 'ECHS') THEN 'Government Schemes'
        WHEN name LIKE '%TPA%' OR name LIKE '%Health Insurance%' THEN 'TPA Companies'
        WHEN name LIKE '%(MJPJAY)%' OR name LIKE '%(PM-JAY)%' OR name LIKE '%(RBSK)%' OR name LIKE '%(CGHS)%' OR name LIKE '%(ECHS)%' OR name LIKE '%(MPKAY)%' OR name LIKE '%MIKSSKAY%' OR name LIKE '%(MDKKSY)%' THEN 'Government Healthcare Schemes'
        WHEN name LIKE '%Railway%' OR name LIKE '%Coal%' OR name LIKE '%Factory%' OR name LIKE '%RBI%' OR name LIKE '%MSEB%' OR name LIKE '%Metro%' THEN 'Government Organizations'
        WHEN name LIKE '%Insurance%' AND name NOT LIKE '%TPA%' THEN 'Private Insurance'
        ELSE 'Other'
    END as category,
    created_at
FROM corporate
ORDER BY
    CASE
        WHEN name IN ('Private', 'Insurance') THEN 1
        WHEN name IN ('ESIC', 'CGHS', 'ECHS') THEN 2
        WHEN name LIKE '%TPA%' OR name LIKE '%Health Insurance%' THEN 3
        WHEN name LIKE '%(MJPJAY)%' OR name LIKE '%(PM-JAY)%' OR name LIKE '%(RBSK)%' OR name LIKE '%(CGHS)%' OR name LIKE '%(ECHS)%' OR name LIKE '%(MPKAY)%' OR name LIKE '%MIKSSKAY%' OR name LIKE '%(MDKKSY)%' THEN 4
        WHEN name LIKE '%Railway%' OR name LIKE '%Coal%' OR name LIKE '%Factory%' OR name LIKE '%RBI%' OR name LIKE '%MSEB%' OR name LIKE '%Metro%' THEN 5
        WHEN name LIKE '%Insurance%' AND name NOT LIKE '%TPA%' THEN 6
        ELSE 7
    END,
    name;

-- Show summary by category
SELECT
    CASE
        WHEN name IN ('Private', 'Insurance') THEN 'Basic Categories'
        WHEN name IN ('ESIC', 'CGHS', 'ECHS') THEN 'Government Schemes'
        WHEN name LIKE '%TPA%' OR name LIKE '%Health Insurance%' THEN 'TPA Companies'
        WHEN name LIKE '%(MJPJAY)%' OR name LIKE '%(PM-JAY)%' OR name LIKE '%(RBSK)%' OR name LIKE '%(CGHS)%' OR name LIKE '%(ECHS)%' OR name LIKE '%(MPKAY)%' OR name LIKE '%MIKSSKAY%' OR name LIKE '%(MDKKSY)%' THEN 'Government Healthcare Schemes'
        WHEN name LIKE '%Railway%' OR name LIKE '%Coal%' OR name LIKE '%Factory%' OR name LIKE '%RBI%' OR name LIKE '%MSEB%' OR name LIKE '%Metro%' THEN 'Government Organizations'
        WHEN name LIKE '%Insurance%' AND name NOT LIKE '%TPA%' THEN 'Private Insurance'
        ELSE 'Other'
    END as category,
    COUNT(*) as count
FROM corporate
GROUP BY
    CASE
        WHEN name IN ('Private', 'Insurance') THEN 'Basic Categories'
        WHEN name IN ('ESIC', 'CGHS', 'ECHS') THEN 'Government Schemes'
        WHEN name LIKE '%TPA%' OR name LIKE '%Health Insurance%' THEN 'TPA Companies'
        WHEN name LIKE '%(MJPJAY)%' OR name LIKE '%(PM-JAY)%' OR name LIKE '%(RBSK)%' OR name LIKE '%(CGHS)%' OR name LIKE '%(ECHS)%' OR name LIKE '%(MPKAY)%' OR name LIKE '%MIKSSKAY%' OR name LIKE '%(MDKKSY)%' THEN 'Government Healthcare Schemes'
        WHEN name LIKE '%Railway%' OR name LIKE '%Coal%' OR name LIKE '%Factory%' OR name LIKE '%RBI%' OR name LIKE '%MSEB%' OR name LIKE '%Metro%' THEN 'Government Organizations'
        WHEN name LIKE '%Insurance%' AND name NOT LIKE '%TPA%' THEN 'Private Insurance'
        ELSE 'Other'
    END
ORDER BY count DESC;

-- Final success message
SELECT
    'All Patient Registration corporate dropdown options have been imported!' as message,
    COUNT(*) as total_companies_added
FROM corporate;