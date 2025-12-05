-- Insert Hope Surgeons data into hope_surgeons table
INSERT INTO hope_surgeons (name, specialty, department, contact_info) VALUES
('Dr. AFZAL Sheikh', 'MD Medicine', NULL, NULL),
('Dr. AFZAL Sheikh', 'MD Medicine', NULL, NULL),
('Dr. Amod Chaurasia', 'Maxillofacial Surgery', 'Oral & Maxillofacial', 'MDS Oral Oncologist & Maxillofacial Surgeon'),
('Dr. Bhat', 'Ophthalmic Surgery', 'Ophthalmology', NULL),
('Dr. B. K. Murali', 'Spine and Joint Replacement', NULL, 'Managing Director - M.S. (Ortho)')
ON CONFLICT (name, specialty) DO NOTHING;