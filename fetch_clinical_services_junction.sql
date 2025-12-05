-- Fetch Clinical Services using Junction Table Approach
-- This will replace the foreign key approach with proper junction table queries

-- 1. CHECK if junction table has data
SELECT 
    'Junction Table Status' as info,
    COUNT(*) as total_records,
    COUNT(DISTINCT visit_id) as unique_visits,
    COUNT(DISTINCT clinical_service_id) as unique_services
FROM public.visit_clinical_services;

-- 2. CHECK specific visit data (replace D8270904 with actual visit_id)
-- First get the visit UUID
SELECT 
    'Visit UUID Lookup' as info,
    id as visit_uuid,
    visit_id as visit_text_id,
    patient_name
FROM public.visits 
WHERE visit_id = 'D8270904';

-- 3. FETCH clinical services for specific visit (MAIN QUERY)
-- Replace D8270904 with your actual visit_id
SELECT 
    vcs.id as junction_id,
    vcs.visit_id as visit_uuid,
    v.visit_id as visit_text_id,
    v.patient_name,
    
    -- Service details from junction table
    vcs.clinical_service_id,
    vcs.quantity,
    vcs.rate_used,
    vcs.rate_type,
    vcs.amount,
    vcs.external_requisition,
    vcs.selected_at,
    
    -- Service details from master table
    cs.service_name,
    cs.tpa_rate,
    cs.private_rate,
    cs.nabh_rate,
    cs.non_nabh_rate,
    cs.status
    
FROM public.visit_clinical_services vcs
JOIN public.visits v ON vcs.visit_id = v.id
JOIN public.clinical_services cs ON vcs.clinical_service_id = cs.id
WHERE v.visit_id = 'D8270904'
ORDER BY vcs.selected_at DESC;

-- 4. CHECK all recent visits with clinical services
SELECT 
    'Recent Clinical Services Data' as info,
    v.visit_id,
    v.patient_name,
    COUNT(vcs.id) as clinical_services_count,
    STRING_AGG(cs.service_name, ', ') as service_names
FROM public.visits v
LEFT JOIN public.visit_clinical_services vcs ON v.id = vcs.visit_id
LEFT JOIN public.clinical_services cs ON vcs.clinical_service_id = cs.id
WHERE v.created_at > NOW() - INTERVAL '7 days'
GROUP BY v.id, v.visit_id, v.patient_name
HAVING COUNT(vcs.id) > 0
ORDER BY v.created_at DESC
LIMIT 10;

-- 5. SUPABASE QUERY for FinalBill.tsx (JavaScript/TypeScript)
-- This is the query that should be used in FinalBill.tsx:

/*
// Step 1: Get visit UUID from visit_id
const { data: visitData } = await supabase
  .from('visits')
  .select('id, visit_id')
  .eq('visit_id', visitId)
  .single();

// Step 2: Get clinical services from junction table
const { data: clinicalServicesData } = await supabase
  .from('visit_clinical_services')
  .select(`
    id,
    clinical_service_id,
    quantity,
    rate_used,
    rate_type,
    amount,
    external_requisition,
    selected_at,
    clinical_services!clinical_service_id (
      id,
      service_name,
      tpa_rate,
      private_rate,
      nabh_rate,
      non_nabh_rate
    )
  `)
  .eq('visit_id', visitData.id)
  .order('selected_at', { ascending: false });
*/

-- 6. VERIFY junction table structure
SELECT 
    'Junction Table Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'visit_clinical_services' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. TEST query with sample data
-- Insert sample data for testing (optional - only if no data exists)
-- DO NOT run this if you already have data in the tables!

/*
-- Sample insert (ONLY for testing)
INSERT INTO public.visit_clinical_services (
    visit_id, 
    clinical_service_id, 
    quantity, 
    rate_used, 
    rate_type, 
    amount
) VALUES (
    (SELECT id FROM visits WHERE visit_id = 'D8270904' LIMIT 1),
    (SELECT id FROM clinical_services WHERE service_name LIKE '%vaccination%' LIMIT 1),
    1,
    500.00,
    'private',
    500.00
);
*/

-- INSTRUCTIONS:
-- 1. Run queries 1-4 to check current data status
-- 2. Update visit_id 'D8270904' with your actual visit ID  
-- 3. Use the Supabase query structure in FinalBill.tsx
-- 4. Query 5 shows the exact code to use in TypeScript