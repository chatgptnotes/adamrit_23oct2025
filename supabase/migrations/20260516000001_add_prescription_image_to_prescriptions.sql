-- Link a prescription to the source photo it was extracted from.
-- The camera FAB (CameraUpload.tsx) uploads the prescription photo to the
-- "uploads" storage bucket; these columns store its public URL + MIME type so
-- the Pharmacy Prescription Queue can show the photo beside the extracted items.
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS prescription_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS prescription_image_type TEXT;

COMMENT ON COLUMN public.prescriptions.prescription_image_url IS
  'Public URL of the source photo/PDF the prescription was extracted from (Supabase Storage bucket "uploads").';
COMMENT ON COLUMN public.prescriptions.prescription_image_type IS
  'MIME type of the source file, e.g. image/jpeg or application/pdf.';
