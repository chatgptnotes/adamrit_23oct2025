-- Add selected_complications column to ai_clinical_recommendations table
-- This column will store the complications that were selected by the user from AI recommendations

ALTER TABLE public.ai_clinical_recommendations 
ADD COLUMN IF NOT EXISTS selected_complications JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.ai_clinical_recommendations.selected_complications IS 'JSON array of complications selected by user from AI recommendations to be used as additional diagnoses';
