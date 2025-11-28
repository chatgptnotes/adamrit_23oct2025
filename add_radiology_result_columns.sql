-- ==========================================
-- ADD RADIOLOGY RESULT FORM COLUMNS
-- Update visit_radiology table to store result form data
-- ==========================================

-- Current visit_radiology table has:
-- id, visit_id, radiology_id, status, ordered_date, scheduled_date, 
-- completed_date, findings, impression, notes, created_at, updated_at

-- Add missing columns for result form
ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS report_text TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS no_of_slices INTEGER;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS selected_doctor TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS image_impression TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS advice TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS uploaded_file_path TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS uploaded_file_name TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS uploaded_file_size INTEGER;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS result_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS template_used TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS result_status TEXT DEFAULT 'pending' CHECK (result_status IN ('pending', 'draft', 'completed', 'signed'));

-- Add comments for documentation
COMMENT ON COLUMN public.visit_radiology.report_text IS 'Main radiology report text from form';
COMMENT ON COLUMN public.visit_radiology.no_of_slices IS 'Number of image slices';
COMMENT ON COLUMN public.visit_radiology.selected_doctor IS 'Doctor who performed/reviewed the study';
COMMENT ON COLUMN public.visit_radiology.image_impression IS 'Radiologist image impression';
COMMENT ON COLUMN public.visit_radiology.advice IS 'Advice/recommendations from radiologist';
COMMENT ON COLUMN public.visit_radiology.uploaded_file_path IS 'Path to uploaded file/record';
COMMENT ON COLUMN public.visit_radiology.uploaded_file_name IS 'Original name of uploaded file';
COMMENT ON COLUMN public.visit_radiology.uploaded_file_size IS 'Size of uploaded file in bytes';
COMMENT ON COLUMN public.visit_radiology.additional_notes IS 'Additional notes or comments';
COMMENT ON COLUMN public.visit_radiology.result_date IS 'When the result was entered/completed';
COMMENT ON COLUMN public.visit_radiology.template_used IS 'Template used for quick text insertion';
COMMENT ON COLUMN public.visit_radiology.result_status IS 'Status of result entry (pending, draft, completed, signed)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visit_radiology_result_status ON public.visit_radiology(result_status);
CREATE INDEX IF NOT EXISTS idx_visit_radiology_result_date ON public.visit_radiology(result_date);
CREATE INDEX IF NOT EXISTS idx_visit_radiology_selected_doctor ON public.visit_radiology(selected_doctor);

-- Update existing records to set default result_status
UPDATE public.visit_radiology 
SET result_status = 'pending' 
WHERE result_status IS NULL;

COMMENT ON TABLE public.visit_radiology IS 'Junction table for tracking radiology studies per visit with complete result data'; 