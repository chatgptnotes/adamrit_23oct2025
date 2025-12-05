-- Create Diagnosis table
CREATE TABLE IF NOT EXISTS public.diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Complications table
CREATE TABLE IF NOT EXISTS public.complications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    diagnosis_id UUID REFERENCES public.diagnoses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Lab Investigations table
CREATE TABLE IF NOT EXISTS public.lab_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    complication_id UUID REFERENCES public.complications(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Radiology Investigations table
CREATE TABLE IF NOT EXISTS public.radiology_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    complication_id UUID REFERENCES public.complications(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Medications table
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    complication_id UUID REFERENCES public.complications(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_complications_diagnosis_id ON public.complications(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_lab_investigations_complication_id ON public.lab_investigations(complication_id);
CREATE INDEX IF NOT EXISTS idx_radiology_investigations_complication_id ON public.radiology_investigations(complication_id);
CREATE INDEX IF NOT EXISTS idx_medications_complication_id ON public.medications(complication_id);

-- Add triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diagnoses_updated_at
    BEFORE UPDATE ON public.diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complications_updated_at
    BEFORE UPDATE ON public.complications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_investigations_updated_at
    BEFORE UPDATE ON public.lab_investigations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_radiology_investigations_updated_at
    BEFORE UPDATE ON public.radiology_investigations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON public.medications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radiology_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming authenticated users can read all data)
CREATE POLICY "Enable read access for all authenticated users" ON public.diagnoses
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all authenticated users" ON public.complications
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all authenticated users" ON public.lab_investigations
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all authenticated users" ON public.radiology_investigations
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for all authenticated users" ON public.medications
    FOR SELECT
    TO authenticatedalign the remaining rows 
    USING (true); 
