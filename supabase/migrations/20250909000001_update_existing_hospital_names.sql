-- Update existing patients to assign them to a default hospital
-- You can customize this based on your needs

-- If you want to assign all existing patients to Hope Hospital:
UPDATE patients 
SET hospital_name = 'Hope' 
WHERE hospital_name IS NULL;

-- Update any lowercase values to proper case
UPDATE patients 
SET hospital_name = 'Hope' 
WHERE hospital_name = 'hope';

UPDATE patients 
SET hospital_name = 'Ayushman' 
WHERE hospital_name = 'ayushman';

-- Alternatively, if you want to assign based on some criteria:
-- UPDATE patients 
-- SET hospital_name = CASE 
--   WHEN corporate = 'hope' THEN 'Hope'
--   WHEN corporate = 'ayushman' THEN 'Ayushman'
--   ELSE 'Hope'
-- END
-- WHERE hospital_name IS NULL;

-- Verify the update
-- SELECT hospital_name, COUNT(*) as patient_count 
-- FROM patients 
-- GROUP BY hospital_name;