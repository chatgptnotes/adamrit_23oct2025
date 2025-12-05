-- ============================================================================
-- Add NMI Tracking columns to bill_preparation table
-- ============================================================================

-- Add NMI Tracking columns
ALTER TABLE public.bill_preparation
ADD COLUMN IF NOT EXISTS nmi_date DATE,
ADD COLUMN IF NOT EXISTS nmi TEXT,
ADD COLUMN IF NOT EXISTS nmi_answered TEXT;

-- Add comments for NMI Tracking columns
COMMENT ON COLUMN public.bill_preparation.nmi_date IS 'Date for NMI tracking';
COMMENT ON COLUMN public.bill_preparation.nmi IS 'NMI identifier or details';
COMMENT ON COLUMN public.bill_preparation.nmi_answered IS 'Status of NMI answer (Yes/No/Pending)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bill_preparation_nmi_date ON public.bill_preparation(nmi_date);
CREATE INDEX IF NOT EXISTS idx_bill_preparation_nmi_answered ON public.bill_preparation(nmi_answered);

-- ============================================================================
-- IMPORTANT: First find valid visit_ids from your database
-- ============================================================================

-- Query to find existing visit_ids that you can use
SELECT v.visit_id, p.name as patient_name, v.visit_date, v.visit_type
FROM public.visits v
JOIN public.patients p ON v.patient_id = p.id
ORDER BY v.visit_date DESC
LIMIT 10;

-- Check if a visit already has bill_preparation data
SELECT v.visit_id, p.name as patient_name, v.visit_date, v.visit_type,
       CASE WHEN bp.visit_id IS NOT NULL THEN 'Has billing data' ELSE 'No billing data' END as billing_status
FROM public.visits v
JOIN public.patients p ON v.patient_id = p.id
LEFT JOIN public.bill_preparation bp ON v.visit_id = bp.visit_id
ORDER BY v.visit_date DESC
LIMIT 20;

-- ============================================================================
-- INSERT Query Examples (DO NOT RUN WITHOUT REPLACING visit_id!)
-- ============================================================================

-- ⚠️ WARNING: DO NOT RUN THESE QUERIES WITHOUT REPLACING THE visit_id!
-- STEP 1: First run the SELECT queries above to find a valid visit_id
-- STEP 2: Copy one of the examples below and replace with your actual visit_id

/*
-- Example INSERT query - UNCOMMENT AND MODIFY before running:
INSERT INTO public.bill_preparation (
    visit_id,
    nmi_date,
    nmi,
    nmi_answered
) VALUES (
    'REPLACE_WITH_REAL_VISIT_ID',  -- Get this from SELECT query above
    TO_DATE('19-09-2025', 'DD-MM-YYYY'),
    'NMI123456',
    'Yes'
);
*/

-- ============================================================================
-- UPDATE Query Examples (DO NOT RUN WITHOUT REPLACING visit_id!)
-- ============================================================================

/*
-- Example UPDATE query - UNCOMMENT AND MODIFY before running:
UPDATE public.bill_preparation
SET
    nmi_date = TO_DATE('19-09-2025', 'DD-MM-YYYY'),
    nmi = 'NMI789012',
    nmi_answered = 'Yes',
    updated_at = NOW()
WHERE visit_id = 'REPLACE_WITH_REAL_VISIT_ID';  -- Get this from SELECT query above
*/

-- ============================================================================
-- SELECT Query Examples
-- ============================================================================

-- Query to check NMI tracking data
SELECT
    visit_id,
    nmi_date,
    nmi,
    nmi_answered,
    created_at,
    updated_at
FROM public.bill_preparation
WHERE nmi_date IS NOT NULL
ORDER BY nmi_date DESC;

-- Query to find pending NMI responses
SELECT
    visit_id,
    nmi_date,
    nmi,
    nmi_answered
FROM public.bill_preparation
WHERE nmi_answered IN ('Pending', 'Please Select')
   OR nmi_answered IS NULL;