
-- Add separate columns for labs and radiology
ALTER TABLE patients 
ADD COLUMN labs text,
ADD COLUMN radiology text;

-- Copy existing labs_radiology data to the new labs column (as a starting point)
UPDATE patients 
SET labs = labs_radiology 
WHERE labs_radiology IS NOT NULL AND labs_radiology != '';

-- The radiology column will start empty and users can fill it in
UPDATE patients 
SET radiology = ''
WHERE radiology IS NULL;
