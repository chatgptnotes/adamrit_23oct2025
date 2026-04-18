-- Add Partik as user for Hope Hospital (two accounts, same password)

-- Radiology account
INSERT INTO public."User" (email, password, role, hospital_type) VALUES
('partik.radiology@hope.com', E'$2b$10$rB6ljKS/IyCOmcYFm3HBDuQkN2fmDIoLMhxPSxzlnmz8Hik2O0lq6', 'radiology', 'hope');

-- Marketing account
INSERT INTO public."User" (email, password, role, hospital_type) VALUES
('partik.marketing@hope.com', E'$2b$10$rB6ljKS/IyCOmcYFm3HBDuQkN2fmDIoLMhxPSxzlnmz8Hik2O0lq6', 'marketing_manager', 'hope');

-- Verify
SELECT email, role, hospital_type FROM public."User" WHERE email LIKE 'partik%' ORDER BY email;
