-- Manual SQL execution for Supabase Dashboard
-- Execute these commands in the SQL Editor one by one

-- 1. Create ayushman_consultants table (if not exists)
CREATE TABLE IF NOT EXISTS public.ayushman_consultants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    department VARCHAR(255),
    contact_info TEXT,
    tpa_rate DECIMAL(10,2),
    non_nabh_rate DECIMAL(10,2),
    nabh_rate DECIMAL(10,2),
    private_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Disable RLS for ayushman_consultants
ALTER TABLE public.ayushman_consultants DISABLE ROW LEVEL SECURITY;

-- 3. Create indexes for ayushman_consultants
CREATE INDEX IF NOT EXISTS idx_ayushman_consultants_name ON public.ayushman_consultants(name);
CREATE INDEX IF NOT EXISTS idx_ayushman_consultants_specialty ON public.ayushman_consultants(specialty);
CREATE INDEX IF NOT EXISTS idx_ayushman_consultants_department ON public.ayushman_consultants(department);
CREATE INDEX IF NOT EXISTS idx_ayushman_consultants_created_at ON public.ayushman_consultants(created_at);

-- 4. Create trigger function for ayushman_consultants
CREATE OR REPLACE FUNCTION update_ayushman_consultants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for ayushman_consultants
CREATE TRIGGER trigger_ayushman_consultants_updated_at
    BEFORE UPDATE ON public.ayushman_consultants
    FOR EACH ROW
    EXECUTE FUNCTION update_ayushman_consultants_updated_at();

-- 6. Grant permissions for ayushman_consultants
GRANT ALL ON public.ayushman_consultants TO authenticated;
GRANT ALL ON public.ayushman_consultants TO service_role;

-- 7. Verify ayushman_surgeons table exists and has proper structure
SELECT COUNT(*) as ayushman_surgeons_count FROM public.ayushman_surgeons;

-- 8. Verify ayushman_consultants table exists and has proper structure
SELECT COUNT(*) as ayushman_consultants_count FROM public.ayushman_consultants;

-- 9. Show table structures
\d public.ayushman_surgeons;
\d public.ayushman_consultants;