-- Quick check for junction table existence and structure

-- 1. Check if junction table exists
SELECT 
    'JUNCTION TABLE EXISTS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'visit_clinical_services' 
            AND table_schema = 'public'
        ) THEN 'YES' 
        ELSE 'NO' 
    END as result;

-- 2. Check table structure if it exists
SELECT 'JUNCTION TABLE COLUMNS' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'visit_clinical_services' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check for foreign key constraints
SELECT 'FOREIGN KEY CONSTRAINTS' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'visit_clinical_services'
    AND tc.table_schema = 'public';

-- 4. Check RLS policies
SELECT 'RLS POLICIES' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'visit_clinical_services' 
    AND schemaname = 'public';

-- 5. Quick data check
SELECT 'DATA SAMPLE' as info;
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT visit_id) as unique_visits,
    COUNT(DISTINCT clinical_service_id) as unique_services
FROM visit_clinical_services;

SELECT 'SCHEMA CHECK COMPLETE' as status;