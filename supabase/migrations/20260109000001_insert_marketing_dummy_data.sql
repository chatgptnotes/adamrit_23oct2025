-- Insert dummy data for Marketing Dashboard
-- 2 Doctor Visits + 1 Camp per staff member

-- Add 2 Doctor Visits per staff member
INSERT INTO doctor_visits (marketing_user_id, doctor_name, specialty, hospital_clinic_name, contact_number, visit_date, visit_notes, outcome)
SELECT
    mu.id,
    'Dr. Rajesh Kumar',
    'Cardiologist',
    'Max Hospital',
    '9876543210',
    '2026-01-05',
    'Discussed referral partnership',
    'Positive'
FROM marketing_users mu;

INSERT INTO doctor_visits (marketing_user_id, doctor_name, specialty, hospital_clinic_name, contact_number, visit_date, visit_notes, outcome)
SELECT
    mu.id,
    'Dr. Priya Sharma',
    'Orthopedic',
    'Fortis Hospital',
    '9876543211',
    '2026-01-08',
    'Interested in camp collaboration',
    'Positive'
FROM marketing_users mu;

-- Add 1 Camp per staff member
INSERT INTO marketing_camps (marketing_user_id, camp_name, location, address, camp_date, camp_type, expected_footfall, status, camp_notes)
SELECT
    mu.id,
    'Free Health Checkup Camp',
    'Noida Sector 62',
    'Community Hall, Sector 62, Noida',
    '2026-01-10',
    'Health Camp',
    200,
    'Completed',
    'Very successful camp'
FROM marketing_users mu;
