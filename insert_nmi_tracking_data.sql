-- ============================================================================
-- Insert/Update NMI Tracking Data into Supabase bill_preparation table
-- ============================================================================

-- The bill_preparation table already has these NMI columns:
-- - nmi_date (DATE)
-- - nmi (TEXT)
-- - nmi_answered (TEXT)

-- ============================================================================
-- For the record shown in Supabase (id: cee50a67-c472-49e1-9224-c6ad6d8f80eb)
-- ============================================================================

-- Option 1: UPDATE existing record with NMI data
UPDATE public.bill_preparation
SET
    nmi_date = CURRENT_DATE,  -- Or use specific date: TO_DATE('19-09-2025', 'DD-MM-YYYY')
    nmi = 'Your NMI Value Here',  -- Enter the actual NMI value
    nmi_answered = 'Please Select',  -- Options: 'Yes', 'No', 'Pending', 'Please Select'
    updated_at = NOW()
WHERE id = 'cee50a67-c472-49e1-9224-c6ad6d8f80eb';

-- ============================================================================
-- For creating a new record with NMI data
-- ============================================================================

-- Option 2: INSERT new record (requires valid visit_id)
-- First, get a valid visit_id that doesn't have billing data yet:
SELECT v.visit_id, p.name as patient_name, v.visit_date
FROM public.visits v
JOIN public.patients p ON v.patient_id = p.id
LEFT JOIN public.bill_preparation bp ON v.visit_id = bp.visit_id
WHERE bp.visit_id IS NULL  -- Only visits without billing data
ORDER BY v.visit_date DESC
LIMIT 10;

-- Then INSERT with NMI data:
/*
INSERT INTO public.bill_preparation (
    visit_id,
    nmi_date,
    nmi,
    nmi_answered,
    created_at,
    updated_at
) VALUES (
    'YOUR_VISIT_ID',  -- Replace with actual visit_id from query above
    CURRENT_DATE,  -- Or use TO_DATE('19-09-2025', 'DD-MM-YYYY')
    'Your NMI Value',  -- Enter the NMI value
    'Yes',  -- Or 'No', 'Pending', 'Please Select'
    NOW(),
    NOW()
);
*/

-- ============================================================================
-- Verify the data was saved
-- ============================================================================

-- Check the updated/inserted record:
SELECT
    id,
    visit_id,
    nmi_date,
    nmi,
    nmi_answered,
    updated_at
FROM public.bill_preparation
WHERE id = 'cee50a67-c472-49e1-9224-c6ad6d8f80eb'
   OR nmi_date IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================================================
-- Bulk update for multiple records
-- ============================================================================

-- If you need to update multiple records at once:
/*
UPDATE public.bill_preparation
SET
    nmi_date = CURRENT_DATE,
    nmi = 'Bulk NMI Value',
    nmi_answered = 'Pending',
    updated_at = NOW()
WHERE visit_id IN (
    'VISIT_ID_1',
    'VISIT_ID_2',
    'VISIT_ID_3'
);
*/