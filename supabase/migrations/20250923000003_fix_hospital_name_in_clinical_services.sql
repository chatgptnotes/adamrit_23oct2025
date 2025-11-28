-- Fix hospital names in clinical services to use lowercase "ayushman" and "hope"
-- Update existing records and split between the two hospitals

-- Update existing records from "ESIC Ayushman Hope" to proper lowercase hospital names
-- Split the 8 services between ayushman (first 4) and hope (last 4)

-- Update first 4 services to "ayushman"
UPDATE public.clinical_services
SET hospital_name = 'ayushman'
WHERE hospital_name = 'ESIC Ayushman Hope'
AND id IN (
    SELECT id FROM public.clinical_services
    WHERE hospital_name = 'ESIC Ayushman Hope'
    ORDER BY created_at
    LIMIT 4
);

-- Update remaining services to "hope"
UPDATE public.clinical_services
SET hospital_name = 'hope'
WHERE hospital_name = 'ESIC Ayushman Hope';